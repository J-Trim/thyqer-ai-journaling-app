
import { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ENTRIES_PER_PAGE = 10;

export const useJournalList = () => {
  const [userName, setUserName] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: ['journal-entries', selectedTags],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        console.log('Fetching page:', pageParam);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No session found during fetch');
          throw new Error('Not authenticated');
        }

        const start = pageParam * ENTRIES_PER_PAGE;
        const end = start + ENTRIES_PER_PAGE - 1;

        const { data: entriesData, error: entriesError, count } = await supabase
          .from('journal_entries')
          .select('*', { count: 'exact' })
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .range(start, end);

        if (entriesError) {
          console.error('Error fetching entries:', entriesError);
          throw entriesError;
        }

        console.log(`Retrieved ${entriesData?.length} entries for page ${pageParam}`);

        if (selectedTags.length > 0) {
          const { data: taggedEntries, error: tagError } = await supabase
            .from('entry_tags')
            .select('entry_id')
            .in('tag_id', selectedTags);

          if (tagError) {
            console.error('Error fetching tagged entries:', tagError);
            throw tagError;
          }

          const taggedEntryIds = new Set(taggedEntries.map(te => te.entry_id));
          const filteredEntries = entriesData?.filter(entry => taggedEntryIds.has(entry.id)) || [];

          return {
            entries: filteredEntries,
            count,
            pageParam,
          };
        }

        return {
          entries: entriesData || [],
          count,
          pageParam,
        };
      } catch (error) {
        console.error('Error in journal entries query:', error);
        throw error;
      }
    },
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.count) return undefined;
      const morePages = pages.length * ENTRIES_PER_PAGE < lastPage.count;
      if (!morePages) return undefined;
      return pages.length;
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserName(user.email.split('@')[0]);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    getUser();
  }, []);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return {
    userName,
    tags,
    selectedTags,
    handleTagToggle,
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  };
};
