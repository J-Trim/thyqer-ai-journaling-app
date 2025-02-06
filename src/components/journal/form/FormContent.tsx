
import React from 'react';
import { useFormState } from './FormStateProvider';
import JournalFormHeader from './JournalFormHeader';
import JournalFormContent from './JournalFormContent';
import AudioPlayer from '../AudioPlayer';
import TagSelector from '../TagSelector';
import { TransformationManager } from '../transformations/TransformationManager';
import SaveControls from './SaveControls';
import { useAudioRecording } from '@/hooks/useAudioRecording';

const FormContent: React.FC<{
  onSave: () => Promise<{ id: string }>;
  onCancel: () => void;
  isSaving: boolean;
}> = ({
  onSave,
  onCancel,
  isSaving,
}) => {
  const {
    title,
    setTitle,
    content,
    setContent,
    transcribedAudio,
    audioUrl,
    setAudioUrl,
    isTranscriptionPending,
    selectedTags,
    setSelectedTags,
    showTags,
    lastSavedId
  } = useFormState();

  const {
    isRecording,
    isPaused,
    recordingTime,
    isProcessing,
    toggleRecording,
    stopRecording
  } = useAudioRecording((url) => {
    setAudioUrl(url);
  });

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev: string[]) => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
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

      {audioUrl && (
        <div className="mt-4">
          <AudioPlayer audioUrl={audioUrl} />
        </div>
      )}

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
          <TransformationManager
            entryId={lastSavedId || ''}
            entryText={content || transcribedAudio || ''}
            onSaveEntry={!lastSavedId ? onSave : undefined}
          />
        </div>
      )}

      <SaveControls
        onCancel={onCancel}
        onSave={onSave}
        isSaving={isSaving}
        isTranscriptionPending={isTranscriptionPending}
      />
    </div>
  );
};

export default FormContent;
