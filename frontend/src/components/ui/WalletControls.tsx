"use client";

/* Tombol wallet — dulu RainbowKit `ConnectButton.Custom`, sekarang Privy.
 *
 * Nama ekspor, prop, dan seluruh class CSS-nya sengaja dipertahankan persis
 * supaya pemakainya tidak perlu diubah. Yang berganti cuma isi modalnya:
 * "connect wallet" jadi "login" yang menerima Google, email, ATAU wallet
 * external.
 *
 * Alamat tetap dibaca lewat `useAccount()` wagmi biasa — `@privy-io/wagmi`
 * yang menyediakan konteksnya, jadi tidak ada API khusus Privy yang bocor
 * ke komponen lain.
 */

import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { monadTestnet } from "@/lib/chains";
import { PixelIcon } from "./PixelIcon";

/** Dipakai juga oleh komponen lain yang cuma butuh "buka modal login". */
export function useConnectPrompt() {
  const { ready, authenticated, login } = usePrivy();
  return {
    ready,
    authenticated,
    /* Tidak bisa diklik sebelum Privy siap — mengkliknya saat `!ready`
       adalah cara paling mudah membuka dua modal sekaligus. */
    openConnectModal: () => {
      if (ready && !authenticated) login();
    },
  };
}

function short(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ConnectWalletButton({ compact = false }: { compact?: boolean }) {
  const { ready, authenticated, logout } = usePrivy();
  const { openConnectModal } = useConnectPrompt();
  const { address, chain } = useAccount();

  const connected = ready && authenticated && Boolean(address);
  const wrongNetwork = connected && chain !== undefined && chain.id !== monadTestnet.id;

  return (
    <div
      {...(!ready && {
        "aria-hidden": true,
        style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
      })}
    >
      {!connected ? (
        <button
          onClick={openConnectModal}
          type="button"
          aria-label="Log in"
          className={`btn btn-warn flex items-center justify-center gap-3 ${compact ? "!p-3 !shadow-none" : "w-full"}`}
        >
          <PixelIcon name="coin" size={16} />
          {!compact && <span>LOG IN</span>}
        </button>
      ) : wrongNetwork ? (
        /* Privy tidak punya "chain modal" seperti RainbowKit. Untuk embedded
           wallet keadaan ini praktis tidak terjadi — chain-nya kita yang
           tentukan — jadi yang ditampilkan cukup peringatan jujur. */
        <button
          type="button"
          aria-label="Wrong network"
          className={`btn btn-danger flex items-center justify-center gap-3 ${compact ? "!p-3 !shadow-none" : "w-full"}`}
        >
          <PixelIcon name="coin" size={16} />
          {!compact && <span>WRONG NETWORK</span>}
        </button>
      ) : compact ? (
        <button
          onClick={() => logout()}
          type="button"
          aria-label={address ? short(address) : "Account"}
          className="btn btn-warn !p-3 !shadow-none flex items-center justify-center gap-3"
        >
          <PixelIcon name="coin" size={16} />
        </button>
      ) : (
        <div className="flex items-center gap-2 min-w-0 justify-end">
          <span className="sidebar-chain-btn hidden lg:flex shrink-0">{monadTestnet.name}</span>
          <button
            onClick={() => logout()}
            type="button"
            className="btn btn-warn flex items-center justify-center gap-2 !px-3 !py-2 min-w-0"
          >
            <PixelIcon name="coin" size={14} className="shrink-0" />
            <span className="truncate min-w-0">{address ? short(address) : "ACCOUNT"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
