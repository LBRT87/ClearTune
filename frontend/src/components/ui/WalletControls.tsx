"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PixelIcon } from "./PixelIcon";

// `compact` renders an icon-only coin button (for tight mobile top bars);
// otherwise it's the full "CONNECT WALLET" pixel button.
export function ConnectWalletButton({ compact = false }: { compact?: boolean }) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

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
                aria-label="Connect wallet"
                className={`btn btn-warn flex items-center justify-center gap-3 ${compact ? "!p-3 !shadow-none" : "w-full"}`}
              >
                <PixelIcon name="coin" size={16} />
                {!compact && <span>CONNECT WALLET</span>}
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                type="button"
                aria-label="Wrong network"
                className={`btn btn-danger flex items-center justify-center gap-3 ${compact ? "!p-3 !shadow-none" : "w-full"}`}
              >
                <PixelIcon name="coin" size={16} />
                {!compact && <span>JARINGAN SALAH</span>}
              </button>
            ) : compact ? (
              <button
                onClick={openAccountModal}
                type="button"
                aria-label={account.displayName}
                className="btn btn-warn !p-3 !shadow-none flex items-center justify-center gap-3"
              >
                <PixelIcon name="coin" size={16} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={openChainModal} type="button" className="sidebar-chain-btn">
                  {chain.hasIcon && chain.iconUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={chain.name ?? "chain"} src={chain.iconUrl} className="w-4 h-4" />
                  )}
                  {chain.name}
                </button>
                <button onClick={openAccountModal} type="button" className="btn btn-warn flex items-center justify-center gap-3 whitespace-nowrap">
                  <PixelIcon name="coin" size={16} />
                  <span>{account.displayName}</span>
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
