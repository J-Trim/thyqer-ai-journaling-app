import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface SaveHookProps {
  title: string;
  content: string;
  audioUrl: string | null;
  transcribedAudio: string;
  lastSavedId: string | null;
  selectedTags: string[];
  onSuccess?: () => void;
}

export const useJournalSave = ({
  title,
  content,
  audioUrl,
  transcribedAudio,
  lastSavedId,
  selectedTags,
  onSuccess
}: SaveHookProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveInProgress, setIsSaveInProgress] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateEntryTags = async (entryId: string) => {
    if (selectedTags.length > 0) {
      await queryClient.getMutationCache().build(queryClient, {
        mutationFn: async () => {
          const { error: deleteError } = await supabase
            .from('entry_tags')
            .delete()
            .eq('entry_id', entryId);

          if (deleteError) throw deleteError;

          if (selectedTags.length > 0) {
            const { error: insertError } = await supabase
              .from('entry_tags')
              .insert(selectedTags.map(tagId => ({
                entry_id: entryId,
                tag_id: tagId
              })));

            if (insertError) throw insertError;
          }
        }
      }).execute();
    }
  };

  const saveEntry = async (isAutoSave = false) => {
    if (isSaveInProgress) {
      console.log('Save prevented - save in progress');
      return null;
    }

    try {
      setIsSaveInProgress(true);
      if (!isAutoSave) setIsSaving(true);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to save your entry",
          variant: "destructive",
        });
        navigate("/auth");
        return null;
      }

      const fullText = transcribedAudio 
        ? `${content}\n\n---\nTranscribed Audio:\n${transcribedAudio}`
        : content;

      const entryData = {
        user_id: session.user.id,
        title: title || `Journal Entry - ${new Date().toLocaleDateString()}`,
        text: fullText,
        audio_url: audioUrl,
        has_been_edited: !!lastSavedId,
      };

      let savedEntry;
      
      if (lastSavedId) {
        const { data, error } = await supabase
          .from("journal_entries")
          .update(entryData)
          .eq('id', lastSavedId)
          .select()
          .single();
          
        if (error) throw error;
        savedEntry = data;
      } else {
        const { data, error } = await supabase
          .from("journal_entries")
          .insert([entryData])
          .select()
          .single();
          
        if (error) throw error;
        savedEntry = data;
      }

      await updateEntryTags(savedEntry.id);

      if (!isAutoSave) {
        toast({
          title: "Success",
          description: `Journal entry ${lastSavedId ? 'updated' : 'saved'} successfully`,
        });
        if (onSuccess) onSuccess();
      }

      return savedEntry;
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save journal entry",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaveInProgress(false);
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    isSaveInProgress,
    saveEntry
  };
};