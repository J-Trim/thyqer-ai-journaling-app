
import { useEffect, useState, useMemo, useCallback } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ENTRIES_PER_PAGE = 10;

interface JournalEntry {
  id: string;
  title: string;
  text: string;
  created_at: string;
  audio_url: string | null;
  has_been_edited: boolean;
  user_id: string;
  mood: number | null;
}

interface Tag {
  id: string;
  name: string;
}

interface PageData {
  entries: JournalEntry[];
  count: number;
  pageParam: number;
}

export const useJournalList = () => {
  const [userName, setUserName] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Memoize tags query
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data as Tag[];
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Memoize the fetch function
  const fetchEntries = useCallback(async ({ pageParam = 0 }) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const start = pageParam * ENTRIES_PER_PAGE;
    const end = start + ENTRIES_PER_PAGE - 1;

    // Utilize the new index on user_id and created_at
    const query = supabase
      .from('journal_entries')
      .select('id, title, text, created_at, audio_url, has_been_edited, user_id, mood', { count: 'exact' })
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(start, end);

    const { data: entriesData, error: entriesError, count } = await query;

    if (entriesError) {
      throw entriesError;
    }

    if (selectedTags.length > 0) {
      // Utilize the new indexes on entry_tags
      const { data: taggedEntries, error: tagError } = await supabase
        .from('entry_tags')
        .select('entry_id')
        .in('tag_id', selectedTags);

      if (tagError) {
        throw tagError;
      }

      // Use Set for O(1) lookup performance
      const taggedEntryIds = new Set(taggedEntries.map(te => te.entry_id));
      const filteredEntries = entriesData?.filter(entry => taggedEntryIds.has(entry.id)) || [];

      return {
        entries: filteredEntries,
        count: count || 0,
        pageParam,
      };
    }

    return {
      entries: entriesData || [],
      count: count || 0,
      pageParam,
    };
  }, [selectedTags]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: ['journal-entries', selectedTags],
    queryFn: fetchEntries,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.count) return undefined;
      const nextPage = lastPage.pageParam + 1;
      const morePages = nextPage * ENTRIES_PER_PAGE < lastPage.count;
      return morePages ? nextPage : undefined;
    },
    staleTime: 1000 * 60 * 5, // Keep data fresh for 5 minutes
  });

  // Memoize the user fetch effect
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserName(user.email.split('@')[0]);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching user:", error);
        }
      }
    };
    getUser();
  }, []);

  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  }, []);

  // Memoize filtered tags to prevent unnecessary rerenders
  const filteredTags = useMemo(() => tags || [], [tags]);

  return {
    userName,
    tags: filteredTags,
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
