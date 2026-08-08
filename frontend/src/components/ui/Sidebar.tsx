"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { PixelIcon, type PixelIconName } from "./PixelIcon";
import { ConnectWalletButton } from "./WalletControls";
import { useAuthState } from "@/components/auth/useAuthState";
import { isPrivyConfigured } from "@/app/providers";

type NavItem = { href: string; label: string; icon: PixelIconName; artistOnly?: boolean };

const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "HOME", icon: "home" },
  { href: "/catalog", label: "CATALOG", icon: "catalog" },
  { href: "/trending", label: "TRENDING", icon: "trending" },
  { href: "/topup", label: "TOP UP", icon: "topup" },
  { href: "/playlists", label: "PLAYLISTS", icon: "playlist" },
  { href: "/dashboard", label: "DASHBOARD", icon: "dashboard", artistOnly: true },
  { href: "/register", label: "REGISTER SONG", icon: "register", artistOnly: true },
  { href: "/admin", label: "ADMIN", icon: "admin" },
];

function NavLink({
  href,
  label,
  icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: PixelIconName;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
    >
      <PixelIcon name={icon} size={16} />
      <span>{label}</span>
    </Link>
  );
}

// Only mounted when Privy is configured — isolates the useAuthState() call
// (which throws without PrivyProvider) behind normal conditional rendering
// instead of a conditional hook call. Mirrors AuthBoundary/AuthUnavailable.
function ArtistNavGate({ children }: { children: (isArtist: boolean) => React.ReactNode }) {
  const { profile } = useAuthState();
  return <>{children(profile?.role === "artist")}</>;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { address } = useAccount();

  const renderItems = (isArtist: boolean) => {
    const items = NAV_ITEMS.filter((item) => !item.artistOnly || isArtist);
    return items.map((item) => (
      <NavLink
        key={item.href}
        href={item.href}
        label={item.label}
        icon={item.icon}
        active={pathname.startsWith(item.href)}
        onNavigate={onNavigate}
      />
    ));
  };

  return (
    <div className="flex flex-col h-full">
      <Link href="/home" onClick={onNavigate} className="flex items-center gap-3 px-5 h-[84px] border-b-[3px] border-ink shrink-0">
        <PixelIcon name="catalog" size={22} className="text-purple" />
        <span className="font-display text-[13px] leading-tight">
          CLEAR<span className="text-purple">TUNE</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-1 px-3 py-4 overflow-y-auto flex-1">
        {isPrivyConfigured ? <ArtistNavGate>{renderItems}</ArtistNavGate> : renderItems(false)}
        {address && (
          <NavLink
            href={`/u/${address}`}
            label="MY PROFILE"
            icon="profile"
            active={pathname === `/u/${address}`}
            onNavigate={onNavigate}
          />
        )}
      </nav>

      <div className="px-3 py-4 border-t-[3px] border-ink shrink-0 flex justify-center">
        <ConnectWalletButton compact />
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop: sticky left panel */}
      <aside className="hidden md:flex md:flex-col md:sticky md:top-0 md:h-screen md:w-[248px] md:shrink-0 border-r-[3px] border-ink bg-void z-20">
        <SidebarContent />
      </aside>

      {/* Mobile: top bar + slide-in drawer */}
      <header className="md:hidden flex items-center justify-between border-b-[3px] border-ink px-4 py-4 bg-void sticky top-0 z-30">
        <Link href="/home" className="flex items-center gap-2">
          <PixelIcon name="catalog" size={18} className="text-purple" />
          <span className="font-display text-[11px]">
            CLEAR<span className="text-purple">TUNE</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ConnectWalletButton compact />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
            className="btn btn-outline !p-3 !shadow-none"
          >
            <PixelIcon name="menu" size={16} />
          </button>
        </div>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-[260px] max-w-[80vw] bg-void border-r-[3px] border-ink h-full">
            <div className="flex items-center justify-end px-3 py-3 border-b-[3px] border-ink">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="btn btn-outline !p-2 !shadow-none"
              >
                <PixelIcon name="close" size={14} />
              </button>
            </div>
            <div className="h-[calc(100%-57px)]">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
            className="flex-1 bg-void/80"
          />
        </div>
      )}
    </>
  );
}
