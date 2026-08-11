"use client";

import { usePlayer } from "@/lib/player/PlayerContext";
import { Button } from "@/components/ui/Button";
import { StatusLine } from "@/components/ui/StatusLine";
import type { SongRow } from "@/lib/songs";

export function SongPlayButton({ song }: { song: SongRow }) {
  const { currentSong, playing, audioStatus, reportState, txHash, playSong, togglePlay } = usePlayer();
  const isThis = currentSong?.song_id_onchain === song.song_id_onchain;
  const isPlayingThis = isThis && playing;

  function handleClick() {
    if (isThis) togglePlay();
    else playSong(song);
  }

  return (
    <div>
      <Button variant="purple" onClick={handleClick} disabled={isThis && audioStatus === "missing"}>
        {isPlayingThis ? "PAUSE" : "PLAY SONG"}
      </Button>
      <p className="text-dim text-base mt-4 mb-3">
        Play is recorded on-chain automatically once half the song has been heard. Controls stay
        available from the player bar at the bottom of the screen.
      </p>
      {isThis && audioStatus === "missing" && (
        <StatusLine variant="err" label="AUDIO COULDN'T LOAD" detail="File not found at its source." />
      )}
      {isThis && reportState === "loading" && <StatusLine variant="info" label="RECORDING PLAY ON-CHAIN..." />}
      {isThis && reportState === "done" && txHash && (
        <StatusLine
          variant="ok"
          label="PLAY RECORDED ON-CHAIN"
          detail={`tx: ${txHash.slice(0, 10)}...${txHash.slice(-6)}`}
        />
      )}
      {isThis && reportState === "error" && <StatusLine variant="err" label="FAILED TO RECORD PLAY" />}
    </div>
  );
}
