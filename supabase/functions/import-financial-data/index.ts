import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FinancialRow {
  period_date: string
  [key: string]: string | number | null | undefined
}

// Parse number handling BR format (1.234,56) and US format (1,234.56)
// Also handles negative values in parentheses like (1.234,56)
function parseNumber(value: string | undefined | null): number | null {
  if (!value || value.trim() === '' || value.trim() === '-') return null
  
  let cleanValue = value.trim()
  
  // Check if negative (wrapped in parentheses)
  const isNegative = cleanValue.startsWith('(') && cleanValue.endsWith(')')
  if (isNegative) {
    cleanValue = cleanValue.slice(1, -1)
  }
  
  // Remove currency symbols and spaces
  cleanValue = cleanValue.replace(/[R$\s]/g, '')
  
  // Detect format: if has comma after dot, it's BR format (1.234,56)
  // If has dot after comma, it's US format (1,234.56)
  const lastComma = cleanValue.lastIndexOf(',')
  const lastDot = cleanValue.lastIndexOf('.')
  
  let normalized: string
  
  if (lastComma > lastDot) {
    // BR format: 1.234,56 -> remove dots, replace comma with dot
    normalized = cleanValue.replace(/\./g, '').replace(',', '.')
  } else if (lastDot > lastComma) {
    // US format: 1,234.56 -> remove commas
    normalized = cleanValue.replace(/,/g, '')
  } else if (lastComma === -1 && lastDot === -1) {
    // No separators, just a number
    normalized = cleanValue
  } else if (lastComma !== -1 && lastDot === -1) {
    // Only comma, could be BR decimal: 123,45
    normalized = cleanValue.replace(',', '.')
  } else {
    // Only dot, US decimal: 123.45
    normalized = cleanValue
  }
  
  const result = parseFloat(normalized)
  if (isNaN(result)) return null
  
  return isNegative ? -result : result
}

// Parse percentage (handles both 45.5% and 45,5%)
function parsePercentage(value: string | undefined | null): number | null {
  if (!value || value.trim() === '' || value.trim() === '-') return null
  
  let cleanValue = value.trim().replace('%', '')
  
  // Check if negative
  const isNegative = cleanValue.startsWith('(') && cleanValue.endsWith(')')
  if (isNegative) {
    cleanValue = cleanValue.slice(1, -1)
  }
  
  // Replace comma with dot for decimals
  cleanValue = cleanValue.replace(',', '.')
  
  const result = parseFloat(cleanValue)
  if (isNaN(result)) return null
  
  return isNegative ? -result : result
}

// Parse date from column header like "jan/22", "fev/23", etc.
function parseMonthYear(header: string): string | null {
  const months: Record<string, string> = {
    'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
    'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
    'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
  }
  
  const match = header.toLowerCase().match(/^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\/(\d{2})$/)
  if (!match) return null
  
  const month = months[match[1]]
  const year = parseInt(match[2]) >= 50 ? `19${match[2]}` : `20${match[2]}`
  
  return `${year}-${month}-01`
}

// Map row names to fields
const fieldMapping: Record<string, string> = {
  'mrr': 'mrr',
  'arr': 'arr',
  'receita bruta': 'gross_revenue',
  'receita recorrente': 'recurring_revenue',
  'receita não recorrente': 'non_recurring_revenue',
  'impostos sobre receita': 'revenue_taxes',
  'receita liquida': 'net_revenue',
  'receita líquida': 'net_revenue',
  'custo dos serviços prestados': 'cost_of_services',
  'lucro bruto': 'gross_profit',
  'margem bruta (%)': 'gross_profit_margin',
  'overhead sga': 'overhead_sga',
  'despesas de vendas e marketing': 'sales_marketing_expenses',
  'despesas gerais e administrativas': 'ga_expenses',
  'ebitda': 'ebitda',
  'margem ebitda (%)': 'ebitda_margin',
  'ebit': 'ebit',
  'lucro líquido': 'net_income',
  'lucro liquido': 'net_income',
  'fcf de operações': 'cash_flow_operations',
  'fcf de operacoes': 'cash_flow_operations',
  'free cash flow': 'free_cash_flow',
  'saldo em caixa': 'cash_balance',
  'nº de clientes ativos': 'customers_count',
  'n de clientes ativos': 'customers_count',
  'numero de clientes ativos': 'customers_count',
  'nº de colaboradores': 'employees_count',
  'n de colaboradores': 'employees_count',
  'numero de colaboradores': 'employees_count',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify user is admin
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin
    const { data: roleData } = await supabaseUser
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!roleData || roleData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can import data' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { csvContent } = await req.json()
    
    if (!csvContent) {
      return new Response(JSON.stringify({ error: 'No CSV content provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Starting CSV parsing...')
    
    // Parse CSV
    const lines = csvContent.split('\n').map((line: string) => line.trim()).filter((line: string) => line)
    
    if (lines.length < 2) {
      return new Response(JSON.stringify({ error: 'CSV must have at least header and one data row' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // First line is headers with month columns
    const headers = lines[0].split(',').map((h: string) => h.trim())
    console.log('Headers found:', headers)
    
    // Find month columns (skip first column which is the row name)
    const monthColumns: { index: number; date: string }[] = []
    for (let i = 1; i < headers.length; i++) {
      const date = parseMonthYear(headers[i])
      if (date) {
        monthColumns.push({ index: i, date })
      }
    }
    
    console.log('Month columns found:', monthColumns.length)
    
    if (monthColumns.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid month columns found (expected format: jan/22, fev/23, etc.)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Initialize data structure for each month
    const monthlyData: Record<string, FinancialRow> = {}
    for (const col of monthColumns) {
      monthlyData[col.date] = { period_date: col.date }
    }

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(',').map((c: string) => c.trim())
      const rowName = cells[0]?.toLowerCase().trim()
      
      if (!rowName) continue
      
      const field = fieldMapping[rowName]
      if (!field) {
        console.log('Unknown row:', rowName)
        continue
      }

      console.log('Processing row:', rowName, '-> field:', field)
      
      for (const col of monthColumns) {
        const value = cells[col.index]
        
        if (field === 'gross_profit_margin' || field === 'ebitda_margin') {
          monthlyData[col.date][field] = parsePercentage(value)
        } else if (field === 'customers_count' || field === 'employees_count') {
          const parsed = parseNumber(value)
          monthlyData[col.date][field] = parsed !== null ? Math.round(parsed) : null
        } else {
          monthlyData[col.date][field] = parseNumber(value)
        }
      }
    }

    // Insert/upsert data
    const records = Object.values(monthlyData)
    console.log('Upserting', records.length, 'records')

    const { data, error } = await supabaseUser
      .from('financial_metrics')
      .upsert(records, { onConflict: 'period_date' })
      .select()

    if (error) {
      console.error('Upsert error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Successfully imported', data?.length, 'records')

    return new Response(JSON.stringify({
      success: true,
      imported: data?.length || 0,
      months: monthColumns.map(c => c.date)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error:', errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})