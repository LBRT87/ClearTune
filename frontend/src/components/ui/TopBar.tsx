"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWalletButton } from "./WalletControls";
import { GlobalSearch } from "./GlobalSearch";
import { PixelIcon } from "./PixelIcon";

// Desktop-only strip pinned to the top of the content column, next to the
// left sidebar. On /home, BROWSE lives as an icon inside the search pill
// itself (divider + icon, right of the input) instead of a separate button.
// Elsewhere (no search bar to embed it in) it's a standalone icon button.
// The `flex-1` spacer (not `justify-content`) is what pins wallet to the
// right — search has its own max-width cap, so relying on justify-end here
// would center the whole cluster in the leftover space instead of hugging
// the left edge.
export function TopBar() {
  const pathname = usePathname();
  const onHome = pathname === "/home";

  return (
    <div className="hidden md:flex items-center gap-4 h-[84px] border-b-[3px] border-ink px-6 sticky top-0 bg-void z-10">
      {onHome && (
        <GlobalSearch
          className="ml-12"
          trailing={
            <Link href="/catalog" aria-label="Browse katalog" className="sidebar-lookup-trailing">
              <PixelIcon name="catalog" size={18} />
            </Link>
          }
        />
      )}
      <div className="flex-1" />
      {!onHome && (
        <Link href="/catalog" aria-label="Browse katalog" className="btn btn-outline !shadow-none !p-3 shrink-0">
          <PixelIcon name="catalog" size={18} />
        </Link>
      )}
      <button
        type="button"
        title="Notifikasi (segera hadir)"
        aria-label="Notifikasi"
        className="relative btn btn-outline !shadow-none !p-3 shrink-0"
      >
        <PixelIcon name="bell" size={18} />
        <span className="icon-btn-badge" />
      </button>
      <button
        type="button"
        title="Teman (segera hadir)"
        aria-label="Teman"
        className="btn btn-outline !shadow-none !p-3 shrink-0"
      >
        <PixelIcon name="friends" size={18} />
      </button>
      <div className="shrink-0 min-w-0 max-w-[190px]">
        <ConnectWalletButton />
      </div>
    </div>
  );
}
