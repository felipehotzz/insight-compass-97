import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function parseMonetaryValue(value: string): number | null {
  if (!value || value.trim() === '' || value.trim() === '-') return null
  
  let cleanValue = value.trim()
  
  const isNegative = cleanValue.startsWith('(') && cleanValue.endsWith(')')
  if (isNegative) {
    cleanValue = cleanValue.slice(1, -1)
  }
  
  cleanValue = cleanValue.replace(/[R$\s]/g, '')
  
  const dotCount = (cleanValue.match(/\./g) || []).length
  const commaCount = (cleanValue.match(/,/g) || []).length
  
  const lastComma = cleanValue.lastIndexOf(',')
  const lastDot = cleanValue.lastIndexOf('.')
  
  let normalized: string
  
  if (lastComma > lastDot) {
    normalized = cleanValue.replace(/\./g, '').replace(',', '.')
  } else if (lastDot > lastComma && commaCount > 0) {
    normalized = cleanValue.replace(/,/g, '')
  } else if (lastComma === -1 && lastDot === -1) {
    normalized = cleanValue
  } else if (commaCount > 0 && dotCount === 0) {
    if (commaCount === 1) {
      normalized = cleanValue.replace(',', '.')
    } else {
      normalized = cleanValue.replace(/,/g, '')
    }
  } else if (dotCount > 0 && commaCount === 0) {
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
  
  const ddmmyyyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0')
    const month = ddmmyyyy[2].padStart(2, '0')
    const year = ddmmyyyy[3]
    return `${year}-${month}-${day}`
  }
  
  const iso = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    return cleaned
  }
  
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

function parseCSVLine(line: string, separator: string = ','): string[] {
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
    } else if (char === separator && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

function detectSeparator(headerLine: string): string {
  let inQuotes = false
  let semicolonCount = 0
  let commaCount = 0
  
  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (!inQuotes) {
      if (char === ';') semicolonCount++
      if (char === ',') commaCount++
    }
  }
  
  return semicolonCount > commaCount ? ';' : ','
}

serve(async (req) => {
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

    const { csvContent, fileName, userId } = await req.json()
    
    if (!csvContent) {
      throw new Error('CSV content is required')
    }

    // Create import history record
    const { data: importRecord, error: importError } = await supabase
      .from('import_history')
      .insert({
        import_type: 'customers_contracts',
        file_name: fileName || 'import.csv',
        imported_by: userId || null,
        status: 'processing'
      })
      .select('id')
      .single()

    if (importError) {
      console.error('Error creating import record:', importError)
    }

    const importId = importRecord?.id

    console.log('Starting import of customers and contracts...')
    
    const lines = csvContent.split(/\r?\n/).filter((line: string) => line.trim())
    
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row')
    }

    const separator = detectSeparator(lines[0])
    console.log(`Detected separator: ${separator === ';' ? 'semicolon' : 'comma'}`)
    
    const headers = parseCSVLine(lines[0], separator).map((h: string) => h.toLowerCase().trim())
    console.log('Header columns:', headers.length, headers.slice(0, 5))
    
    // Column mapping
    const colMap: Record<string, number> = {}
    
    const columnMappings: Record<string, string[]> = {
      'id_financeiro': ['id financeiro', 'id_financeiro'],
      'status_cliente': ['status cliente', 'status_cliente'],
      'cnpj': ['id cliente (cnpj)', 'cnpj', 'id cliente'],
      'razao_social': ['razão social', 'razao social', 'razao_social'],
      'nome_fantasia': ['nome fantasia (omie)', 'nome fantasia', 'nome_fantasia'],
      'mrr_atual': ['mrr atual', 'mrr_atual'],
      'data_cohort': ['cohort', 'data cohort', 'data_cohort'],
      'data_movimento': ['data movimento', 'data_movimento'],
      'mrr': ['mrr'],
      'movimento_mrr': ['movimento mrr', 'movimento_mrr'],
      'tipo_movimento': ['tipo movimento', 'tipo_movimento'],
      'status_contrato': ['status contrato', 'status_contrato'],
      'id_contrato': ['id contrato', 'id_contrato'],
      'tipo_documento': ['tipo documento', 'tipo_documento'],
      'vigencia_inicial': ['vigência inicial', 'vigencia inicial', 'vigencia_inicial'],
      'vigencia_final': ['vigência final', 'vigencia final', 'vigencia_final'],
      'meses_vigencia': ['meses vigência', 'meses vigencia', 'meses_vigencia'],
      'valor_contrato': ['valor contrato', 'valor_contrato'],
      'tipo_renovacao': ['tipo renovação', 'tipo renovacao', 'tipo_renovacao'],
      'indice_renovacao': ['índice renovação', 'indice renovacao', 'indice_renovacao'],
      'vendedor': ['vendedor'],
      'valor_original_mrr': ['valor original mrr', 'valor_original_mrr'],
      'observacoes': ['observações', 'observacoes'],
      'condicao_pagamento': ['condição pagamento', 'condicao pagamento', 'condicao_pagamento'],
    }

    for (const [key, variations] of Object.entries(columnMappings)) {
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toLowerCase().trim()
        if (variations.some(v => header.includes(v.toLowerCase()))) {
          colMap[key] = i
          break
        }
      }
    }
    
    console.log('Column mapping:', colMap)

    if (colMap['cnpj'] === undefined) {
      throw new Error('Coluna CNPJ não encontrada. Verifique se o arquivo contém a coluna "Id cliente (CNPJ)"')
    }

    // Parse all data first
    interface CustomerData {
      cnpj: string
      razao_social: string
      nome_fantasia: string
      status: string
      data_cohort: string | null
      contracts: any[]
    }
    
    const customerMap = new Map<string, CustomerData>()
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], separator)
      if (values.length < 3) continue
      
      const cnpj = values[colMap['cnpj']]?.trim()
      if (!cnpj) continue
      
      // Validate CNPJ format - should be numeric only (with optional dots/dashes)
      const cnpjClean = cnpj.replace(/[\.\-\/]/g, '')
      if (!/^\d{11,14}$/.test(cnpjClean)) {
        console.log(`Skipping invalid CNPJ: ${cnpj}`)
        continue
      }
      
      const razaoSocial = values[colMap['razao_social']]?.trim() || ''
      const nomeFantasia = values[colMap['nome_fantasia']]?.trim() || razaoSocial
      const statusCliente = values[colMap['status_cliente']]?.trim().toLowerCase() || 'ativo'
      const dataCohort = parseDate(values[colMap['data_cohort']] || '')
      
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
      
      if (statusCliente === 'ativo') {
        customer.status = 'ativo'
      }
      
      if (dataCohort && (!customer.data_cohort || dataCohort < customer.data_cohort)) {
        customer.data_cohort = dataCohort
      }
      
      const mrrAtualValue = values[colMap['mrr_atual']]?.trim() || ''
      const mrrAtual = mrrAtualValue !== '' && mrrAtualValue !== '-' && mrrAtualValue !== '0'
      
      customer.contracts.push({
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
        id_contrato: values[colMap['id_contrato']]?.trim() || null,
      })
    }

    console.log(`Found ${customerMap.size} unique customers`)
    
    // Get all existing customers by CNPJ in batch
    const cnpjs = Array.from(customerMap.keys())
    const { data: existingCustomers } = await supabase
      .from('customers')
      .select('id, cnpj')
      .in('cnpj', cnpjs)

    const existingCustomerMap = new Map<string, string>()
    for (const c of existingCustomers || []) {
      existingCustomerMap.set(c.cnpj, c.id)
    }

    let customersCreated = 0
    let customersUpdated = 0
    let contractsCreated = 0
    let errors: string[] = []

    // Prepare batch inserts
    const customersToInsert: any[] = []
    const customersToUpdate: { cnpj: string; data: any }[] = []
    
    for (const [cnpj, customerData] of customerMap) {
      if (existingCustomerMap.has(cnpj)) {
        customersToUpdate.push({
          cnpj,
          data: {
            razao_social: customerData.razao_social,
            nome_fantasia: customerData.nome_fantasia,
            status: customerData.status,
            data_cohort: customerData.data_cohort,
          }
        })
      } else {
        customersToInsert.push({
          cnpj: customerData.cnpj,
          razao_social: customerData.razao_social,
          nome_fantasia: customerData.nome_fantasia,
          status: customerData.status,
          data_cohort: customerData.data_cohort,
          import_id: importId,
        })
      }
    }

    // Batch insert new customers
    if (customersToInsert.length > 0) {
      const { data: newCustomers, error: insertError } = await supabase
        .from('customers')
        .insert(customersToInsert)
        .select('id, cnpj')

      if (insertError) {
        console.error('Error inserting customers:', insertError)
        errors.push(`Erro ao inserir clientes: ${insertError.message}`)
      } else {
        customersCreated = newCustomers?.length || 0
        for (const c of newCustomers || []) {
          existingCustomerMap.set(c.cnpj, c.id)
        }
      }
    }

    // Update existing customers one by one (batch update not supported)
    for (const { cnpj, data } of customersToUpdate) {
      const { error } = await supabase
        .from('customers')
        .update(data)
        .eq('cnpj', cnpj)
      
      if (!error) {
        customersUpdated++
      }
    }

    console.log(`Customers: ${customersCreated} created, ${customersUpdated} updated`)

    // Delete existing contracts for these customers to avoid duplicates
    const customerIds = Array.from(existingCustomerMap.values())
    if (customerIds.length > 0) {
      await supabase
        .from('contracts')
        .delete()
        .in('customer_id', customerIds)
    }

    // Prepare all contracts for batch insert
    const contractsToInsert: any[] = []
    
    for (const [cnpj, customerData] of customerMap) {
      const customerId = existingCustomerMap.get(cnpj)
      if (!customerId) continue
      
      for (const contract of customerData.contracts) {
        contractsToInsert.push({
          customer_id: customerId,
          import_id: importId,
          ...contract
        })
      }
    }

    // Batch insert contracts in chunks of 500
    const CHUNK_SIZE = 500
    for (let i = 0; i < contractsToInsert.length; i += CHUNK_SIZE) {
      const chunk = contractsToInsert.slice(i, i + CHUNK_SIZE)
      const { error: contractError } = await supabase
        .from('contracts')
        .insert(chunk)

      if (contractError) {
        console.error('Error inserting contracts:', contractError)
        errors.push(`Erro ao inserir contratos: ${contractError.message}`)
      } else {
        contractsCreated += chunk.length
      }
    }

    console.log(`Import complete: ${customersCreated} customers created, ${customersUpdated} updated, ${contractsCreated} contracts created`)

    // Update import history record
    if (importId) {
      await supabase
        .from('import_history')
        .update({
          customers_created: customersCreated,
          customers_updated: customersUpdated,
          contracts_created: contractsCreated,
          contracts_updated: 0,
          status: 'completed',
          error_message: errors.length > 0 ? errors.slice(0, 5).join('; ') : null
        })
        .eq('id', importId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        importId,
        customersCreated,
        customersUpdated,
        contractsCreated,
        contractsUpdated: 0,
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
