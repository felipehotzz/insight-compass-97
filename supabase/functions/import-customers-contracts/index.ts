import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function parseMonetaryValue(value: string): number | null {
  if (!value || value.trim() === '' || value.trim() === '-') return null
  
  let cleanValue = value.trim()
  
  // Handle negative values in parentheses
  const isNegative = cleanValue.startsWith('(') && cleanValue.endsWith(')')
  if (isNegative) {
    cleanValue = cleanValue.slice(1, -1)
  }
  
  // Remove currency symbols and spaces
  cleanValue = cleanValue.replace(/[R$\s]/g, '')
  
  // Count dots and commas
  const dotCount = (cleanValue.match(/\./g) || []).length
  const commaCount = (cleanValue.match(/,/g) || []).length
  
  const lastComma = cleanValue.lastIndexOf(',')
  const lastDot = cleanValue.lastIndexOf('.')
  
  let normalized: string
  
  if (lastComma > lastDot) {
    // BR format: 1.234,56 -> remove dots, replace comma with dot
    normalized = cleanValue.replace(/\./g, '').replace(',', '.')
  } else if (lastDot > lastComma && commaCount > 0) {
    // US format with comma as thousands: 1,234.56 -> remove commas
    normalized = cleanValue.replace(/,/g, '')
  } else if (lastComma === -1 && lastDot === -1) {
    // No separators, just a number
    normalized = cleanValue
  } else if (commaCount > 0 && dotCount === 0) {
    // Only comma(s), BR decimal or BR thousands
    if (commaCount === 1) {
      normalized = cleanValue.replace(',', '.')
    } else {
      normalized = cleanValue.replace(/,/g, '')
    }
  } else if (dotCount > 0 && commaCount === 0) {
    // Only dot(s) - need to determine if it's decimal or thousands
    if (dotCount === 1) {
      const afterDot = cleanValue.split('.')[1]
      if (afterDot && afterDot.length === 3 && /^\d{3}$/.test(afterDot)) {
        normalized = cleanValue.replace(/\./g, '')
      } else {
        normalized = cleanValue
      }
    } else {
      normalized = cleanValue.replace(/\./g, '')
    }
  } else {
    normalized = cleanValue
  }
  
  const result = parseFloat(normalized)
  if (isNaN(result)) return null
  
  return isNegative ? -result : result
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '' || dateStr.trim() === '-') return null
  
  const cleaned = dateStr.trim()
  
  // Format: DD/MM/YYYY
  const ddmmyyyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0')
    const month = ddmmyyyy[2].padStart(2, '0')
    const year = ddmmyyyy[3]
    return `${year}-${month}-${day}`
  }
  
  // Format: YYYY-MM-DD
  const iso = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    return cleaned
  }
  
  // Format: mon/yy (jan/22)
  const monthYear = cleaned.match(/^(\w{3})\/(\d{2})$/)
  if (monthYear) {
    const months: Record<string, string> = {
      'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
      'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
      'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
    }
    const month = months[monthYear[1].toLowerCase()]
    const year = `20${monthYear[2]}`
    if (month) {
      return `${year}-${month}-01`
    }
  }
  
  return null
}

function parseInt2(value: string): number | null {
  if (!value || value.trim() === '' || value.trim() === '-') return null
  const parsed = parseInt(value.trim(), 10)
  return isNaN(parsed) ? null : parsed
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ';' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { csvContent } = await req.json()
    
    if (!csvContent) {
      throw new Error('CSV content is required')
    }

    console.log('Starting import of customers and contracts...')
    
    const lines = csvContent.split('\n').filter((line: string) => line.trim() !== '')
    
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header and one data row')
    }

    // Parse header - expected columns
    const header = parseCSVLine(lines[0])
    console.log('Header columns:', header.length)
    
    // Map header indices
    const colMap: Record<string, number> = {}
    header.forEach((col, idx) => {
      const normalized = col.toLowerCase().trim()
      if (normalized.includes('id financeiro')) colMap['id_financeiro'] = idx
      else if (normalized.includes('status cliente')) colMap['status_cliente'] = idx
      else if (normalized.includes('id cliente') || normalized.includes('cnpj')) colMap['cnpj'] = idx
      else if (normalized.includes('razão social') || normalized.includes('razao social')) colMap['razao_social'] = idx
      else if (normalized.includes('nome fantasia')) colMap['nome_fantasia'] = idx
      else if (normalized.includes('mrr atual')) colMap['mrr_atual'] = idx
      else if (normalized.includes('data do cohort') || normalized.includes('cohort')) colMap['data_cohort'] = idx
      else if (normalized.includes('data do movimento') || normalized.includes('movimento')) colMap['data_movimento'] = idx
      else if (normalized.includes('mrr') && !normalized.includes('atual') && !normalized.includes('movimento') && !normalized.includes('original')) colMap['mrr'] = idx
      else if (normalized.includes('movimento de mrr')) colMap['movimento_mrr'] = idx
      else if (normalized.includes('tipo de movimento')) colMap['tipo_movimento'] = idx
      else if (normalized.includes('status do contrato') || normalized.includes('status contrato')) colMap['status_contrato'] = idx
      else if (normalized.includes('id do contrato') || normalized.includes('id contrato')) colMap['id_contrato'] = idx
      else if (normalized.includes('tipo do documento') || normalized.includes('tipo documento')) colMap['tipo_documento'] = idx
      else if (normalized.includes('vigência inicial') || normalized.includes('vigencia inicial')) colMap['vigencia_inicial'] = idx
      else if (normalized.includes('vigência final') || normalized.includes('vigencia final')) colMap['vigencia_final'] = idx
      else if (normalized.includes('meses de vigência') || normalized.includes('meses vigencia')) colMap['meses_vigencia'] = idx
      else if (normalized.includes('valor do contrato') || normalized.includes('valor contrato')) colMap['valor_contrato'] = idx
      else if (normalized.includes('tipo de renovação') || normalized.includes('tipo renovacao')) colMap['tipo_renovacao'] = idx
      else if (normalized.includes('índice') || normalized.includes('indice')) colMap['indice_renovacao'] = idx
      else if (normalized.includes('vendedor')) colMap['vendedor'] = idx
      else if (normalized.includes('valor original') || normalized.includes('mrr original')) colMap['valor_original_mrr'] = idx
      else if (normalized.includes('observação') || normalized.includes('observacao')) colMap['observacoes'] = idx
      else if (normalized.includes('condição') || normalized.includes('condicao') || normalized.includes('pagamento')) colMap['condicao_pagamento'] = idx
    })
    
    console.log('Column mapping:', colMap)
    
    // Check required columns
    if (colMap['cnpj'] === undefined) {
      throw new Error('Coluna "Id cliente (CNPJ)" não encontrada no CSV')
    }
    if (colMap['razao_social'] === undefined) {
      throw new Error('Coluna "Razão Social" não encontrada no CSV')
    }

    // Group data by CNPJ to create customers first
    const customerMap = new Map<string, {
      cnpj: string
      razao_social: string
      nome_fantasia: string
      status: string
      data_cohort: string | null
      contracts: any[]
    }>()

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length < 5) continue // Skip empty or malformed rows
      
      const cnpj = values[colMap['cnpj']]?.trim()
      if (!cnpj) continue
      
      const razaoSocial = values[colMap['razao_social']]?.trim() || ''
      const nomeFantasia = values[colMap['nome_fantasia']]?.trim() || razaoSocial
      const statusCliente = values[colMap['status_cliente']]?.trim().toLowerCase() || 'ativo'
      const dataCohort = parseDate(values[colMap['data_cohort']] || '')
      
      // Get or create customer entry
      if (!customerMap.has(cnpj)) {
        customerMap.set(cnpj, {
          cnpj,
          razao_social: razaoSocial,
          nome_fantasia: nomeFantasia,
          status: statusCliente === 'ativo' ? 'ativo' : 'inativo',
          data_cohort: dataCohort,
          contracts: []
        })
      }
      
      const customer = customerMap.get(cnpj)!
      
      // Update customer status to ativo if any contract shows ativo
      if (statusCliente === 'ativo') {
        customer.status = 'ativo'
      }
      
      // Update cohort to earliest date
      if (dataCohort && (!customer.data_cohort || dataCohort < customer.data_cohort)) {
        customer.data_cohort = dataCohort
      }
      
      // Parse contract data
      const mrrAtualValue = values[colMap['mrr_atual']]?.trim() || ''
      const mrrAtual = mrrAtualValue !== '' && mrrAtualValue !== '-' && mrrAtualValue !== '0'
      
      const contract = {
        id_financeiro: values[colMap['id_financeiro']]?.trim() || null,
        status_cliente: statusCliente,
        status_contrato: values[colMap['status_contrato']]?.trim().toLowerCase() || null,
        tipo_documento: values[colMap['tipo_documento']]?.trim() || null,
        data_movimento: parseDate(values[colMap['data_movimento']] || ''),
        vigencia_inicial: parseDate(values[colMap['vigencia_inicial']] || ''),
        vigencia_final: parseDate(values[colMap['vigencia_final']] || ''),
        meses_vigencia: parseInt2(values[colMap['meses_vigencia']] || ''),
        mrr: parseMonetaryValue(values[colMap['mrr']] || ''),
        mrr_atual: mrrAtual,
        movimento_mrr: parseMonetaryValue(values[colMap['movimento_mrr']] || ''),
        tipo_movimento: values[colMap['tipo_movimento']]?.trim().toLowerCase() || null,
        valor_contrato: parseMonetaryValue(values[colMap['valor_contrato']] || ''),
        tipo_renovacao: values[colMap['tipo_renovacao']]?.trim() || null,
        indice_renovacao: values[colMap['indice_renovacao']]?.trim() || null,
        vendedor: values[colMap['vendedor']]?.trim() || null,
        valor_original_mrr: parseMonetaryValue(values[colMap['valor_original_mrr']] || ''),
        observacoes: values[colMap['observacoes']]?.trim() || null,
        condicao_pagamento: values[colMap['condicao_pagamento']]?.trim() || null,
      }
      
      customer.contracts.push(contract)
    }

    console.log(`Found ${customerMap.size} unique customers`)
    
    let customersCreated = 0
    let customersUpdated = 0
    let contractsCreated = 0
    let contractsUpdated = 0
    let errors: string[] = []

    // Process each customer
    for (const [cnpj, customerData] of customerMap) {
      try {
        // Check if customer exists
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('cnpj', cnpj)
          .single()

        let customerId: string

        if (existingCustomer) {
          // Update existing customer
          const { error: updateError } = await supabase
            .from('customers')
            .update({
              razao_social: customerData.razao_social,
              nome_fantasia: customerData.nome_fantasia,
              status: customerData.status,
              data_cohort: customerData.data_cohort,
            })
            .eq('id', existingCustomer.id)

          if (updateError) {
            errors.push(`Erro ao atualizar cliente ${cnpj}: ${updateError.message}`)
            continue
          }

          customerId = existingCustomer.id
          customersUpdated++
        } else {
          // Create new customer
          const { data: newCustomer, error: insertError } = await supabase
            .from('customers')
            .insert({
              cnpj: customerData.cnpj,
              razao_social: customerData.razao_social,
              nome_fantasia: customerData.nome_fantasia,
              status: customerData.status,
              data_cohort: customerData.data_cohort,
            })
            .select('id')
            .single()

          if (insertError) {
            errors.push(`Erro ao criar cliente ${cnpj}: ${insertError.message}`)
            continue
          }

          customerId = newCustomer.id
          customersCreated++
        }

        // Process contracts for this customer
        for (const contract of customerData.contracts) {
          // Check if contract exists (by id_financeiro)
          if (contract.id_financeiro) {
            const { data: existingContract } = await supabase
              .from('contracts')
              .select('id')
              .eq('id_financeiro', contract.id_financeiro)
              .single()

            if (existingContract) {
              // Update existing contract
              const { error: contractUpdateError } = await supabase
                .from('contracts')
                .update({
                  customer_id: customerId,
                  ...contract
                })
                .eq('id', existingContract.id)

              if (contractUpdateError) {
                errors.push(`Erro ao atualizar contrato ${contract.id_financeiro}: ${contractUpdateError.message}`)
              } else {
                contractsUpdated++
              }
            } else {
              // Create new contract
              const { error: contractInsertError } = await supabase
                .from('contracts')
                .insert({
                  customer_id: customerId,
                  ...contract
                })

              if (contractInsertError) {
                errors.push(`Erro ao criar contrato ${contract.id_financeiro}: ${contractInsertError.message}`)
              } else {
                contractsCreated++
              }
            }
          } else {
            // No id_financeiro, create new contract
            const { error: contractInsertError } = await supabase
              .from('contracts')
              .insert({
                customer_id: customerId,
                ...contract
              })

            if (contractInsertError) {
              errors.push(`Erro ao criar contrato sem ID: ${contractInsertError.message}`)
            } else {
              contractsCreated++
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        errors.push(`Erro ao processar cliente ${cnpj}: ${errorMessage}`)
      }
    }
    console.log(`Import complete: ${customersCreated} customers created, ${customersUpdated} updated, ${contractsCreated} contracts created, ${contractsUpdated} updated`)
    if (errors.length > 0) {
      console.log('Errors:', errors.slice(0, 10))
    }

    return new Response(
      JSON.stringify({
        success: true,
        customersCreated,
        customersUpdated,
        contractsCreated,
        contractsUpdated,
        totalCustomers: customerMap.size,
        errors: errors.slice(0, 10)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Import error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})