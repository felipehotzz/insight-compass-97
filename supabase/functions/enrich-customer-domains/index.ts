import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchResult {
  url: string;
  title: string;
  description: string;
}

function extractDomain(url: string): string {
  try {
    // Handle URLs that don't have protocol
    let urlToParse = url.trim();
    if (!urlToParse.startsWith("http://") && !urlToParse.startsWith("https://")) {
      urlToParse = `https://${urlToParse}`;
    }
    
    const urlObj = new URL(urlToParse);
    let domain = urlObj.hostname.toLowerCase();
    
    // Remove common prefixes (www, www2, ri, ir, etc.)
    const prefixesToRemove = ["www.", "www2.", "www3.", "ri.", "ir.", "m.", "mobile."];
    for (const prefix of prefixesToRemove) {
      if (domain.startsWith(prefix)) {
        domain = domain.substring(prefix.length);
        break;
      }
    }
    
    return domain;
  } catch {
    return "";
  }
}

function cleanCompanyName(name: string): string {
  // Remove common suffixes and clean up the name for better search
  return name
    .replace(/\s+(ltda|s\.?a\.?|me|eireli|epp|ss|sc)\.?$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlApiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { customerId, customerName, mode = "single" } = await req.json();

    // Single customer mode
    if (mode === "single" && customerId && customerName) {
      const result = await enrichSingleCustomer(
        supabase,
        firecrawlApiKey,
        customerId,
        customerName
      );
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cleanup mode - fix existing domains format
    if (mode === "cleanup") {
      const { data: existingDomains, error: domainsError } = await supabase
        .from("customer_domains")
        .select("id, domain");

      if (domainsError) {
        throw new Error(`Failed to fetch domains: ${domainsError.message}`);
      }

      let updated = 0;
      let skipped = 0;

      for (const domainRecord of existingDomains || []) {
        const cleanedDomain = extractDomain(domainRecord.domain);
        
        if (cleanedDomain && cleanedDomain !== domainRecord.domain) {
          const { error: updateError } = await supabase
            .from("customer_domains")
            .update({ domain: cleanedDomain })
            .eq("id", domainRecord.id);

          if (!updateError) {
            updated++;
            console.log(`Updated: ${domainRecord.domain} -> ${cleanedDomain}`);
          }
        } else {
          skipped++;
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          results: { 
            total: existingDomains?.length || 0, 
            updated, 
            skipped 
          } 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch mode - get all customers without domains
    if (mode === "batch") {
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("id, nome_fantasia")
        .eq("status", "ativo");

      if (customersError) {
        throw new Error(`Failed to fetch customers: ${customersError.message}`);
      }

      // Get existing domains
      const { data: existingDomains } = await supabase
        .from("customer_domains")
        .select("customer_id");

      const existingCustomerIds = new Set(
        existingDomains?.map((d) => d.customer_id) || []
      );

      // Filter customers without domains
      const customersWithoutDomains = customers?.filter(
        (c) => !existingCustomerIds.has(c.id)
      ) || [];

      console.log(`Found ${customersWithoutDomains.length} customers without domains`);

      const results = {
        total: customersWithoutDomains.length,
        processed: 0,
        success: 0,
        failed: 0,
        details: [] as Array<{ customer: string; domain?: string; error?: string }>,
      };

      // Process in batches to avoid rate limits
      for (const customer of customersWithoutDomains) {
        try {
          const result = await enrichSingleCustomer(
            supabase,
            firecrawlApiKey,
            customer.id,
            customer.nome_fantasia
          );

          results.processed++;
          if (result.success) {
            results.success++;
            results.details.push({
              customer: customer.nome_fantasia,
              domain: result.domain,
            });
          } else {
            results.failed++;
            results.details.push({
              customer: customer.nome_fantasia,
              error: result.error,
            });
          }

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          results.processed++;
          results.failed++;
          results.details.push({
            customer: customer.nome_fantasia,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid request parameters" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function enrichSingleCustomer(
  supabase: SupabaseClient,
  firecrawlApiKey: string,
  customerId: string,
  customerName: string
): Promise<{ success: boolean; domain?: string; error?: string }> {
  const cleanedName = cleanCompanyName(customerName);
  console.log(`Searching domain for: ${cleanedName}`);

  // Use Firecrawl search to find the company website
  const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firecrawlApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `${cleanedName} site oficial`,
      limit: 5,
      lang: "pt",
      country: "BR",
    }),
  });

  const searchData = await searchResponse.json();

  if (!searchResponse.ok) {
    console.error("Firecrawl search error:", searchData);
    return { success: false, error: searchData.error || "Search failed" };
  }

  // Find the best matching result
  const results: SearchResult[] = searchData.data || [];
  if (results.length === 0) {
    return { success: false, error: "No results found" };
  }

  // Try to find a result that matches the company name
  const nameWords = cleanedName.toLowerCase().split(" ");
  let bestMatch: string | null = null;

  for (const result of results) {
    const domain = extractDomain(result.url);
    if (!domain) continue;

    // Skip social media and common platforms
    const skipDomains = [
      "facebook.com",
      "instagram.com",
      "linkedin.com",
      "twitter.com",
      "youtube.com",
      "tiktok.com",
      "wikipedia.org",
      "reclameaqui.com.br",
      "jusbrasil.com.br",
      "glassdoor.com",
      "indeed.com",
    ];

    if (skipDomains.some((skip) => domain.includes(skip))) {
      continue;
    }

    // Check if domain contains any word from company name
    const domainLower = domain.toLowerCase();
    const matchesName = nameWords.some(
      (word) => word.length > 3 && domainLower.includes(word)
    );

    if (matchesName) {
      bestMatch = domain;
      break;
    }

    // Use first non-skipped result as fallback
    if (!bestMatch) {
      bestMatch = domain;
    }
  }

  if (!bestMatch) {
    return { success: false, error: "No suitable domain found" };
  }

  console.log(`Found domain for ${customerName}: ${bestMatch}`);

  // Check if domain already exists for this customer
  const { data: existing } = await supabase
    .from("customer_domains")
    .select("id")
    .eq("customer_id", customerId)
    .eq("domain", bestMatch)
    .single();

  if (existing) {
    return { success: true, domain: bestMatch };
  }

  // Insert the domain
  const { error: insertError } = await supabase
    .from("customer_domains")
    .insert({
      customer_id: customerId,
      domain: bestMatch,
    });

  if (insertError) {
    console.error("Insert error:", insertError);
    return { success: false, error: insertError.message };
  }

  return { success: true, domain: bestMatch };
}
