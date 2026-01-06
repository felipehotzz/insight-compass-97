import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  // Handle CORS preflight
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

    // Parse request body for optional filters
    const body = await req.json().catch(() => ({}));
    const { customerId, limit = 50 } = body;

    console.log("Starting Intercom sync with params:", { customerId, limit });

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

    // Fetch conversations from Intercom
    let allConversations: IntercomConversation[] = [];
    let cursor: string | undefined;
    let fetchedCount = 0;

    while (fetchedCount < limit) {
      const url = new URL("https://api.intercom.io/conversations");
      url.searchParams.set("per_page", Math.min(20, limit - fetchedCount).toString());
      if (cursor) {
        url.searchParams.set("starting_after", cursor);
      }

      console.log("Fetching from Intercom:", url.toString());

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
        throw new Error(`Intercom API error: ${response.status} - ${errorText}`);
      }

      const data: IntercomConversationsResponse = await response.json();
      allConversations = allConversations.concat(data.conversations || []);
      fetchedCount = allConversations.length;

      console.log(`Fetched ${data.conversations?.length || 0} conversations, total: ${fetchedCount}`);

      if (data.pages?.next?.starting_after) {
        cursor = data.pages.next.starting_after;
      } else {
        break;
      }
    }

    console.log(`Total conversations fetched: ${allConversations.length}`);

    // Process each conversation
    let syncedCount = 0;
    let linkedCount = 0;

    for (const conv of allConversations) {
      // Extract email from contacts
      let fromEmail: string | null = null;
      let fromName: string | null = null;

      if (conv.contacts?.contacts?.length) {
        const firstContact = conv.contacts.contacts[0];
        fromEmail = firstContact.email || null;
        fromName = firstContact.name || null;
      } else if (conv.source?.author?.type === "user") {
        fromEmail = conv.source.author.email || null;
        fromName = conv.source.author.name || null;
      }

      // Find customer by domain
      let foundCustomerId: string | null = null;
      if (fromEmail) {
        const domain = fromEmail.split("@")[1]?.toLowerCase();
        if (domain && domainMap.has(domain)) {
          foundCustomerId = domainMap.get(domain)!;
          linkedCount++;
        }
      }

      // Filter by customerId if provided
      if (customerId && foundCustomerId !== customerId) {
        continue;
      }

      // Determine priority
      let priority = "n2";
      if (conv.priority === "priority") {
        priority = "n1";
      }

      // Get assignee
      let assigneeName: string | null = null;
      if (conv.teammates?.admins?.length) {
        assigneeName = conv.teammates.admins[0].name || null;
      }

      // Map state to status
      let status = "open";
      let closedAt: string | null = null;
      if (conv.state === "closed") {
        status = "closed";
        closedAt = new Date(conv.updated_at * 1000).toISOString();
      } else if (conv.state === "snoozed") {
        status = "snoozed";
      }

      // Upsert ticket
      const { error: ticketError } = await supabase
        .from("support_tickets")
        .upsert({
          intercom_conversation_id: conv.id,
          from_email: fromEmail,
          from_name: fromName,
          subject: conv.title || conv.source?.subject || null,
          status,
          priority,
          assignee_name: assigneeName,
          customer_id: foundCustomerId,
          closed_at: closedAt,
          created_at: new Date(conv.created_at * 1000).toISOString(),
          updated_at: new Date(conv.updated_at * 1000).toISOString(),
        }, {
          onConflict: "intercom_conversation_id",
        });

      if (ticketError) {
        console.error("Error upserting ticket:", ticketError);
      } else {
        syncedCount++;
      }
    }

    console.log(`Sync complete. Synced: ${syncedCount}, Linked to customers: ${linkedCount}`);

    return new Response(JSON.stringify({
      success: true,
      synced: syncedCount,
      linkedToCustomers: linkedCount,
      totalFetched: allConversations.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error syncing tickets:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
