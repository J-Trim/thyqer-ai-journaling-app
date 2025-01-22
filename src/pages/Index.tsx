import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import JournalEntry from "@/components/JournalEntry";
import Header from "@/components/Header";
import JournalEntryForm from "@/components/JournalEntryForm";
import LoadingState from "@/components/journal/LoadingState";
import { format } from "date-fns";

const Index = () => {
  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      console.log('Fetching journal entries...');
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entries:', error);
        throw error;
      }

      console.log('Fetched entries:', data);
      return data;
    },
  });

  if (error) {
    console.error('Error in journal entries query:', error);
    return <div>Error loading journal entries</div>;
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold">Journal Entry</h2>
            <p className="text-muted-foreground">Capture your thoughts with text and voice</p>
          </div>

          <JournalEntryForm />

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Recent Entries</h2>
            {isLoading ? (
              <LoadingState />
            ) : (
              <div className="space-y-4">
                {entries && entries.map((entry) => (
                  <JournalEntry
                    key={entry.id}
                    id={entry.id}
                    title={entry.title || "Untitled Entry"}
                    date={format(new Date(entry.created_at), 'MMMM d, yyyy')}
                    preview={entry.text || "No content"}
                    hasBeenEdited={entry.has_been_edited}
                  />
                ))}
                {entries && entries.length === 0 && (
                  <p className="text-center text-text-muted">No journal entries yet. Create your first one!</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;