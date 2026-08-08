"use client";

import { useEffect, useState } from "react";
import { getRecentStories, latestPerArtist, type ArtistStory } from "@/lib/stories";
import { PixelAvatar } from "@/components/ui/PixelAvatar";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelLoader } from "@/components/ui/PixelLoader";

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}M`;
  return `${Math.floor(mins / 60)}J`;
}

function StoryViewer({
  stories,
  index,
  onIndexChange,
  onClose,
}: {
  stories: ArtistStory[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const active = stories[index];

  function next() {
    if (index >= stories.length - 1) onClose();
    else onIndexChange(index + 1);
  }
  function prev() {
    if (index > 0) onIndexChange(index - 1);
  }

  return (
    <div className="fixed inset-0 z-50 bg-void flex items-center justify-center">
      <div className="relative w-full h-full sm:h-[90vh] sm:max-w-sm sm:max-h-[800px] bg-void sm:border-[3px] sm:border-ink flex flex-col overflow-hidden">
        {/* Progress segments — one per story, filled solid before the active
            one, animating (auto-advance) on the active one, empty after. */}
        <div className="relative z-10 flex gap-1.5 px-3 pt-3 shrink-0">
          {stories.map((s, i) => (
            <div key={s.id} className="story-progress-track">
              <div
                key={i === index ? `active-${index}` : "static"}
                className={`story-progress-fill ${i === index ? "story-progress-fill-active" : ""}`}
                style={{ width: i < index ? "100%" : i === index ? undefined : "0%" }}
                onAnimationEnd={i === index ? next : undefined}
              />
            </div>
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-3 px-4 py-4 shrink-0">
          <PixelAvatar seed={active.artist_name} src={active.image_url} size={36} />
          <div className="min-w-0">
            <span className="font-display text-[11px] block truncate">{active.artist_name.toUpperCase()}</span>
            <span className="text-dim text-sm">{timeAgo(active.created_at)}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="ml-auto text-dim hover:text-ink">
            <PixelIcon name="close" size={16} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 overflow-hidden">
          {active.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={active.image_url} alt="" className="max-h-[55%] w-auto border-[3px] border-ink" />
          ) : (
            <PixelAvatar seed={active.artist_name} size={140} />
          )}
          {active.caption && <p className="text-center text-xl">{active.caption}</p>}
        </div>

        {/* Tap zones — left third goes back, right two-thirds advances. */}
        <button type="button" aria-label="Sebelumnya" onClick={prev} className="absolute inset-y-0 left-0 w-1/3" />
        <button type="button" aria-label="Berikutnya" onClick={next} className="absolute inset-y-0 right-0 w-2/3" />
      </div>
    </div>
  );
}

// Public — anyone can view artist stories without connecting a wallet.
// Falls back to sample stories when there's nothing live (see
// lib/stories.ts). Posting isn't wired to any UI right now — POST
// /api/stories still works if a composer gets added back later.
export function ArtistStoryBar() {
  const [stories, setStories] = useState<ArtistStory[] | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    getRecentStories().then(setStories);
  }, []);

  const perArtist = stories ? latestPerArtist(stories) : [];
  const visible = perArtist.slice(0, 3);
  const hiddenCount = perArtist.length - visible.length;

  return (
    <section className="card mb-10">
      {stories === null && (
        <div className="flex justify-center">
          <PixelLoader label="MEMUAT STORY" />
        </div>
      )}

      {stories !== null && perArtist.length === 0 && (
        <p className="text-dim text-lg text-center">Belum ada story dari artis dalam 24 jam terakhir.</p>
      )}

      {perArtist.length > 0 && (
        <div className="flex items-start justify-center gap-6">
          {visible.map((s, i) => (
            <button
              key={s.artist_wallet}
              type="button"
              onClick={() => setActiveIndex(i)}
              className="flex flex-col items-center gap-2 shrink-0"
            >
              <span className="story-bubble">
                <PixelAvatar seed={s.artist_name} src={s.image_url} size={48} />
              </span>
              <span className="font-display text-[9px] max-w-[72px] truncate">{s.artist_name}</span>
            </button>
          ))}

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveIndex(3)}
              className="flex flex-col items-center gap-2 shrink-0"
            >
              <span className="story-stack">
                <span className="story-bubble story-bubble-empty story-stack-ghost" />
                <span className="story-bubble story-stack-main">
                  <PixelAvatar seed={perArtist[3].artist_name} src={perArtist[3].image_url} size={48} />
                  <span className="story-stack-badge">+{hiddenCount}</span>
                </span>
              </span>
              <span className="font-display text-[9px] text-dim">LAINNYA</span>
            </button>
          )}
        </div>
      )}

      {activeIndex !== null && (
        <StoryViewer
          stories={perArtist}
          index={activeIndex}
          onIndexChange={setActiveIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </section>
  );
}
