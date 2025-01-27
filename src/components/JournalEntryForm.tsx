import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useJournalEntry } from "@/hooks/useJournalEntry";
import Header from "@/components/Header";
import JournalFormHeader from "./journal/form/JournalFormHeader";
import JournalFormContent from "./journal/form/JournalFormContent";
import JournalFormActions from "./journal/form/JournalFormActions";
import LoadingState from "./journal/LoadingState";
import AudioHandler from "./journal/AudioHandler";
import AudioPlayer from "./journal/AudioPlayer";
import AutoSave from "./journal/AutoSave";
import TagSelector from "./journal/TagSelector";
import { TransformationSelector } from "./journal/TransformationSelector";
import { TransformationsList } from "./journal/TransformationsList";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecording } from "@/hooks/useAudioRecording";

const JournalEntryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    title,
    setTitle,
    content,
    setContent,
    transcribedAudio,
    setTranscribedAudio,
    audioUrl,
    setAudioUrl,
    isSaving,
    isInitializing,
    isSaveInProgress,
    hasUnsavedChanges,
    saveEntry,
    handleNavigateAway
  } = useJournalEntry(id);

  // Add effect to handle navigation on refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
      navigate('/');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, navigate]);

  const {
    isRecording,
    isPaused,
    recordingTime,
    isProcessing,
    toggleRecording,
    stopRecording
  } = useAudioRecording((url) => {
    setAudioUrl(url);
    setIsTranscriptionPending(true);
    handleAudioTranscription(url);
  });

  const [isTranscriptionPending, setIsTranscriptionPending] = useState(false);
  const [audioPublicUrl, setAudioPublicUrl] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [transformationEnabled, setTransformationEnabled] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(id || null);

  const handleAudioTranscription = async (audioFileName: string) => {
    try {
      console.log('Starting audio transcription process for:', audioFileName);
      
      console.log('Invoking transcribe-audio function...');
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl: audioFileName }
      });

      if (error) {
        console.error('Transcription error:', error);
        throw error;
      }

      if (data?.text) {
        console.log('Transcription completed successfully');
        setTranscribedAudio(data.text);
      } else {
        console.error('No transcription text received');
        throw new Error('No transcription text received');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Error",
        description: "Failed to transcribe audio",
        variant: "destructive",
      });
    } finally {
      setIsTranscriptionPending(false);
    }
  };

  const cleanupAudioAndTranscription = async () => {
    if (audioUrl) {
      try {
        console.log('Cleaning up audio file:', audioUrl);
        const { error } = await supabase.storage
          .from('audio_files')
          .remove([audioUrl]);
        
        if (error) {
          console.error('Error deleting audio file:', error);
          throw error;
        }
        
        setAudioUrl(null);
        setTranscribedAudio('');
        setAudioPublicUrl(null);
        console.log('Audio cleanup completed successfully');
      } catch (error) {
        console.error('Error during audio cleanup:', error);
        toast({
          title: "Error",
          description: "Failed to cleanup audio files",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancel = async () => {
    await cleanupAudioAndTranscription();
    navigate("/");
  };

  const { data: entryTags } = useQuery({
    queryKey: ['entry-tags', lastSavedId],
    queryFn: async () => {
      if (!lastSavedId) return [];
      console.log('Fetching tags for entry:', lastSavedId);
      const { data, error } = await supabase
        .from('entry_tags')
        .select('tag_id')
        .eq('entry_id', lastSavedId);

      if (error) throw error;
      return data.map(et => et.tag_id);
    },
    enabled: !!lastSavedId
  });

  const updateEntryTagsMutation = useMutation({
    mutationFn: async ({ entryId, tagIds }: { entryId: string, tagIds: string[] }) => {
      console.log('Updating tags for entry:', entryId, 'with tags:', tagIds);
      const { error: deleteError } = await supabase
        .from('entry_tags')
        .delete()
        .eq('entry_id', entryId);

      if (deleteError) throw deleteError;

      if (tagIds.length > 0) {
        const { error: insertError } = await supabase
          .from('entry_tags')
          .insert(tagIds.map(tagId => ({
            entry_id: entryId,
            tag_id: tagId
          })));

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entry-tags'] });
    }
  });

  const handleTranscriptionComplete = (transcribedText: string) => {
    setTranscribedAudio(transcribedText);
    setContent(prev => prev || '');
    setIsTranscriptionPending(false);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSave = async (isAutoSave = false) => {
    if (isTranscriptionPending || isSaveInProgress) {
      console.log('Save prevented - transcription or save in progress');
      return null;
    }

    try {
      console.log('Starting save operation. Entry ID:', lastSavedId);
      const savedEntry = await saveEntry(isAutoSave);
      
      if (savedEntry) {
        console.log('Entry saved successfully:', savedEntry.id);
        setLastSavedId(savedEntry.id);
        
        if (selectedTags.length > 0) {
          await updateEntryTagsMutation.mutateAsync({
            entryId: savedEntry.id,
            tagIds: selectedTags
          });
        }

        if (!isAutoSave) {
          setTransformationEnabled(true);
          toast({
            title: "Success",
            description: "Journal entry saved successfully",
          });
          console.log('Navigating to home after successful save');
          navigate('/journal');
        }
      }

      return savedEntry;
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "Error",
        description: "Failed to save journal entry",
        variant: "destructive",
      });
      return null;
    }
  };

  // Function for forced saves (used by transformation)
  const handleForceSave = async () => {
    try {
      console.log('Starting forced save operation. Current entry ID:', lastSavedId);
      const savedEntry = await saveEntry(false, true);
      
      if (savedEntry) {
        console.log('Entry force-saved successfully:', savedEntry.id);
        setLastSavedId(savedEntry.id);
        
        if (selectedTags.length > 0) {
          await updateEntryTagsMutation.mutateAsync({
            entryId: savedEntry.id,
            tagIds: selectedTags
          });
        }
      }
      return savedEntry;
    } catch (error) {
      console.error('Error in forced save:', error);
      toast({
        title: "Error",
        description: "Failed to save journal entry",
        variant: "destructive",
      });
      return null;
    }
  };

  if (isInitializing) {
    return (
      <>
        <Header />
        <LoadingState />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
        <AutoSave
          content={content}
          title={title}
          audioUrl={audioUrl}
          isInitializing={isInitializing}
          isSaveInProgress={isSaveInProgress}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSave}
        />
        
        <div className="space-y-4">
          <JournalFormHeader 
            title={title}
            onTitleChange={setTitle}
            isRecording={isRecording}
            isPaused={isPaused}
            isProcessing={isProcessing}
            recordingTime={recordingTime}
            onToggleRecording={toggleRecording}
            onStopRecording={stopRecording}
          />
          
          <JournalFormContent
            content={content}
            transcribedAudio={transcribedAudio}
            onContentChange={setContent}
          />

          <div className={`transition-opacity duration-800 ${
            showTags ? 'opacity-100' : 'opacity-0'
          }`}>
            <TagSelector
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
            />
          </div>

          {(content || transcribedAudio) && (
            <div className="mt-8">
              <TransformationSelector 
                entryId={lastSavedId || ''} 
                entryText={content || transcribedAudio || ''} 
                onSaveEntry={!lastSavedId ? handleForceSave : undefined}
              />
            </div>
          )}

          {lastSavedId && <TransformationsList entryId={lastSavedId} />}

          <JournalFormActions
            onCancel={handleCancel}
            onSave={() => handleSave(false)}
            isSaving={isSaving}
            isTranscriptionPending={isTranscriptionPending}
          />
        </div>
      </div>
    </div>
  );
};

export default JournalEntryForm;