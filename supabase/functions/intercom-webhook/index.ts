import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IntercomWebhookPayload {
  type: string;
  topic: string;
  data: {
    item: {
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
      admin_assignee_id?: string | number;
      teammates?: {
        admins: Array<{
          id: string;
          name?: string;
        }>;
      };
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: IntercomWebhookPayload = await req.json();
    console.log("Received Intercom webhook:", JSON.stringify(payload, null, 2));

    const topic = payload.topic;

    // Handle ping test from Intercom
    if (topic === "ping") {
      console.log("Received ping test from Intercom");
      return new Response(JSON.stringify({ success: true, message: "Pong" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const conversation = payload.data?.item;

    if (!conversation) {
      console.log("No conversation data in payload");
      return new Response(JSON.stringify({ success: true, message: "No conversation data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate required fields
    if (!conversation.id || typeof conversation.updated_at !== 'number') {
      console.log("Invalid conversation data - missing id or updated_at");
      return new Response(JSON.stringify({ success: true, message: "Invalid conversation data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract email from contacts or source
    let fromEmail: string | null = null;
    let fromName: string | null = null;

    if (conversation.contacts?.contacts?.length) {
      const firstContact = conversation.contacts.contacts[0];
      fromEmail = firstContact.email || null;
      fromName = firstContact.name || null;
    } else if (conversation.source?.author?.type === "user") {
      fromEmail = conversation.source.author.email || null;
      fromName = conversation.source.author.name || null;
    }

    console.log("Extracted contact:", { fromEmail, fromName });

    // Extract domain from email
    let customerId: string | null = null;
    if (fromEmail) {
      const domain = fromEmail.split("@")[1]?.toLowerCase();
      if (domain) {
        console.log("Looking for customer with domain:", domain);
        
        // Find customer by domain
        const { data: domainData, error: domainError } = await supabase
          .from("customer_domains")
          .select("customer_id")
          .eq("domain", domain)
          .maybeSingle();

        if (domainError) {
          console.error("Error finding domain:", domainError);
        } else if (domainData) {
          customerId = domainData.customer_id;
          console.log("Found customer:", customerId);
        } else {
          console.log("No customer found for domain:", domain);
        }
      }
    }

    // Determine priority from Intercom priority field
    let priority = "n2"; // default
    if (conversation.priority === "priority") {
      priority = "n1";
    }

    // Get assignee name
    let assigneeName: string | null = null;
    if (conversation.teammates?.admins?.length) {
      assigneeName = conversation.teammates.admins[0].name || null;
    }

    // Map Intercom state to our status
    let status = "open";
    let closedAt: string | null = null;
    if (conversation.state === "closed") {
      status = "closed";
      closedAt = new Date(conversation.updated_at * 1000).toISOString();
    } else if (conversation.state === "snoozed") {
      status = "snoozed";
    }

    // Prepare ticket data
    const ticketData = {
      intercom_conversation_id: conversation.id,
      from_email: fromEmail,
      from_name: fromName,
      subject: conversation.title || conversation.source?.subject || null,
      status,
      priority,
      assignee_name: assigneeName,
      customer_id: customerId,
      closed_at: closedAt,
      updated_at: new Date(conversation.updated_at * 1000).toISOString(),
    };

    console.log("Ticket data to upsert:", ticketData);

    // Upsert ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .upsert(ticketData, {
        onConflict: "intercom_conversation_id",
      })
      .select()
      .single();

    if (ticketError) {
      console.error("Error upserting ticket:", ticketError);
      throw ticketError;
    }

    console.log("Ticket upserted successfully:", ticket.id);

    return new Response(JSON.stringify({ success: true, ticketId: ticket.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error processing webhook:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
