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

    console.log("Loaded domains:", Array.from(domainMap.keys()));

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

    // Process each conversation - fetch full details to get contact email
    let syncedCount = 0;
    let linkedCount = 0;

    for (const conv of allConversations) {
      // Fetch full conversation details to get contact info
      const detailResponse = await fetch(`https://api.intercom.io/conversations/${conv.id}`, {
        headers: {
          Authorization: `Bearer ${intercomToken}`,
          Accept: "application/json",
          "Intercom-Version": "2.11",
        },
      });

      if (!detailResponse.ok) {
        console.error(`Failed to fetch details for conversation ${conv.id}`);
        continue;
      }

      const fullConv = await detailResponse.json();

      // Extract email from contacts in full conversation
      let fromEmail: string | null = null;
      let fromName: string | null = null;

      // Try multiple sources for contact info
      // 1. Check contacts object
      if (fullConv.contacts?.contacts?.length) {
        const firstContact = fullConv.contacts.contacts[0];
        // If contact has id but no email, fetch contact details
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
      
      // 2. Check source author
      if (!fromEmail && fullConv.source?.author) {
        fromEmail = fullConv.source.author.email || null;
        fromName = fullConv.source.author.name || null;
      }

      // 3. Check conversation_message for from info
      if (!fromEmail && fullConv.conversation_message?.author) {
        fromEmail = fullConv.conversation_message.author.email || null;
        fromName = fullConv.conversation_message.author.name || null;
      }

      console.log(`Conversation ${conv.id} - Contact: ${fromName} <${fromEmail}>`);

      // Find customer by domain
      let foundCustomerId: string | null = null;
      if (fromEmail) {
        const emailDomain = fromEmail.split("@")[1]?.toLowerCase();
        console.log(`Checking domain: ${emailDomain}`);
        if (emailDomain && domainMap.has(emailDomain)) {
          foundCustomerId = domainMap.get(emailDomain)!;
          linkedCount++;
          console.log(`Matched to customer: ${foundCustomerId}`);
        }
      }

      // Filter by customerId if provided
      if (customerId && foundCustomerId !== customerId) {
        continue;
      }

      // Determine priority
      let priority = "n2";
      if (fullConv.priority === "priority") {
        priority = "n1";
      }

      // Get assignee
      let assigneeName: string | null = null;
      if (fullConv.teammates?.admins?.length) {
        assigneeName = fullConv.teammates.admins[0].name || null;
      }

      // Map state to status
      let status = "open";
      let closedAt: string | null = null;
      const convState = fullConv.state || conv.state;
      const convUpdatedAt = fullConv.updated_at || conv.updated_at;
      
      if (convState === "closed") {
        status = "closed";
        closedAt = new Date(convUpdatedAt * 1000).toISOString();
      } else if (convState === "snoozed") {
        status = "snoozed";
      }

      // Upsert ticket
      const { error: ticketError } = await supabase
        .from("support_tickets")
        .upsert({
          intercom_conversation_id: conv.id,
          from_email: fromEmail,
          from_name: fromName,
          subject: fullConv.title || fullConv.source?.subject || conv.title || null,
          status,
          priority,
          assignee_name: assigneeName,
          customer_id: foundCustomerId,
          closed_at: closedAt,
          created_at: new Date((fullConv.created_at || conv.created_at) * 1000).toISOString(),
          updated_at: new Date(convUpdatedAt * 1000).toISOString(),
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
