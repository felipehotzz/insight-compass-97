import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendInboundPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    cc?: string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      filename: string;
      content_type: string;
      content: string;
    }>;
  };
}

function extractDomain(email: string): string | null {
  const match = email.match(/@([^>]+)/);
  if (!match) return null;
  return match[1].toLowerCase().trim();
}

function extractEmail(emailString: string): string {
  // Handle formats like "Name <email@domain.com>" or just "email@domain.com"
  const match = emailString.match(/<([^>]+)>/) || emailString.match(/([^\s<>]+@[^\s<>]+)/);
  return match ? match[1].toLowerCase().trim() : emailString.toLowerCase().trim();
}

function extractName(emailString: string): string {
  // Extract name from "Name <email@domain.com>" format
  const match = emailString.match(/^([^<]+)</);
  if (match) {
    return match[1].trim().replace(/"/g, '');
  }
  return extractEmail(emailString);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ResendInboundPayload = await req.json();
    
    console.log("Received Resend inbound webhook:", JSON.stringify(payload, null, 2));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract all recipient emails (To + CC)
    const allRecipients: string[] = [];
    
    if (payload.data.to) {
      allRecipients.push(...payload.data.to.map(extractEmail));
    }
    if (payload.data.cc) {
      allRecipients.push(...payload.data.cc.map(extractEmail));
    }

    console.log("All recipients:", allRecipients);

    // Extract unique domains from recipients
    const domains = [...new Set(allRecipients.map(extractDomain).filter(Boolean))] as string[];
    
    console.log("Domains found:", domains);

    // Look up customer domains
    const { data: customerDomains, error: domainError } = await supabase
      .from("customer_domains")
      .select("domain, customer_id, customers:customer_id(id, nome_fantasia)")
      .in("domain", domains);

    if (domainError) {
      console.error("Error looking up domains:", domainError);
    }

    console.log("Customer domains found:", customerDomains);

    // Build domain to customer map
    const domainToCustomer = new Map<string, { id: string; nome_fantasia: string }>();
    if (customerDomains) {
      for (const cd of customerDomains) {
        const customer = cd.customers as unknown as { id: string; nome_fantasia: string } | null;
        if (customer) {
          domainToCustomer.set(cd.domain, customer);
        }
      }
    }

    // Find matching customer (prioritize first match)
    let matchedCustomer: { id: string; nome_fantasia: string } | null = null;
    for (const domain of domains) {
      if (domainToCustomer.has(domain)) {
        matchedCustomer = domainToCustomer.get(domain)!;
        break;
      }
    }

    // Extract sender info
    const senderEmail = extractEmail(payload.data.from);
    const senderName = extractName(payload.data.from);

    // Prepare action data
    const actionData = {
      action_date: new Date().toISOString().split('T')[0],
      action_type: "email",
      category: "comunicação",
      title: payload.data.subject || "E-mail sem assunto",
      description: `De: ${senderName} (${senderEmail})\nPara: ${payload.data.to?.join(", ") || "N/A"}${payload.data.cc?.length ? `\nCC: ${payload.data.cc.join(", ")}` : ""}`,
      content: payload.data.text || payload.data.html || null,
      customer: matchedCustomer?.nome_fantasia || "Não identificado",
      responsibles: [senderName],
    };

    console.log("Creating action:", actionData);

    // Insert action
    const { data: action, error: actionError } = await supabase
      .from("actions")
      .insert(actionData)
      .select()
      .single();

    if (actionError) {
      console.error("Error creating action:", actionError);
      throw actionError;
    }

    console.log("Action created successfully:", action.id);

    return new Response(
      JSON.stringify({
        success: true,
        action_id: action.id,
        customer_matched: !!matchedCustomer,
        customer_name: matchedCustomer?.nome_fantasia || null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error processing inbound email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
