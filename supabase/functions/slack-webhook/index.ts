import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Verify Slack request signature
async function verifySlackSignature(req: Request, body: string): Promise<boolean> {
  const signingSecret = Deno.env.get("SLACK_SIGNING_SECRET");
  if (!signingSecret) return false;

  const timestamp = req.headers.get("x-slack-request-timestamp");
  const slackSignature = req.headers.get("x-slack-signature");
  if (!timestamp || !slackSignature) return false;

  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) return false;

  const sigBasestring = `v0:${timestamp}:${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(sigBasestring));
  const hex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");
  const computedSignature = `v0=${hex}`;

  return computedSignature === slackSignature;
}

// Query customer data from Supabase
async function getCustomerData(supabase: any, query: string) {
  // Search customers by name
  const { data: customers, error } = await supabase
    .from("customer_metrics")
    .select("*")
    .or(`nome_fantasia.ilike.%${query}%,razao_social.ilike.%${query}%`)
    .limit(5);

  if (error) throw error;
  return customers || [];
}

// Get detailed customer info
async function getCustomerDetail(supabase: any, customerId: string) {
  const [customerResult, contractsResult, domainsResult, ticketsResult, actionsResult, championsResult] = await Promise.all([
    supabase.from("customers").select("*").eq("id", customerId).single(),
    supabase.from("contracts").select("*").eq("customer_id", customerId),
    supabase.from("customer_domains").select("domain").eq("customer_id", customerId),
    supabase.from("support_tickets").select("*").eq("customer_id", customerId).order("created_at", { ascending: false }).limit(10),
    supabase.from("actions").select("*").eq("customer", customerResult?.data?.nome_fantasia || "").order("action_date", { ascending: false }).limit(10),
    supabase.from("champions").select("*").eq("customer_id", customerId),
  ]);

  return {
    customer: customerResult.data,
    contracts: contractsResult.data || [],
    domains: domainsResult.data || [],
    tickets: ticketsResult.data || [],
    actions: actionsResult.data || [],
    champions: championsResult.data || [],
  };
}

// Get metrics from customer_metrics view
async function getCustomerMetrics(supabase: any, customerId: string) {
  const { data } = await supabase
    .from("customer_metrics")
    .select("*")
    .eq("id", customerId)
    .single();
  return data;
}

// Use AI to generate a response
async function generateAIResponse(question: string, context: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return "Erro: API key não configurada.";

  try {
    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um assistente de Customer Success da Comunica. Responda perguntas sobre clientes usando os dados fornecidos. Seja conciso e direto. Use formatação compatível com Slack (negrito com *texto*, itálico com _texto_, listas com •). Sempre responda em português brasileiro. Se não tiver dados suficientes, diga claramente.`,
          },
          {
            role: "user",
            content: `Pergunta: ${question}\n\nDados disponíveis:\n${context}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Não consegui gerar uma resposta.";
  } catch (error) {
    console.error("AI error:", error);
    return "Erro ao processar a pergunta com IA.";
  }
}

// Send a message to Slack
async function sendSlackMessage(channel: string, text: string, threadTs?: string) {
  const token = Deno.env.get("SLACK_BOT_TOKEN");
  if (!token) throw new Error("SLACK_BOT_TOKEN not configured");

  const body: any = { channel, text };
  if (threadTs) body.thread_ts = threadTs;

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!data.ok) {
    console.error("Slack API error:", data.error);
    throw new Error(`Slack error: ${data.error}`);
  }
  return data;
}

// Handle app_mention events
async function handleMention(supabase: any, event: any) {
  const text = event.text.replace(/<@[A-Z0-9]+>/g, "").trim();
  const channel = event.channel;
  const threadTs = event.thread_ts || event.ts;

  if (!text) {
    await sendSlackMessage(channel, "Olá! 👋 Me pergunte sobre qualquer cliente. Ex: _qual o MRR do cliente X?_ ou _quantos tickets abertos tem o cliente Y?_", threadTs);
    return;
  }

  // Try to find customer names in the question
  const { data: allCustomers } = await supabase
    .from("customers")
    .select("id, nome_fantasia, razao_social, status");

  let matchedCustomer = null;
  const lowerText = text.toLowerCase();

  for (const c of (allCustomers || [])) {
    if (lowerText.includes(c.nome_fantasia.toLowerCase()) || 
        lowerText.includes(c.razao_social.toLowerCase())) {
      matchedCustomer = c;
      break;
    }
  }

  let context = "";

  if (matchedCustomer) {
    const [detail, metrics] = await Promise.all([
      getCustomerDetail(supabase, matchedCustomer.id),
      getCustomerMetrics(supabase, matchedCustomer.id),
    ]);

    const vigentes = detail.contracts.filter((c: any) => c.status_contrato?.toLowerCase() === "vigente");

    context = JSON.stringify({
      cliente: {
        nome: matchedCustomer.nome_fantasia,
        razao_social: matchedCustomer.razao_social,
        status: matchedCustomer.status,
        plano: detail.customer?.plano,
        fase: detail.customer?.fase,
        cs_responsavel: detail.customer?.cs_responsavel,
        data_cohort: detail.customer?.data_cohort,
      },
      metricas: metrics ? {
        mrr_atual: metrics.mrr_atual_total,
        ltv_total: metrics.ltv_total,
        total_contratos: metrics.total_contratos,
        contratos_vigentes: metrics.contratos_vigentes,
        meses_ativo: metrics.meses_ativo,
      } : null,
      contratos_vigentes: vigentes.map((c: any) => ({
        id_contrato: c.id_contrato,
        mrr: c.mrr,
        vigencia_inicial: c.vigencia_inicial,
        vigencia_final: c.vigencia_final,
        condicao_pagamento: c.condicao_pagamento,
      })),
      dominios: detail.domains.map((d: any) => d.domain),
      tickets_recentes: detail.tickets.slice(0, 5).map((t: any) => ({
        assunto: t.subject,
        status: t.status,
        prioridade: t.priority,
        criado_em: t.created_at,
      })),
      acoes_recentes: detail.actions.slice(0, 5).map((a: any) => ({
        titulo: a.title,
        tipo: a.action_type,
        categoria: a.category,
        data: a.action_date,
      })),
      contatos: detail.champions.map((ch: any) => ({
        nome: ch.name,
        cargo: ch.role,
        email: ch.email,
      })),
    }, null, 2);
  } else {
    // General query - try searching
    const words = text.split(" ").filter((w: string) => w.length > 3);
    let searchResults: any[] = [];
    
    for (const word of words) {
      const results = await getCustomerData(supabase, word);
      if (results.length > 0) {
        searchResults = results;
        break;
      }
    }

    if (searchResults.length > 0) {
      context = `Clientes encontrados:\n${JSON.stringify(searchResults.map((c: any) => ({
        nome: c.nome_fantasia,
        status: c.status,
        mrr: c.mrr_atual_total,
        ltv: c.ltv_total,
        contratos_vigentes: c.contratos_vigentes,
      })), null, 2)}`;
    } else {
      // Get overall stats
      const { data: allMetrics } = await supabase
        .from("customer_metrics")
        .select("*");
      
      const ativos = (allMetrics || []).filter((c: any) => c.status === "ativo");
      context = JSON.stringify({
        resumo_geral: {
          total_clientes: allMetrics?.length || 0,
          clientes_ativos: ativos.length,
          mrr_total: ativos.reduce((sum: number, c: any) => sum + (c.mrr_atual_total || 0), 0),
          ltv_total: (allMetrics || []).reduce((sum: number, c: any) => sum + (c.ltv_total || 0), 0),
        }
      }, null, 2);
    }
  }

  const aiResponse = await generateAIResponse(text, context);
  await sendSlackMessage(channel, aiResponse, threadTs);
}

// Handle slash commands
async function handleSlashCommand(supabase: any, payload: any) {
  const text = payload.text?.trim();
  const channelId = payload.channel_id;

  if (!text) {
    return {
      response_type: "ephemeral",
      text: "Use: `/compass [nome do cliente]` ou `/compass [pergunta sobre cliente]`\nExemplo: `/compass qual o MRR da Empresa X?`",
    };
  }

  // Acknowledge immediately, then process async
  // For slash commands, we respond immediately and then send follow-up
  const customers = await getCustomerData(supabase, text);

  if (customers.length === 0) {
    return {
      response_type: "ephemeral",
      text: `Nenhum cliente encontrado para "${text}". Tente outro nome.`,
    };
  }

  if (customers.length === 1) {
    const c = customers[0];
    const mrr = c.mrr_atual_total ? `R$ ${Number(c.mrr_atual_total).toLocaleString("pt-BR")}` : "N/A";
    const ltv = c.ltv_total ? `R$ ${Number(c.ltv_total).toLocaleString("pt-BR")}` : "N/A";
    return {
      response_type: "in_channel",
      text: `*${c.nome_fantasia}* (${c.status === "ativo" ? "✅ Ativo" : "⚪ Inativo"})\n• MRR: ${mrr}\n• LTV: ${ltv}\n• Contratos vigentes: ${c.contratos_vigentes || 0}/${c.total_contratos || 0}\n• Meses ativo: ${c.meses_ativo || 0}\n• CS: ${c.cs_responsavel || "N/A"}`,
    };
  }

  const list = customers.map((c: any) => {
    const mrr = c.mrr_atual_total ? `R$ ${Number(c.mrr_atual_total).toLocaleString("pt-BR")}` : "-";
    return `• *${c.nome_fantasia}* — ${c.status} — MRR: ${mrr}`;
  }).join("\n");

  return {
    response_type: "ephemeral",
    text: `Encontrei ${customers.length} clientes:\n${list}\n\nSeja mais específico para ver detalhes.`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();

    // URL verification challenge (Slack sends this when setting up Events API)
    try {
      const jsonBody = JSON.parse(bodyText);
      if (jsonBody.type === "url_verification") {
        return new Response(JSON.stringify({ challenge: jsonBody.challenge }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch {
      // Not JSON, might be form-encoded (slash command)
    }

    // Verify signature
    const clonedReq = new Request(req.url, {
      method: req.method,
      headers: req.headers,
    });
    const isValid = await verifySlackSignature(clonedReq, bodyText);
    if (!isValid) {
      console.error("Invalid Slack signature");
      return new Response("Invalid signature", { status: 401 });
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if it's a slash command (form-encoded)
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(bodyText);
      const payload = Object.fromEntries(params.entries());
      const result = await handleSlashCommand(supabase, payload);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle Events API
    const eventPayload = JSON.parse(bodyText);
    
    if (eventPayload.event?.type === "app_mention" || 
        (eventPayload.event?.type === "message" && eventPayload.event?.channel_type === "im" && !eventPayload.event?.bot_id)) {
      // Respond immediately with 200 to avoid retries
      const responsePromise = handleMention(supabase, eventPayload.event);
      responsePromise.catch((err) => console.error("Error handling event:", err));
      
      return new Response("ok", {
        status: 200,
        headers: corsHeaders,
      });
    }

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
