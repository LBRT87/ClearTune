-- ClearTune — Postgres schema (project-spec.md section 4.3).
-- Run this once in the Supabase SQL editor (or `supabase db push`) after
-- creating the project. Writes happen write-through from the Next.js API
-- routes at play-report/withdraw time — there is no external indexer.

-- Postgres has no `CREATE TYPE IF NOT EXISTS` — this whole file is meant to
-- be safe to re-run (e.g. after adding a new table), so every non-idempotent
-- statement below is wrapped the same way.
do $$ begin
  create type play_status_t as enum ('paid', 'skipped_low_balance');
exception when duplicate_object then null;
end $$;

-- Beyond the spec's explicit table list: Privy auth + role picker (artist vs
-- listener). Server-only — the client never has service_role, so this is
-- never read/written except through app/api/profile/route.ts. RLS is
-- enabled with zero policies on purpose: that blocks the anon key entirely
-- and only service_role (which bypasses RLS) can touch it.
create table if not exists profiles (
  privy_did    text primary key,
  wallet       text unique,
  role         text not null check (role in ('artist', 'listener')),
  display_name text not null,
  funded_at    timestamptz,
  created_at   timestamptz not null default now()
);
-- Artist display names must be unique (checked in app/api/profile/route.ts
-- via the 23505/display_name error path); listeners can share a name.
create unique index if not exists profiles_artist_name_unique
  on profiles (lower(display_name))
  where role = 'artist';

alter table profiles enable row level security;

create table if not exists songs (
  id              bigserial primary key,
  song_id_onchain bigint unique not null,
  title           text not null,
  artist          text not null,
  duration        integer, -- seconds
  storage_url     text not null,
  cover_url       text, -- optional, uploaded to the `covers` bucket at register time
  created_at      timestamptz not null default now()
);

-- Off-chain-only metadata for each on-chain payee: the contract's `payees`/
-- `bps` arrays are the source of truth for money, this is display metadata
-- (name, role) matched to them by array index. See project-spec.md section
-- 4.3 "Catatan kredit".
create table if not exists song_credits (
  id           bigserial primary key,
  song_id      bigint not null references songs (song_id_onchain),
  payee_index  integer not null,
  wallet       text not null,
  role         text not null,
  display_name text,
  bps          integer not null
);
create index if not exists song_credits_song_idx on song_credits (song_id);

create table if not exists plays (
  id               bigserial primary key,
  wallet           text not null,
  song_id          bigint not null references songs (song_id_onchain),
  played_at        timestamptz not null default now(),
  duration_played  integer, -- seconds
  completed        boolean not null default false,
  status           play_status_t not null,
  tx_hash          text
);
create index if not exists plays_wallet_idx on plays (wallet);
create index if not exists plays_song_idx on plays (song_id);
create index if not exists plays_played_at_idx on plays (played_at);

create table if not exists wallet_stats (
  wallet      text primary key,
  entropy     double precision,
  cv_gap      double precision,
  skip_ratio  double precision,
  first_seen  timestamptz not null default now(),
  funder      text, -- wallet that funded this wallet's first top-up, if known
  trust_score double precision
);

create table if not exists chart_cache (
  song_id        bigint not null references songs (song_id_onchain),
  period         text not null, -- e.g. '2026-08'
  weighted_score double precision not null,
  rank           integer,
  updated_at     timestamptz not null default now(),
  primary key (song_id, period)
);

create table if not exists treasury_log (
  id           bigserial primary key,
  event_type   text not null, -- 'fee_in' | 'treasury_withdrawn'
  amount       numeric(38, 6) not null,
  balance_after numeric(38, 6) not null,
  created_at   timestamptz not null default now()
);

-- Beyond the spec's explicit table list: user-created playlists (not in
-- project-spec.md, added on direct request). Ownership is just the wallet
-- string, checked in the API routes — there's no signature-based auth here,
-- consistent with this being a hackathon demo.
create table if not exists playlists (
  id           bigserial primary key,
  owner_wallet text not null,
  name         text not null,
  cover_url    text, -- optional, uploaded to the `covers` bucket at creation time
  created_at   timestamptz not null default now()
);
create index if not exists playlists_owner_idx on playlists (owner_wallet);

create table if not exists playlist_songs (
  playlist_id bigint not null references playlists (id) on delete cascade,
  song_id     bigint not null references songs (song_id_onchain),
  added_at    timestamptz not null default now(),
  primary key (playlist_id, song_id)
);

alter table playlists enable row level security;
alter table playlist_songs enable row level security;
drop policy if exists "public read playlists" on playlists;
create policy "public read playlists" on playlists for select using (true);
drop policy if exists "public read playlist_songs" on playlist_songs;
create policy "public read playlist_songs" on playlist_songs for select using (true);

-- Beyond the spec's explicit table list: backs the 5.3 funding-graph
-- detection (BFS 2-hop) — records wallet-to-wallet mUSD transfers observed
-- off-chain (e.g. a funder topping up many listener wallets before they play).
create table if not exists funding_edges (
  id         bigserial primary key,
  from_wallet text not null,
  to_wallet   text not null,
  amount      numeric(38, 6),
  tx_hash     text,
  created_at  timestamptz not null default now()
);
create index if not exists funding_edges_from_idx on funding_edges (from_wallet);
create index if not exists funding_edges_to_idx on funding_edges (to_wallet);

-- Row Level Security: public read (this is a "see other users' profiles,
-- like Spotify" product), writes only via the service role key from API
-- routes.
alter table songs enable row level security;
alter table song_credits enable row level security;
alter table plays enable row level security;
alter table wallet_stats enable row level security;
alter table chart_cache enable row level security;
alter table treasury_log enable row level security;
alter table funding_edges enable row level security;

drop policy if exists "public read songs" on songs;
create policy "public read songs" on songs for select using (true);
drop policy if exists "public read song_credits" on song_credits;
create policy "public read song_credits" on song_credits for select using (true);
drop policy if exists "public read plays" on plays;
create policy "public read plays" on plays for select using (true);
drop policy if exists "public read wallet_stats" on wallet_stats;
create policy "public read wallet_stats" on wallet_stats for select using (true);
drop policy if exists "public read chart_cache" on chart_cache;
create policy "public read chart_cache" on chart_cache for select using (true);
drop policy if exists "public read treasury_log" on treasury_log;
create policy "public read treasury_log" on treasury_log for select using (true);
drop policy if exists "public read funding_edges" on funding_edges;
create policy "public read funding_edges" on funding_edges for select using (true);

-- `cover_url` on songs/playlists — added after the initial schema, so this is
-- an explicit ALTER (not just part of the CREATE TABLE above) to stay safe to
-- re-run against a database that was already seeded.
alter table songs add column if not exists cover_url text;
alter table playlists add column if not exists cover_url text;

-- Storage buckets for song audio and cover images, uploaded directly from
-- the client. Public bucket, public read, public insert — matches this
-- app's "no signature-based auth" posture elsewhere (see the playlists
-- comment above). If you'd rather do this by hand, it's Storage -> New
-- bucket -> name `audio` / `covers`, toggle Public.
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true), ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "public read audio" on storage.objects;
create policy "public read audio" on storage.objects
  for select using (bucket_id = 'audio');
drop policy if exists "public upload audio" on storage.objects;
create policy "public upload audio" on storage.objects
  for insert with check (bucket_id = 'audio');

drop policy if exists "public read covers" on storage.objects;
create policy "public read covers" on storage.objects
  for select using (bucket_id = 'covers');
drop policy if exists "public upload covers" on storage.objects;
create policy "public upload covers" on storage.objects
  for insert with check (bucket_id = 'covers');
