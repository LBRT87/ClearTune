-- ClearTune — Postgres schema (project-spec.md section 4.3).
-- Run this once in the Supabase SQL editor (or `supabase db push`) after
-- creating the project. Writes happen write-through from the Next.js API
-- routes at play-report/withdraw time — there is no external indexer.

create type funded_by_t as enum ('subscription', 'treasury');

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

create table if not exists plays (
  id               bigserial primary key,
  wallet           text not null,
  song_id          bigint not null references songs (song_id_onchain),
  played_at        timestamptz not null default now(),
  duration_played  integer, -- seconds
  completed        boolean not null default false,
  funded_by        funded_by_t not null,
  tx_hash          text,
  status           text not null default 'confirmed'
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
  event_type   text not null, -- 'fee_in' | 'free_play_out' | 'manual_fund'
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
create policy "public read playlists" on playlists for select using (true);
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
alter table plays enable row level security;
alter table wallet_stats enable row level security;
alter table chart_cache enable row level security;
alter table treasury_log enable row level security;
alter table funding_edges enable row level security;

create policy "public read songs" on songs for select using (true);
create policy "public read plays" on plays for select using (true);
create policy "public read wallet_stats" on wallet_stats for select using (true);
create policy "public read chart_cache" on chart_cache for select using (true);
create policy "public read treasury_log" on treasury_log for select using (true);
create policy "public read funding_edges" on funding_edges for select using (true);

-- `cover_url` on songs/playlists — added after the initial schema, so this is
-- an explicit ALTER (not just part of the CREATE TABLE above) to stay safe to
-- re-run against a database that was already seeded.
alter table songs add column if not exists cover_url text;
alter table playlists add column if not exists cover_url text;

-- Storage bucket for song/playlist cover images, uploaded directly from the
-- client (same pattern as the pre-existing `audio` bucket). Public bucket,
-- public read, public insert — matches this app's "no signature-based auth"
-- posture elsewhere (see the playlists comment above). If you'd rather do
-- this by hand, it's Storage -> New bucket -> name `covers`, toggle Public.
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

create policy "public read covers" on storage.objects
  for select using (bucket_id = 'covers');
create policy "public upload covers" on storage.objects
  for insert with check (bucket_id = 'covers');
