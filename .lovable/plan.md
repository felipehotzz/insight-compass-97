
## Ordenar contratos por data de fim (crescente)

Na tabela de contratos do Raio-X (aba Dados Cadastrais), os contratos serao ordenados automaticamente pela coluna "Fim" (`vigencia_final`) em ordem crescente (datas mais antigas primeiro).

### Alteracao tecnica

**Arquivo:** `src/components/raiox/CustomerDataTab.tsx`

Na linha 806, onde atualmente temos:
```typescript
{contracts.map((contract) => (
```

Sera alterado para:
```typescript
{[...contracts].sort((a, b) => {
  if (!a.vigencia_final) return 1;
  if (!b.vigencia_final) return -1;
  return a.vigencia_final.localeCompare(b.vigencia_final);
}).map((contract) => (
```

Contratos sem data de fim serao posicionados ao final da lista.
