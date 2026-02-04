

# Plano: Reverter e Limpar Dados Duplicados

## Análise do Problema

Identifiquei a causa raiz da duplicação de clientes:

| Importação | Formato CNPJ | Exemplo | Clientes |
|------------|-------------|---------|----------|
| Janeiro (original) | CNPJ completo | `47080619001199` | 127 |
| Hoje (nova) | CNPJ com padding | `03407050000000` | 128 |

A modificação no código fez com que os CNPJs fossem normalizados com **zeros à esquerda e padding diferente**, resultando em CNPJs que não batiam com os existentes, criando 128 clientes "novos".

---

## O Que Será Feito

### 1. Limpar Dados Duplicados do Banco

Excluir os registros criados hoje que são duplicatas:

- **128 clientes** criados na importação de hoje (`e60ba3e0-827e-49c7-8306-6158f708135c`)
- **Contratos** associados a esses clientes (se houver)
- **Histórico de importações** de hoje (4 registros)

Os 127 clientes originais de janeiro e seus 463+ contratos serão mantidos intactos.

### 2. Reverter o Código

Voltar a edge function `import-customers-contracts` para a versão anterior às modificações de hoje, removendo:
- A função `parseCNPJ` que fazia padding incorreto
- A lógica de deduplicação que foi adicionada
- O uso de upsert

---

## Resumo das Alterações

| Ação | Detalhes |
|------|----------|
| Excluir clientes | 128 clientes da importação de hoje |
| Excluir contratos | Contratos vinculados a esses clientes |
| Excluir histórico | 4 registros de importação de hoje |
| Reverter código | Edge function para versão original |
| Preservar | 127 clientes + 463 contratos de janeiro |

---

## Detalhes Técnicos

### Queries SQL que serão executadas:

```sql
-- Excluir contratos dos clientes duplicados
DELETE FROM contracts 
WHERE customer_id IN (
  SELECT id FROM customers 
  WHERE import_id = 'e60ba3e0-827e-49c7-8306-6158f708135c'
);

-- Excluir clientes duplicados
DELETE FROM customers 
WHERE import_id = 'e60ba3e0-827e-49c7-8306-6158f708135c';

-- Excluir histórico de importações de hoje
DELETE FROM import_history 
WHERE created_at >= '2026-02-04 00:00:00'::timestamp;
```

### Edge Function:
- Será revertida para a versão funcional de janeiro
- Mantém a lógica incremental original (insert/update/delete)
- Usa o CNPJ exatamente como vem do CSV, sem normalização

