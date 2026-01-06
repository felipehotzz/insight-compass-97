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
    cc: string[];
    bcc: string[];
    subject: string;
    message_id: string;
    attachments?: Array<{
      id: string;
      filename: string;
      content_type: string;
    }>;
  };
}

interface EmailContentResponse {
  object: string;
  id: string;
  to: string[];
  from: string;
  created_at: string;
  subject: string;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
  bcc: string[];
  cc: string[];
  reply_to: string[];
  message_id: string;
  attachments: Array<{
    id: string;
    filename: string;
    content_type: string;
  }>;
}

function extractDomain(email: string): string | null {
  const match = email.match(/@([^>]+)/);
  if (!match) return null;
  return match[1].toLowerCase().trim();
}

function extractEmail(emailString: string): string {
  const match = emailString.match(/<([^>]+)>/) || emailString.match(/([^\s<>]+@[^\s<>]+)/);
  return match ? match[1].toLowerCase().trim() : emailString.toLowerCase().trim();
}

function extractName(emailString: string): string {
  const match = emailString.match(/^([^<]+)</);
  if (match) {
    return match[1].trim().replace(/"/g, '');
  }
  return extractEmail(emailString);
}

async function fetchEmailContent(emailId: string, resendApiKey: string): Promise<EmailContentResponse | null> {
  try {
    const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch email content:", response.status, await response.text());
      return null;
    }

    const emailData = await response.json();
    console.log("Email content fetched:", JSON.stringify(emailData, null, 2));
    
    return emailData;
  } catch (error) {
    console.error("Error fetching email content:", error);
    return null;
  }
}

async function findExistingThread(
  supabase: any,
  messageId: string,
  inReplyTo: string | undefined,
  senderEmail: string,
  recipientEmails: string[]
): Promise<string | null> {
  // Try to find an existing thread by In-Reply-To header
  if (inReplyTo) {
    const { data: existingMessage } = await supabase
      .from("email_messages")
      .select("action_id")
      .eq("message_id", inReplyTo)
      .maybeSingle();
    
    if (existingMessage) {
      console.log("Found existing thread by In-Reply-To:", existingMessage.action_id);
      return existingMessage.action_id;
    }
  }

  // Try to find a thread with same participants (within last 7 days for the same subject)
  // This is a fallback for when In-Reply-To is not available
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ResendInboundPayload = await req.json();
    
    console.log("Received Resend inbound webhook:", JSON.stringify(payload, null, 2));

    if (payload.type !== "email.received") {
      console.log("Ignoring non-email.received event:", payload.type);
      return new Response(JSON.stringify({ success: true, message: "Event ignored" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch full email content from Resend API
    const emailContent = await fetchEmailContent(payload.data.email_id, resendApiKey);

    const senderEmail = extractEmail(payload.data.from);
    const senderName = extractName(payload.data.from);
    
    // Try to get original recipients from headers (for CC'd emails)
    // The webhook "to" field only shows the Resend address when email is CC'd
    const originalToHeader = emailContent?.headers?.["to"] || emailContent?.headers?.["To"];
    const originalCcHeader = emailContent?.headers?.["cc"] || emailContent?.headers?.["Cc"];
    
    // Parse original To from headers, filtering out resend.app addresses
    let toEmails: string[] = [];
    if (originalToHeader) {
      // Parse "Name <email>, Name2 <email2>" format
      const emails = originalToHeader.split(",").map((s: string) => extractEmail(s.trim()));
      toEmails = emails.filter((e: string) => !e.includes("resend.app"));
    }
    // Fallback to webhook data if no original To found
    if (toEmails.length === 0) {
      toEmails = (payload.data.to?.map(extractEmail) || []).filter(e => !e.includes("resend.app"));
    }
    
    // Parse original CC from headers
    let ccEmails: string[] = [];
    if (originalCcHeader) {
      const emails = originalCcHeader.split(",").map((s: string) => extractEmail(s.trim()));
      ccEmails = emails.filter((e: string) => !e.includes("resend.app"));
    } else {
      ccEmails = (payload.data.cc?.map(extractEmail) || []).filter(e => !e.includes("resend.app"));
    }
    
    const allRecipients = [...toEmails, ...ccEmails];

    console.log("Original To:", toEmails, "Original CC:", ccEmails);
    console.log("Sender:", senderEmail, "Recipients:", allRecipients);

    // Extract domains (excluding resend.app)
    const domains = [...new Set(
      allRecipients
        .map(extractDomain)
        .filter(d => d && !d.includes("resend.app"))
    )] as string[];
    
    console.log("Domains found:", domains);

    // Look up customer
    const { data: customerDomains, error: domainError } = await supabase
      .from("customer_domains")
      .select("domain, customer_id, customers:customer_id(id, nome_fantasia)")
      .in("domain", domains.length > 0 ? domains : ["__none__"]);

    if (domainError) {
      console.error("Error looking up domains:", domainError);
    }

    let matchedCustomer: { id: string; nome_fantasia: string } | null = null;
    if (customerDomains) {
      for (const cd of customerDomains) {
        const customer = cd.customers as unknown as { id: string; nome_fantasia: string } | null;
        if (customer) {
          matchedCustomer = customer;
          break;
        }
      }
    }

    console.log("Customer matched:", matchedCustomer?.nome_fantasia);

    // Extract In-Reply-To header for threading
    const inReplyTo = emailContent?.headers?.["in-reply-to"] || emailContent?.headers?.["In-Reply-To"];
    
    // Try to find existing thread
    let actionId = await findExistingThread(
      supabase,
      payload.data.message_id,
      inReplyTo,
      senderEmail,
      allRecipients
    );

    let isNewThread = false;

    // If no existing thread, create a new action
    if (!actionId) {
      isNewThread = true;
      const actionData = {
        action_date: new Date().toISOString().split('T')[0],
        action_type: "email",
        category: "comunicação",
        title: payload.data.subject || "E-mail sem assunto",
        description: `Thread de e-mail iniciada por ${senderName}`,
        content: null, // Content will be in email_messages table
        customer: matchedCustomer?.nome_fantasia || "Não identificado",
        responsibles: [senderName],
      };

      console.log("Creating new action:", actionData);

      const { data: action, error: actionError } = await supabase
        .from("actions")
        .insert(actionData)
        .select()
        .single();

      if (actionError) {
        console.error("Error creating action:", actionError);
        throw actionError;
      }

      actionId = action.id;
      console.log("Action created successfully:", actionId);
    } else {
      console.log("Adding to existing thread:", actionId);
    }

    // Insert email message into thread
    const emailMessageData = {
      action_id: actionId,
      message_id: payload.data.message_id,
      in_reply_to: inReplyTo || null,
      from_email: senderEmail,
      from_name: senderName !== senderEmail ? senderName : null,
      to_emails: toEmails,
      cc_emails: ccEmails,
      bcc_emails: payload.data.bcc?.map(extractEmail) || [],
      subject: payload.data.subject,
      body_text: emailContent?.text || null,
      body_html: emailContent?.html || null,
      sent_at: emailContent?.created_at || new Date().toISOString(),
      attachments: payload.data.attachments || [],
    };

    console.log("Inserting email message:", emailMessageData);

    const { data: emailMessage, error: emailError } = await supabase
      .from("email_messages")
      .insert(emailMessageData)
      .select()
      .single();

    if (emailError) {
      console.error("Error inserting email message:", emailError);
      throw emailError;
    }

    console.log("Email message inserted:", emailMessage.id);

    return new Response(
      JSON.stringify({
        success: true,
        action_id: actionId,
        email_message_id: emailMessage.id,
        is_new_thread: isNewThread,
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
