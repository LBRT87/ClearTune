"use client";

import { ConnectWalletButton } from "./WalletControls";
import { GlobalSearch } from "./GlobalSearch";

// Desktop-only strip pinned to the top of the content column, next to the
// left sidebar. Grid keeps the search field mathematically centered no
// matter how wide the connect-wallet button gets (address vs. "CONNECT
// WALLET" text) — flex-1 on both sides would drift once content differs.
// Height matches the sidebar's logo row exactly so the two border-b lines
// form one continuous line across the page instead of a jagged step.
export function TopBar() {
  return (
    <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center h-[84px] border-b-[3px] border-ink px-6 sticky top-0 bg-void z-10">
      <div />
      <GlobalSearch className="justify-self-center" />
      <div className="w-56 justify-self-end">
        <ConnectWalletButton />
      </div>
    </div>
  );
}
