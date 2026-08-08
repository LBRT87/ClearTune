"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { PixelIcon, type PixelIconName } from "./PixelIcon";
import { ConnectWalletButton } from "./WalletControls";
import { useAuthState } from "@/components/auth/useAuthState";
import { isPrivyConfigured } from "@/app/providers";
import { CLEARTUNE_ADDRESS, clearTuneAbi } from "@/lib/contracts";

type NavItem = { href: string; label: string; icon: PixelIconName; artistOnly?: boolean };

// CATALOG is reachable via BROWSE (top bar) and "SHOW ALL" on /home, so it's
// dropped from the main nav rather than duplicated here. ADMIN is handled
// separately below: only shown to the wallet that's actually the on-chain
// contract owner, not listed here.
const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "HOME", icon: "home" },
  { href: "/trending", label: "TRENDING", icon: "trending" },
  { href: "/topup", label: "TOP UP", icon: "topup" },
  { href: "/playlists", label: "PLAYLISTS", icon: "playlist" },
  { href: "/dashboard", label: "DASHBOARD", icon: "dashboard", artistOnly: true },
  { href: "/register", label: "REGISTER SONG", icon: "register", artistOnly: true },
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

// Explicit, clearly-labeled logout — the wallet button alone (icon + address)
// wasn't obviously "click this to log out". Same Privy-configured gating as
// ArtistNavGate, for the same reason (usePrivy() throws without a provider).
function LogoutButton() {
  const { authenticated, logout } = usePrivy();
  const router = useRouter();
  if (!authenticated) return null;

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="px-3 py-4 border-t-[3px] border-ink shrink-0">
      <button type="button" onClick={handleLogout} className="btn btn-outline w-full !shadow-none">
        LOGOUT
      </button>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { address } = useAccount();
  const { data: owner } = useReadContract({
    address: CLEARTUNE_ADDRESS,
    abi: clearTuneAbi,
    functionName: "owner",
  });
  const isOwner = !!address && !!owner && address.toLowerCase() === (owner as string).toLowerCase();

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
        {isOwner && (
          <NavLink
            href="/admin"
            label="ADMIN"
            icon="admin"
            active={pathname.startsWith("/admin")}
            onNavigate={onNavigate}
          />
        )}
      </nav>

      {isPrivyConfigured && <LogoutButton />}
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
