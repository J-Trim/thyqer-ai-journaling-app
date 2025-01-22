import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, FileAudio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AudioRecorderProps {
  onAudioSaved?: (url: string) => void;
}

const AudioRecorder = ({ onAudioSaved }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [canTranscribe, setCanTranscribe] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startTimer = () => {
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prevTime) => prevTime + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const uploadAudio = async (audioBlob: Blob) => {
    try {
      const fileName = `${crypto.randomUUID()}.webm`;
      const { data, error } = await supabase.storage
        .from('audio_files')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (error) {
        console.error('Error uploading audio:', error);
        throw error;
      }

      console.log('Audio uploaded successfully:', fileName);
      return fileName;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const requestPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
      return true;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const hasPermissions = await requestPermissions();
        if (!hasPermissions) {
          toast({
            title: "Permission Required",
            description: "Microphone access is required for recording.",
            variant: "destructive",
          });
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } 
        });
        
        mediaRecorder.current = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        stream.getAudioTracks()[0].onended = () => {
          console.log("Audio recording interrupted");
          stopRecording();
        };

        mediaRecorder.current.start();
        setIsRecording(true);
        setIsPaused(false);
        startTimer();
        console.log("Recording started");
      } catch (error) {
        console.error("Error starting recording:", error);
        toast({
          title: "Error",
          description: "Could not start recording. Please check your microphone permissions.",
          variant: "destructive",
        });
      }
    } else if (!isPaused) {
      if (mediaRecorder.current && isRecording) {
        mediaRecorder.current.pause();
        setIsPaused(true);
        stopTimer();
        console.log("Recording paused");
      }
    } else {
      if (mediaRecorder.current && isRecording) {
        mediaRecorder.current.resume();
        setIsPaused(false);
        startTimer();
        console.log("Recording resumed");
      }
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      
      await new Promise<void>((resolve) => {
        if (mediaRecorder.current) {
          mediaRecorder.current.onstop = () => resolve();
        } else {
          resolve();
        }
      });

      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
      // Only set canTranscribe if we actually have audio data
      setCanTranscribe(audioChunks.current.length > 0 && audioChunks.current.some(chunk => chunk.size > 0));
      console.log("Recording stopped, chunks:", audioChunks.current.length);
    }
  };

  const handleTranscribe = async () => {
    // Validate that we have actual audio data
    if (!audioChunks.current.length || !audioChunks.current.some(chunk => chunk.size > 0)) {
      toast({
        title: "Error",
        description: "No audio was recorded. Please record some audio first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      // Additional validation for the blob size
      if (audioBlob.size === 0) {
        toast({
          title: "Error",
          description: "The recording is empty. Please try recording again.",
          variant: "destructive",
        });
        return;
      }

      const fileName = await uploadAudio(audioBlob);
      
      if (onAudioSaved) {
        onAudioSaved(fileName);
      }

      setRecordingTime(0);
      audioChunks.current = [];
      setCanTranscribe(false);

      toast({
        title: "Success",
        description: "Audio recording saved and transcription started",
      });
    } catch (error) {
      console.error("Error saving audio:", error);
      toast({
        title: "Error",
        description: "Failed to save audio recording",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-secondary rounded-lg shadow-sm animate-fade-in">
      <div className="text-2xl font-semibold text-text mb-4">
        {formatTime(recordingTime)}
      </div>
      <div className="flex space-x-4">
        {isRecording ? (
          <>
            <Button
              onClick={toggleRecording}
              className={`${
                isPaused 
                  ? "bg-primary hover:bg-primary-hover text-white" 
                  : "bg-accent hover:bg-accent-hover text-text"
              }`}
            >
              <Mic className="w-6 h-6" />
            </Button>
            <Button
              onClick={stopRecording}
              variant="destructive"
            >
              <Square className="w-6 h-6" />
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={toggleRecording}
              className="bg-primary hover:bg-primary-hover text-white"
            >
              <Mic className="w-6 h-6" />
            </Button>
            {canTranscribe && (
              <Button
                onClick={handleTranscribe}
                className="bg-accent hover:bg-accent-hover text-text"
              >
                <FileAudio className="w-6 h-6" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;