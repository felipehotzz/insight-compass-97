
# Plano: Importação Incremental de Contratos

## Resumo

Vou modificar o sistema de importação para fazer uma **atualização incremental/diferencial** da base de contratos, comparando o novo CSV com os dados existentes e aplicando apenas as mudanças necessárias.

## Análise do Novo Arquivo

| Métrica | Valor |
|---------|-------|
| Total de linhas no CSV | 495 contratos |
| Contratos atuais na base | 462 contratos |
| Chave única | `id_financeiro` |
| Colunas | 24 (mesmas da importação anterior) |

## O que será implementado

### 1. Nova Lógica de Comparação

Ao invés de deletar todos os contratos e recriá-los, o sistema irá:

- **Contratos Novos**: Identificar `id_financeiro` que existem no CSV mas não na base → Inserir
- **Contratos Atualizados**: Identificar `id_financeiro` que existem em ambos → Comparar campos e atualizar se houver diferenças
- **Contratos Removidos**: Identificar `id_financeiro` que existem na base mas não no CSV → Deletar

### 2. Campos Comparados para Detectar Mudanças

Os seguintes campos serão comparados para detectar se um contrato foi atualizado:
- `status_cliente`, `status_contrato`, `tipo_movimento`
- `mrr`, `mrr_atual`, `movimento_mrr`, `valor_contrato`, `valor_original_mrr`
- `vigencia_inicial`, `vigencia_final`, `meses_vigencia`
- `tipo_renovacao`, `indice_renovacao`, `vendedor`, `observacoes`, `condicao_pagamento`

### 3. Fluxo da Importação

```text
┌─────────────────────────────────────────────────────────────┐
│                    NOVA IMPORTAÇÃO                          │
├─────────────────────────────────────────────────────────────┤
│  1. Parse do CSV                                            │
│  2. Buscar todos os contratos existentes (por id_financeiro)│
│  3. Comparar CSV vs Base:                                   │
│     ├── CSV tem, Base não tem → INSERIR                     │
│     ├── Ambos têm, dados diferentes → ATUALIZAR             │
│     └── Base tem, CSV não tem → DELETAR                     │
│  4. Atualizar clientes (status, cohort, etc.)               │
│  5. Gerar relatório com estatísticas detalhadas             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Resultado Esperado

Ao final da importação, você verá:
- Quantos contratos foram **inseridos** (novos)
- Quantos contratos foram **atualizados** (modificados)
- Quantos contratos foram **removidos** (deletados)
- Quantos clientes foram **criados** ou **atualizados**

---

## Detalhes Técnicos

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/import-customers-contracts/index.ts` | Implementar lógica de diff/merge |
| `src/components/settings/ImportDataSettings.tsx` | Mostrar estatísticas de contratos deletados |

### Edge Function: Nova Lógica

1. **Buscar contratos existentes** em batch por `id_financeiro`
2. **Criar mapas** para comparação rápida
3. **Categorizar** cada linha do CSV:
   - `toInsert`: id_financeiro não existe na base
   - `toUpdate`: id_financeiro existe e campos diferem
   - `toDelete`: id_financeiro na base não aparece no CSV
4. **Executar operações** em batch para performance
5. **Retornar estatísticas** detalhadas

### Preservação de Dados

Os seguintes dados **não serão afetados**:
- Champions vinculados aos clientes
- Domínios dos clientes (`customer_domains`)
- Tickets de suporte
- Ações de relacionamento

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Perda de dados não intencionais | A deleção só remove contratos cujo `id_financeiro` não está no CSV |
| Duplicatas | Uso do `id_financeiro` como chave única previne duplicatas |
| Performance | Operações em batch de 500 registros |

## Próximos Passos

Após aprovação, irei:
1. Atualizar a Edge Function com a nova lógica
2. Adicionar campo `contracts_deleted` no resultado
3. Atualizar a UI para mostrar contratos deletados
4. Testar a importação com seu arquivo CSV
