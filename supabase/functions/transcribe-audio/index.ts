
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { queue } from './services/transcriptionQueue.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Received transcribe-audio request');
    
    // Get auth session
    const { data: { session }, error: sessionError } = await req.auth();
    
    if (sessionError || !session?.user?.id) {
      console.error('Authentication error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No valid session found' }), 
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const userId = session.user.id;
    const body = await req.json();
    const audioUrl = body?.audioUrl;
    
    if (!audioUrl) {
      console.error('Missing audioUrl in request');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Enqueueing transcription job:', { audioUrl, userId });

    // Enqueue the transcription job
    const jobId = await queue.enqueueJob(audioUrl, userId);
    console.log('Job enqueued with ID:', jobId);

    // Start processing in the background
    EdgeRuntime.waitUntil(queue.processNextBatch());

    return new Response(
      JSON.stringify({ 
        status: 'queued',
        jobId,
        message: 'Transcription job has been queued and will be processed shortly'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202 
      }
    );
  } catch (error) {
    console.error('Error in transcribe-audio:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'An error occurred while processing the transcription request'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

