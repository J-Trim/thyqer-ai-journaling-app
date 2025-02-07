
import React, { createContext, useContext } from 'react';
import { useJournalFormState } from '@/hooks/useJournalFormState';

interface FormStateContextType {
  title: string;
  setTitle: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
  transcribedAudio: string;
  setTranscribedAudio: (value: string) => void;
  audioUrl: string | null;
  setAudioUrl: (value: string | null) => void;
  isTranscriptionPending: boolean;
  setIsTranscriptionPending: (value: boolean) => void;
  selectedTags: string[];
  setSelectedTags: (value: string[] | ((prev: string[]) => string[])) => void;
  showTags: boolean;
  setShowTags: (value: boolean) => void;
  transformationEnabled: boolean;
  setTransformationEnabled: (value: boolean) => void;
  lastSavedId: string | null;
  setLastSavedId: (value: string | null) => void;
  mood: number | null;
  setMood: (value: number) => void;
  resetForm: () => void;  // Add the resetForm function type
}

const FormStateContext = createContext<FormStateContextType | undefined>(undefined);

interface FormStateProviderProps {
  children: React.ReactNode;
  id?: string;
  initialData?: any;
}

export const FormStateProvider: React.FC<FormStateProviderProps> = ({ 
  children, 
  id,
  initialData 
}) => {
  const formState = useJournalFormState(id, initialData);

  return (
    <FormStateContext.Provider value={formState}>
      {children}
    </FormStateContext.Provider>
  );
};

export const useFormState = () => {
  const context = useContext(FormStateContext);
  if (!context) {
    throw new Error('useFormState must be used within a FormStateProvider');
  }
  return context;
};

