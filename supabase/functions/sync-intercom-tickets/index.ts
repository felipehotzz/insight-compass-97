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

// Background sync function
async function syncAllTickets(
  supabase: SupabaseClient,
  intercomToken: string,
  domainMap: Map<string, string>,
  limit: number
) {
  console.log("Background sync started with limit:", limit);
  
  let allConversations: IntercomConversation[] = [];
  let cursor: string | undefined;
  let fetchedCount = 0;

  // Fetch all conversations first (this is fast, just metadata)
  while (fetchedCount < limit) {
    const url = new URL("https://api.intercom.io/conversations");
    url.searchParams.set("per_page", "60"); // Max per page
    if (cursor) {
      url.searchParams.set("starting_after", cursor);
    }

    console.log(`Fetching page, current count: ${fetchedCount}`);

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
      break;
    }

    const data: IntercomConversationsResponse = await response.json();
    allConversations = allConversations.concat(data.conversations || []);
    fetchedCount = allConversations.length;

    console.log(`Fetched ${data.conversations?.length || 0} conversations, total: ${fetchedCount}`);

    if (data.pages?.next?.starting_after && fetchedCount < limit) {
      cursor = data.pages.next.starting_after;
    } else {
      break;
    }
  }

  console.log(`Total conversations to process: ${allConversations.length}`);

  // Check which conversations already exist
  const conversationIds = allConversations.map(c => c.id);
  const { data: existingTickets } = await supabase
    .from("support_tickets")
    .select("intercom_conversation_id")
    .in("intercom_conversation_id", conversationIds);

  const existingIds = new Set(existingTickets?.map(t => t.intercom_conversation_id) || []);
  const newConversations = allConversations.filter(c => !existingIds.has(c.id));

  console.log(`New conversations to sync: ${newConversations.length} (${existingIds.size} already exist)`);

  // Process only new conversations
  let syncedCount = 0;
  let linkedCount = 0;
  const batchSize = 10;

  for (let i = 0; i < newConversations.length; i += batchSize) {
    const batch = newConversations.slice(i, i + batchSize);
    
    // Process batch in parallel
    const results = await Promise.allSettled(
      batch.map(async (conv) => {
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
          return null;
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
          return null;
        }

        return { synced: true, linked: customerId !== null };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        syncedCount++;
        if (result.value.linked) linkedCount++;
      }
    }

    console.log(`Processed batch ${Math.floor(i / batchSize) + 1}, synced so far: ${syncedCount}`);
    
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < newConversations.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log(`Background sync completed: ${syncedCount} synced, ${linkedCount} linked`);
  return { synced: syncedCount, linked: linkedCount, total: allConversations.length };
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
    const { limit = 100, background = false } = body;

    console.log("Starting Intercom sync with params:", { limit, background });

    // Fetch all customer domains for mapping
    const { data: domains, error: domainsError } = await supabase
      .from("customer_domains")
      .select("domain, customer_id");

    if (domainsError) {
      console.error("Error fetching domains:", domainsError);
      throw domainsError;
    }

    // Create domain -> customer_id map
    const domainMap = new Map<string, string>();
    for (const d of domains || []) {
      domainMap.set(d.domain.toLowerCase(), d.customer_id);
    }

    console.log("Loaded domains:", domainMap.size);

    if (background) {
      // Use background task for large syncs
      // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
      (globalThis as any).EdgeRuntime?.waitUntil?.(syncAllTickets(supabase, intercomToken, domainMap, limit)) 
        ?? syncAllTickets(supabase, intercomToken, domainMap, limit);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Background sync started for up to ${limit} tickets`,
          status: "processing",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Foreground sync (for smaller syncs)
    const result = await syncAllTickets(supabase, intercomToken, domainMap, limit);

    return new Response(
      JSON.stringify({
        success: true,
        synced: result.synced,
        linkedToCustomers: result.linked,
        totalFetched: result.total,
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
