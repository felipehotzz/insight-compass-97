import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth via x-api-key header
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("CDB_API_KEY");

  if (!apiKey || apiKey !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse query params
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const fase = url.searchParams.get("fase");
    const search = url.searchParams.get("search");
    const plano = url.searchParams.get("plano");
    const cs = url.searchParams.get("cs_responsavel");
    const format = url.searchParams.get("format") || "full"; // full | summary

    // Fetch customers
    let customerQuery = supabase.from("customers").select("*").order("nome_fantasia");
    if (status) customerQuery = customerQuery.eq("status", status);
    if (plano) customerQuery = customerQuery.eq("plano", plano);
    if (cs) customerQuery = customerQuery.eq("cs_responsavel", cs);
    if (search) customerQuery = customerQuery.or(
      `nome_fantasia.ilike.%${search}%,razao_social.ilike.%${search}%,cnpj.ilike.%${search}%`
    );

    const { data: customers, error: custErr } = await customerQuery;
    if (custErr) throw custErr;

    // Fetch contracts & domains in parallel
    const [contractsRes, domainsRes] = await Promise.all([
      supabase.from("contracts").select("*"),
      supabase.from("customer_domains").select("customer_id, domain"),
    ]);

    if (contractsRes.error) throw contractsRes.error;
    if (domainsRes.error) throw domainsRes.error;

    const contracts = contractsRes.data || [];
    const domains = domainsRes.data || [];

    // Build domain map
    const domainMap = new Map<string, string>();
    domains.forEach((d) => domainMap.set(d.customer_id, d.domain));

    const now = new Date();

    // Helper: contract months
    const getContractMonths = (c: any): number => {
      if (c.meses_vigencia && c.meses_vigencia > 0) return c.meses_vigencia;
      if (!c.vigencia_inicial || !c.vigencia_final) return 1;
      try {
        const s = new Date(c.vigencia_inicial);
        const e = new Date(c.vigencia_final);
        return Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
      } catch {
        return 1;
      }
    };

    // Process each customer
    const result = (customers || []).map((customer) => {
      const cc = contracts.filter((c) => c.customer_id === customer.id);

      // MRR: only vigente contracts
      const mrr_atual = cc
        .filter((c) => c.status_contrato?.toLowerCase() === "vigente")
        .reduce((s, c) => s + (c.mrr || 0), 0);

      // LTV
      const ltv_total = cc.reduce((s, c) => s + (c.mrr || 0) * getContractMonths(c), 0);

      const contratos_vigentes = cc.filter((c) => c.status_contrato?.toLowerCase() === "vigente").length;

      // Meses ativo
      let meses_ativo = 0;
      if (customer.data_cohort) {
        const startDate = new Date(customer.data_cohort);
        let endDate = now;
        if (customer.status !== "ativo" && cc.length > 0) {
          const lastEnd = cc
            .filter((c) => c.vigencia_final)
            .map((c) => new Date(c.vigencia_final))
            .sort((a, b) => b.getTime() - a.getTime())[0];
          if (lastEnd) endDate = lastEnd;
        }
        meses_ativo = Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      }

      // Formato pagamento
      const mainContract = cc
        .filter((c) => c.status_contrato?.toLowerCase() === "vigente")
        .sort((a, b) => (b.mrr || 0) - (a.mrr || 0))[0];
      const formato_pagamento = mainContract?.condicao_pagamento || null;

      // Effective phase
      const activeContracts = cc.filter((c) => c.status_contrato?.toLowerCase() === "vigente");
      const latestActive = [...activeContracts]
        .sort((a, b) => new Date(b.vigencia_inicial || 0).getTime() - new Date(a.vigencia_inicial || 0).getTime())[0];
      const diasRestantes = latestActive?.vigencia_final
        ? Math.max(0, Math.floor((new Date(latestActive.vigencia_final).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      let effectiveFase = customer.fase || "onboarding";
      if (diasRestantes > 0 && diasRestantes <= 90 && effectiveFase !== "recuperacao" && effectiveFase !== "expansao") {
        effectiveFase = "renovacao";
      }

      let ongoingYear = 0;
      if (effectiveFase === "ongoing" && customer.data_cohort) {
        const cohortDate = new Date(customer.data_cohort);
        ongoingYear = Math.max(1, Math.floor((now.getTime() - cohortDate.getTime()) / (1000 * 60 * 60 * 24 * 365)) + 1);
      }

      const faseLabel =
        effectiveFase === "onboarding" ? "Onboarding" :
        effectiveFase === "ongoing" ? `Ongoing ${ongoingYear}` :
        effectiveFase === "renovacao" ? "Renovação" :
        effectiveFase === "recuperacao" ? "Recuperação" :
        effectiveFase === "expansao" ? "Expansão" :
        effectiveFase;

      if (format === "summary") {
        return {
          id: customer.id,
          nome_fantasia: customer.nome_fantasia,
          status: customer.status,
          fase: effectiveFase,
          fase_label: faseLabel,
          mrr_atual: mrr_atual,
          ltv_total: ltv_total,
        };
      }

      return {
        id: customer.id,
        cnpj: customer.cnpj,
        razao_social: customer.razao_social,
        nome_fantasia: customer.nome_fantasia,
        status: customer.status,
        plano: customer.plano,
        fase: effectiveFase,
        fase_label: faseLabel,
        ongoing_year: ongoingYear,
        cs_responsavel: customer.cs_responsavel,
        data_cohort: customer.data_cohort,
        domain: domainMap.get(customer.id) || null,
        mrr_atual: mrr_atual,
        ltv_total: ltv_total,
        total_contratos: cc.length,
        contratos_vigentes: contratos_vigentes,
        meses_ativo: meses_ativo,
        formato_pagamento: formato_pagamento,
        dias_restantes_contrato: diasRestantes,
        contratos: cc.map((c) => ({
          id_contrato: c.id_contrato,
          status_contrato: c.status_contrato,
          mrr: c.mrr,
          valor_contrato: c.valor_contrato,
          vigencia_inicial: c.vigencia_inicial,
          vigencia_final: c.vigencia_final,
          meses_vigencia: c.meses_vigencia,
          tipo_movimento: c.tipo_movimento,
          condicao_pagamento: c.condicao_pagamento,
          vendedor: c.vendedor,
        })),
      };
    });

    // Apply fase filter after calculation (since fase is computed)
    let filtered = result;
    if (fase) {
      filtered = result.filter((c) => c.fase === fase);
    }

    return new Response(
      JSON.stringify({
        total: filtered.length,
        updated_at: now.toISOString(),
        customers: filtered,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
