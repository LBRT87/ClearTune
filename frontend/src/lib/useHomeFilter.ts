"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type HomeFilter = "all" | "playlists" | "songs";

// TopBar (desktop filter pills) and the /home page (mobile filter pills +
// section visibility) are siblings under (app)/layout.tsx, not parent/child
// — a query param is the simplest way to keep them both reading/writing the
// same state without introducing a context provider.
export function useHomeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = (searchParams.get("filter") as HomeFilter | null) ?? "all";

  function setFilter(value: HomeFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("filter");
    else params.set("filter", value);
    const qs = params.toString();
    router.replace(`/home${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return { filter, setFilter };
}
