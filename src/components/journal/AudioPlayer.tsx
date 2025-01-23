import React, { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer = ({ audioUrl }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      // Initialize audio element
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
      
      // Reset when URL changes
      audioRef.current.pause();
      setIsPlaying(false);
      audioRef.current.load();
      
      // Add event listeners
      const audio = audioRef.current;
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      return () => {
        // Cleanup event listeners
        audio.removeEventListener('play', () => setIsPlaying(true));
        audio.removeEventListener('pause', () => setIsPlaying(false));
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [audioUrl, volume, isMuted]);

  const togglePlay = async () => {
    if (audioRef.current) {
      try {
        console.log('Attempting to toggle play state...');
        if (isPlaying) {
          console.log('Pausing audio...');
          await audioRef.current.pause();
        } else {
          console.log('Playing audio...');
          await audioRef.current.play();
        }
      } catch (error) {
        console.error('Error toggling audio playback:', error);
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const volumeValue = newVolume[0];
    if (audioRef.current) {
      audioRef.current.volume = volumeValue;
      setVolume(volumeValue);
      if (volumeValue === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const handleEnded = () => {
    console.log('Audio playback ended');
    setIsPlaying(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio playback error:', e);
    setIsPlaying(false);
  };

  return (
    <div className="p-4 bg-secondary rounded-lg space-y-4">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
      />
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="hover:bg-primary/20"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="hover:bg-primary/20"
        >
          {isMuted ? (
            <VolumeX className="h-6 w-6" />
          ) : (
            <Volume2 className="h-6 w-6" />
          )}
        </Button>
        <div className="flex-1 px-4">
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;