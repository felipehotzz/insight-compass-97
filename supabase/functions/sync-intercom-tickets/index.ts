import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IntercomConversation {
  id: string;
  type: string;
  created_at: number;
  updated_at: number;
  state: string;
  title?: string;
  priority?: string;
  source?: {
    type: string;
    author?: {
      type: string;
      id: string;
      name?: string;
      email?: string;
    };
    subject?: string;
    body?: string;
  };
  contacts?: {
    contacts: Array<{
      id: string;
      type: string;
      email?: string;
      name?: string;
    }>;
  };
  teammates?: {
    admins: Array<{
      id: string;
      name?: string;
    }>;
  };
}

interface IntercomConversationsResponse {
  type: string;
  conversations: IntercomConversation[];
  pages?: {
    next?: {
      starting_after: string;
    };
  };
}

// Process a single conversation and insert into database
async function processConversation(
  conv: IntercomConversation,
  supabase: SupabaseClient,
  intercomToken: string,
  domainMap: Map<string, string>
): Promise<{ synced: boolean; linked: boolean }> {
  try {
    // Fetch full conversation details
    const detailResponse = await fetch(`https://api.intercom.io/conversations/${conv.id}`, {
      headers: {
        Authorization: `Bearer ${intercomToken}`,
        Accept: "application/json",
        "Intercom-Version": "2.11",
      },
    });

    if (!detailResponse.ok) {
      console.error(`Failed to fetch details for conversation ${conv.id}`);
      return { synced: false, linked: false };
    }

    const fullConv = await detailResponse.json();

    // Extract email from contacts
    let fromEmail: string | null = null;
    let fromName: string | null = null;

    // Check contacts object
    if (fullConv.contacts?.contacts?.length) {
      const firstContact = fullConv.contacts.contacts[0];
      if (firstContact.id && !firstContact.email) {
        const contactResponse = await fetch(`https://api.intercom.io/contacts/${firstContact.id}`, {
          headers: {
            Authorization: `Bearer ${intercomToken}`,
            Accept: "application/json",
            "Intercom-Version": "2.11",
          },
        });
        if (contactResponse.ok) {
          const contactData = await contactResponse.json();
          fromEmail = contactData.email || null;
          fromName = contactData.name || null;
        }
      } else {
        fromEmail = firstContact.email || null;
        fromName = firstContact.name || null;
      }
    }
    
    if (!fromEmail && fullConv.source?.author) {
      fromEmail = fullConv.source.author.email || null;
      fromName = fullConv.source.author.name || null;
    }

    // Find customer by domain
    let customerId: string | null = null;
    if (fromEmail) {
      const emailDomain = fromEmail.split("@")[1]?.toLowerCase();
      if (emailDomain) {
        customerId = domainMap.get(emailDomain) || null;
      }
    }

    // Map Intercom state to our status
    let status = "open";
    if (fullConv.state === "closed") {
      status = "closed";
    } else if (fullConv.state === "snoozed") {
      status = "pending";
    }

    // Upsert ticket
    const ticketData = {
      intercom_conversation_id: conv.id,
      customer_id: customerId,
      from_email: fromEmail,
      from_name: fromName,
      subject: fullConv.source?.subject || fullConv.title || null,
      status: status,
      priority: fullConv.priority || "n2",
      assignee_name: fullConv.teammates?.admins?.[0]?.name || null,
      created_at: new Date(conv.created_at * 1000).toISOString(),
      updated_at: new Date(conv.updated_at * 1000).toISOString(),
      closed_at: status === "closed" ? new Date(conv.updated_at * 1000).toISOString() : null,
    };

    const { error } = await supabase
      .from("support_tickets")
      .upsert(ticketData, { onConflict: "intercom_conversation_id" });

    if (error) {
      console.error(`Error upserting ticket ${conv.id}:`, error);
      return { synced: false, linked: false };
    }

    return { synced: true, linked: customerId !== null };
  } catch (err) {
    console.error(`Error processing conversation ${conv.id}:`, err);
    return { synced: false, linked: false };
  }
}

// Incremental sync - fetches and processes in small batches
async function syncTicketsIncremental(
  supabase: SupabaseClient,
  intercomToken: string,
  domainMap: Map<string, string>,
  batchSize: number,
  cursor?: string,
  forceUpdate: boolean = false
): Promise<{ synced: number; linked: number; updated: number; nextCursor?: string; hasMore: boolean }> {
  console.log("Fetching batch with cursor:", cursor || "start", "forceUpdate:", forceUpdate);
  
  const url = new URL("https://api.intercom.io/conversations");
  url.searchParams.set("per_page", String(batchSize));
  if (cursor) {
    url.searchParams.set("starting_after", cursor);
  }

  const response = await fetch(url.toString(), {
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

  const data: IntercomConversationsResponse = await response.json();
  const conversations = data.conversations || [];
  
  console.log(`Fetched ${conversations.length} conversations`);

  // Check which conversations already exist
  const conversationIds = conversations.map(c => c.id);
  const { data: existingTickets } = await supabase
    .from("support_tickets")
    .select("intercom_conversation_id, updated_at")
    .in("intercom_conversation_id", conversationIds);

  const existingMap = new Map<string, string>();
  for (const t of existingTickets || []) {
    existingMap.set(t.intercom_conversation_id, t.updated_at);
  }

  // Filter conversations that need to be processed
  // - New conversations (don't exist)
  // - Or if forceUpdate is true, process all
  // - Or if updated_at is different (conversation was updated)
  const conversationsToProcess = conversations.filter(c => {
    const existingUpdatedAt = existingMap.get(c.id);
    if (!existingUpdatedAt) return true; // New conversation
    if (forceUpdate) return true; // Force update all
    
    // Check if conversation was updated in Intercom
    const intercomUpdatedAt = new Date(c.updated_at * 1000).toISOString();
    return intercomUpdatedAt > existingUpdatedAt;
  });

  const newCount = conversations.filter(c => !existingMap.has(c.id)).length;
  const updateCount = conversationsToProcess.length - newCount;

  console.log(`Processing: ${conversationsToProcess.length} total (${newCount} new, ${updateCount} updates, ${conversations.length - conversationsToProcess.length} unchanged)`);

  let syncedCount = 0;
  let linkedCount = 0;
  let updatedCount = 0;

  // Process conversations in parallel (small batch)
  const results = await Promise.allSettled(
    conversationsToProcess.map(async conv => {
      const isNew = !existingMap.has(conv.id);
      const result = await processConversation(conv, supabase, intercomToken, domainMap);
      return { ...result, isNew };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.synced) {
      if (result.value.isNew) {
        syncedCount++;
      } else {
        updatedCount++;
      }
      if (result.value.linked) linkedCount++;
    }
  }

  console.log(`Batch complete: ${syncedCount} new, ${updatedCount} updated, ${linkedCount} linked`);

  return {
    synced: syncedCount,
    linked: linkedCount,
    updated: updatedCount,
    nextCursor: data.pages?.next?.starting_after,
    hasMore: !!data.pages?.next?.starting_after,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const intercomToken = Deno.env.get("INTERCOM_ACCESS_TOKEN");

    if (!intercomToken) {
      throw new Error("INTERCOM_ACCESS_TOKEN not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const { batchSize = 20, cursor, maxBatches = 10, forceUpdate = false } = body;

    console.log("Starting Intercom sync with params:", { batchSize, cursor, maxBatches, forceUpdate });

    // Create sync history record
    const { data: syncRecord, error: syncInsertError } = await supabase
      .from("sync_history")
      .insert({
        sync_type: "intercom_tickets",
        status: "running",
        metadata: { batchSize, maxBatches }
      })
      .select()
      .single();

    if (syncInsertError) {
      console.error("Error creating sync record:", syncInsertError);
    }

    const syncId = syncRecord?.id;

    // Fetch all customer domains for mapping
    const { data: domains, error: domainsError } = await supabase
      .from("customer_domains")
      .select("domain, customer_id");

    if (domainsError) {
      console.error("Error fetching domains:", domainsError);
      // Update sync history with error
      if (syncId) {
        await supabase.from("sync_history").update({
          status: "error",
          completed_at: new Date().toISOString(),
          error_message: domainsError.message
        }).eq("id", syncId);
      }
      throw domainsError;
    }

    // Create domain -> customer_id map
    const domainMap = new Map<string, string>();
    for (const d of domains || []) {
      domainMap.set(d.domain.toLowerCase(), d.customer_id);
    }

    console.log("Loaded domains:", domainMap.size);

    // Process multiple batches
    let totalSynced = 0;
    let totalLinked = 0;
    let totalUpdated = 0;
    let totalProcessed = 0;
    let currentCursor = cursor;
    let hasMore = true;
    let batchCount = 0;

    while (hasMore && batchCount < maxBatches) {
      const result = await syncTicketsIncremental(
        supabase,
        intercomToken,
        domainMap,
        batchSize,
        currentCursor,
        forceUpdate
      );

      totalSynced += result.synced;
      totalLinked += result.linked;
      totalUpdated += result.updated;
      totalProcessed += batchSize;
      currentCursor = result.nextCursor;
      hasMore = result.hasMore;
      batchCount++;

      console.log(`Completed batch ${batchCount}/${maxBatches}, new: ${totalSynced}, updated: ${totalUpdated}`);

      // Small delay between batches
      if (hasMore && batchCount < maxBatches) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Update sync history with success
    if (syncId) {
      await supabase.from("sync_history").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        total_processed: totalProcessed,
        total_synced: totalSynced,
        total_linked: totalLinked,
        metadata: { batchSize, maxBatches, batchesProcessed: batchCount, hasMore, nextCursor: currentCursor, totalUpdated }
      }).eq("id", syncId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: totalSynced,
        updated: totalUpdated,
        linkedToCustomers: totalLinked,
        batchesProcessed: batchCount,
        hasMore: hasMore,
        nextCursor: currentCursor,
        totalProcessed: totalProcessed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
