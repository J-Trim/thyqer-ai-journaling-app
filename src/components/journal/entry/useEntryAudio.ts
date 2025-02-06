import { useState } from "react";

export const useEntryAudio = (audioUrl: string | null | undefined) => {
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Audio button clicked:`, {
      audioUrl,
      currentShowAudioPlayer: showAudioPlayer,
      willShow: !showAudioPlayer
    });
    setShowAudioPlayer(!showAudioPlayer);
  };

  return {
    showAudioPlayer,
    handleAudioClick
  };
};