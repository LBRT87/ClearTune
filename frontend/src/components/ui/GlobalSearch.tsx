"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PixelIcon } from "./PixelIcon";

type SearchResult = { id: number; title: string; artist: string };

export function GlobalSearch({
  className = "",
  size = "default",
  trailing,
}: {
  className?: string;
  size?: "default" | "lg";
  trailing?: React.ReactNode;
}) {
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled) setResults(data.results ?? []);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goTo(id: number) {
    router.push(`/song/${id}`);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className={`relative w-full ${size === "lg" ? "max-w-none" : "max-w-xl"} ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) goTo(results[0].id);
        }}
        className={`sidebar-lookup ${size === "lg" ? "sidebar-lookup-lg" : ""}`}
      >
        <PixelIcon name="search" size={size === "lg" ? 18 : 13} className="text-dim shrink-0" />
        <input
          type="text"
          placeholder="Cari judul lagu atau nama artis..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="sidebar-lookup-input"
        />
        {trailing && (
          <>
            <span className="sidebar-lookup-divider" />
            {trailing}
          </>
        )}
      </form>

      {open && query.trim().length >= 2 && (
        <div className="search-results">
          {results.length === 0 ? (
            <div className="search-result-row search-result-empty">Tidak ada hasil untuk &ldquo;{query}&rdquo;</div>
          ) : (
            results.map((r) => (
              <button key={r.id} type="button" onClick={() => goTo(r.id)} className="search-result-row">
                <span className="font-display text-[11px]">{r.title.toUpperCase()}</span>
                <span className="artist">{r.artist}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
