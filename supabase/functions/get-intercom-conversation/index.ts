import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const intercomToken = Deno.env.get("INTERCOM_ACCESS_TOKEN");

    if (!intercomToken) {
      throw new Error("INTERCOM_ACCESS_TOKEN not configured");
    }

    const { conversationId } = await req.json();

    if (!conversationId) {
      throw new Error("conversationId is required");
    }

    console.log("Fetching conversation:", conversationId);

    // Fetch full conversation with parts
    const response = await fetch(`https://api.intercom.io/conversations/${conversationId}`, {
      headers: {
        Authorization: `Bearer ${intercomToken}`,
        Accept: "application/json",
        "Intercom-Version": "2.11",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Intercom API error:", response.status, errorText);
      throw new Error(`Intercom API error: ${response.status}`);
    }

    const conversation = await response.json();

    // Extract messages from conversation parts
    const messages: Array<{
      id: string;
      author_type: string;
      author_name: string | null;
      body: string | null;
      created_at: string;
    }> = [];

    // Add initial message from source
    if (conversation.source?.body) {
      messages.push({
        id: "source",
        author_type: conversation.source.author?.type || "user",
        author_name: conversation.source.author?.name || null,
        body: conversation.source.body,
        created_at: new Date(conversation.created_at * 1000).toISOString(),
      });
    }

    // Add conversation parts (replies)
    if (conversation.conversation_parts?.conversation_parts) {
      for (const part of conversation.conversation_parts.conversation_parts) {
        // Only include comment types (actual messages)
        if (part.part_type === "comment" || part.part_type === "note") {
          messages.push({
            id: part.id,
            author_type: part.author?.type || "unknown",
            author_name: part.author?.name || null,
            body: part.body,
            created_at: new Date(part.created_at * 1000).toISOString(),
          });
        }
      }
    }

    console.log(`Found ${messages.length} messages in conversation`);

    return new Response(JSON.stringify({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title || conversation.source?.subject,
        state: conversation.state,
        messages,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching conversation:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
