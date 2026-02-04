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

// Compare two contracts to see if they differ
function contractsAreDifferent(existing: any, newData: any): boolean {
  const fieldsToCompare = [
    'status_cliente', 'status_contrato', 'tipo_movimento',
    'mrr', 'mrr_atual', 'movimento_mrr', 'valor_contrato', 'valor_original_mrr',
    'vigencia_inicial', 'vigencia_final', 'meses_vigencia',
    'tipo_renovacao', 'indice_renovacao', 'vendedor', 'observacoes', 'condicao_pagamento'
  ]
  
  for (const field of fieldsToCompare) {
    const existingVal = existing[field]
    const newVal = newData[field]
    
    // Handle null/undefined comparisons
    if (existingVal === null && newVal === null) continue
    if (existingVal === undefined && newVal === undefined) continue
    if (existingVal === null && newVal === undefined) continue
    if (existingVal === undefined && newVal === null) continue
    
    // Compare values
    if (existingVal !== newVal) {
      return true
    }
  }
  
  return false
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

    // Create CSV preview (first 20 rows)
    const previewLines = csvContent.split(/\r?\n/).filter((line: string) => line.trim()).slice(0, 21)
    const previewSeparator = detectSeparator(previewLines[0] || '')
    const csvPreview = {
      headers: previewLines[0] ? parseCSVLine(previewLines[0], previewSeparator) : [],
      rows: previewLines.slice(1).map((line: string) => parseCSVLine(line, previewSeparator))
    }

    // Create import history record
    const { data: importRecord, error: importError } = await supabase
      .from('import_history')
      .insert({
        import_type: 'customers_contracts',
        file_name: fileName || 'import.csv',
        imported_by: userId || null,
        status: 'processing',
        csv_preview: csvPreview
      })
      .select('id')
      .single()

    if (importError) {
      console.error('Error creating import record:', importError)
    }

    const importId = importRecord?.id

    console.log('Starting incremental import of customers and contracts...')
    
    const lines = csvContent.split(/\r?\n/).filter((line: string) => line.trim())
    
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row')
    }

    const separator = detectSeparator(lines[0])
    console.log(`Detected separator: ${separator === ';' ? 'semicolon' : 'comma'}`)
    
    const headers = parseCSVLine(lines[0], separator).map((h: string) => h.toLowerCase().trim())
    console.log('Header columns:', headers.length, headers.slice(0, 5))
    
    // Function to parse CNPJ that might be in scientific notation from Excel
    function parseCNPJ(value: string): string | null {
      if (!value || value.trim() === '' || value.trim() === '-') return null
      
      let cleaned = value.trim()
      
      // Check if it's scientific notation (e.g., "1,20355E+12" or "1.20355E+12")
      const scientificMatch = cleaned.match(/^[\d,\.]+E\+?\d+$/i)
      if (scientificMatch) {
        // Replace comma with dot for parsing
        cleaned = cleaned.replace(',', '.')
        const numValue = parseFloat(cleaned)
        if (!isNaN(numValue)) {
          // Convert to integer string (CNPJ)
          cleaned = Math.round(numValue).toString()
        }
      }
      
      // Remove any formatting characters
      cleaned = cleaned.replace(/[\.\-\/\s]/g, '')
      
      // Pad with leading zeros if needed (CNPJ should be 14 digits, CPF 11)
      if (/^\d+$/.test(cleaned)) {
        if (cleaned.length >= 11 && cleaned.length <= 14) {
          return cleaned.padStart(14, '0')
        }
      }
      
      return null
    }
    
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

    // Parse all CSV data first
    interface ContractData {
      id_financeiro: string | null
      status_cliente: string | null
      status_contrato: string | null
      tipo_documento: string | null
      data_movimento: string | null
      vigencia_inicial: string | null
      vigencia_final: string | null
      meses_vigencia: number | null
      mrr: number | null
      mrr_atual: boolean
      movimento_mrr: number | null
      tipo_movimento: string | null
      valor_contrato: number | null
      tipo_renovacao: string | null
      indice_renovacao: string | null
      vendedor: string | null
      valor_original_mrr: number | null
      observacoes: string | null
      condicao_pagamento: string | null
      id_contrato: string | null
    }

    interface CustomerData {
      cnpj: string
      razao_social: string
      nome_fantasia: string
      status: string
      data_cohort: string | null
      contracts: ContractData[]
    }
    
    const customerMap = new Map<string, CustomerData>()
    const csvIdFinanceiroSet = new Set<string>()
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], separator)
      if (values.length < 3) continue
      
      const rawCnpj = values[colMap['cnpj']]?.trim()
      if (!rawCnpj) continue
      
      // Parse CNPJ (handles scientific notation from Excel)
      const cnpj = parseCNPJ(rawCnpj)
      if (!cnpj) {
        console.log(`Skipping invalid CNPJ: ${rawCnpj}`)
        continue
      }
      
      const idFinanceiro = values[colMap['id_financeiro']]?.trim() || null
      if (idFinanceiro) {
        csvIdFinanceiroSet.add(idFinanceiro)
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
        id_financeiro: idFinanceiro,
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

    console.log(`Found ${customerMap.size} unique customers in CSV`)
    console.log(`Found ${csvIdFinanceiroSet.size} unique id_financeiro in CSV`)
    
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

    // Get all existing contracts with their id_financeiro
    const { data: existingContracts } = await supabase
      .from('contracts')
      .select('id, id_financeiro, customer_id, status_cliente, status_contrato, tipo_movimento, mrr, mrr_atual, movimento_mrr, valor_contrato, valor_original_mrr, vigencia_inicial, vigencia_final, meses_vigencia, tipo_renovacao, indice_renovacao, vendedor, observacoes, condicao_pagamento')
    
    const existingContractsMap = new Map<string, any>()
    for (const c of existingContracts || []) {
      if (c.id_financeiro) {
        existingContractsMap.set(c.id_financeiro, c)
      }
    }

    console.log(`Found ${existingContractsMap.size} existing contracts with id_financeiro`)

    let customersCreated = 0
    let customersUpdated = 0
    let contractsInserted = 0
    let contractsUpdated = 0
    let contractsDeleted = 0
    const errors: string[] = []

    // Process customers: insert new, update existing
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

    // Update existing customers
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

    // Now handle contracts with diff logic
    const contractsToInsert: any[] = []
    const contractsToUpdateList: { id: string; data: any }[] = []
    
    // Process CSV contracts
    for (const [cnpj, customerData] of customerMap) {
      const customerId = existingCustomerMap.get(cnpj)
      if (!customerId) continue
      
      for (const contract of customerData.contracts) {
        const idFinanceiro = contract.id_financeiro
        
        if (!idFinanceiro) {
          // Contract without id_financeiro - just insert it
          contractsToInsert.push({
            customer_id: customerId,
            import_id: importId,
            ...contract
          })
          continue
        }
        
        const existingContract = existingContractsMap.get(idFinanceiro)
        
        if (!existingContract) {
          // New contract - insert
          contractsToInsert.push({
            customer_id: customerId,
            import_id: importId,
            ...contract
          })
        } else {
          // Existing contract - check if needs update
          if (contractsAreDifferent(existingContract, contract)) {
            contractsToUpdateList.push({
              id: existingContract.id,
              data: {
                ...contract,
                customer_id: customerId,
                import_id: importId,
              }
            })
          }
        }
      }
    }

    // Find contracts to delete (exist in DB but not in CSV)
    const contractsToDelete: string[] = []
    for (const [idFinanceiro, contract] of existingContractsMap) {
      if (!csvIdFinanceiroSet.has(idFinanceiro)) {
        contractsToDelete.push(contract.id)
      }
    }

    console.log(`Contracts: ${contractsToInsert.length} to insert, ${contractsToUpdateList.length} to update, ${contractsToDelete.length} to delete`)

    // Delete contracts that are no longer in CSV
    if (contractsToDelete.length > 0) {
      const CHUNK_SIZE = 500
      for (let i = 0; i < contractsToDelete.length; i += CHUNK_SIZE) {
        const chunk = contractsToDelete.slice(i, i + CHUNK_SIZE)
        const { error: deleteError } = await supabase
          .from('contracts')
          .delete()
          .in('id', chunk)

        if (deleteError) {
          console.error('Error deleting contracts:', deleteError)
          errors.push(`Erro ao deletar contratos: ${deleteError.message}`)
        } else {
          contractsDeleted += chunk.length
        }
      }
    }

    // Update existing contracts
    for (const { id, data } of contractsToUpdateList) {
      const { error: updateError } = await supabase
        .from('contracts')
        .update(data)
        .eq('id', id)

      if (updateError) {
        console.error('Error updating contract:', updateError)
      } else {
        contractsUpdated++
      }
    }

    // Batch insert new contracts in chunks
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
        contractsInserted += chunk.length
      }
    }

    console.log(`Import complete: ${customersCreated} customers created, ${customersUpdated} updated`)
    console.log(`Contracts: ${contractsInserted} inserted, ${contractsUpdated} updated, ${contractsDeleted} deleted`)

    // Update import history record
    if (importId) {
      await supabase
        .from('import_history')
        .update({
          customers_created: customersCreated,
          customers_updated: customersUpdated,
          contracts_created: contractsInserted,
          contracts_updated: contractsUpdated,
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
        contractsCreated: contractsInserted,
        contractsUpdated,
        contractsDeleted,
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
