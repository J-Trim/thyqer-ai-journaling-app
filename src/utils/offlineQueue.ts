import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OfflineEntry {
  tempId: string;
  title?: string;
  text?: string;
  audioFile?: Blob;
  audioUrl?: string;
  created_at: string;
  synced: boolean;
}

const OFFLINE_STORAGE_KEY = 'offlineJournalEntries';

export const saveOffline = async (entry: Omit<OfflineEntry, 'tempId' | 'synced' | 'created_at'>) => {
  const tempId = crypto.randomUUID();
  const offlineEntry: OfflineEntry = {
    ...entry,
    tempId,
    created_at: new Date().toISOString(),
    synced: false
  };

  const existingEntries = await getOfflineEntries();
  existingEntries.push(offlineEntry);
  localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(existingEntries));
  
  return tempId;
};

export const getOfflineEntries = async (): Promise<OfflineEntry[]> => {
  const entries = localStorage.getItem(OFFLINE_STORAGE_KEY);
  return entries ? JSON.parse(entries) : [];
};

export const removeOfflineEntry = async (tempId: string) => {
  const entries = await getOfflineEntries();
  const filteredEntries = entries.filter(entry => entry.tempId !== tempId);
  localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(filteredEntries));
};

export const syncOfflineEntries = async () => {
  const { toast } = useToast();
  const entries = await getOfflineEntries();
  const unsyncedEntries = entries.filter(entry => !entry.synced);

  console.log(`Attempting to sync ${unsyncedEntries.length} offline entries`);

  for (const entry of unsyncedEntries) {
    try {
      // First upload audio if exists
      let finalAudioUrl = entry.audioUrl;
      if (entry.audioFile) {
        const audioFileName = `${crypto.randomUUID()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from('audio_files')
          .upload(audioFileName, entry.audioFile);

        if (uploadError) throw uploadError;
        finalAudioUrl = audioFileName;
      }

      // Then create the journal entry
      const { data: savedEntry, error: saveError } = await supabase
        .from('journal_entries')
        .insert([{
          title: entry.title,
          text: entry.text,
          audio_url: finalAudioUrl,
          created_at: entry.created_at
        }])
        .select()
        .single();

      if (saveError) throw saveError;

      // Remove from offline storage after successful sync
      await removeOfflineEntry(entry.tempId);
      console.log(`Successfully synced entry ${entry.tempId}`);
    } catch (error) {
      console.error('Error syncing offline entry:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync some offline entries. Will retry later.",
        variant: "destructive",
      });
    }
  }
};

export const setupNetworkListener = () => {
  const handleOnline = () => {
    console.log('Network connection restored, starting sync...');
    syncOfflineEntries();
  };

  window.addEventListener('online', handleOnline);
  
  // Initial sync check
  if (navigator.onLine) {
    syncOfflineEntries();
  }

  return () => {
    window.removeEventListener('online', handleOnline);
  };
};