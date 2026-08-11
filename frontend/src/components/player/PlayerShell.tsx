"use client";

import { PlayerProvider, usePlayer } from "@/lib/player/PlayerContext";
import { GlobalPlayerBar } from "./GlobalPlayerBar";

function ContentArea({ children }: { children: React.ReactNode }) {
  const { currentSong } = usePlayer();
  return <div className={currentSong ? "pb-24 md:pb-20" : ""}>{children}</div>;
}

export function PlayerShell({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <ContentArea>{children}</ContentArea>
      <GlobalPlayerBar />
    </PlayerProvider>
  );
}
