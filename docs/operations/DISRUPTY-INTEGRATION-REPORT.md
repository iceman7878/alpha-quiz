# Disrupty — contrato de webhook × implementação (17/11/2026)

Fontes oficiais (baixadas pelo agente Payment e conferidas pelo Orchestrator):
- **S1** `https://ajuda.disruptybr.app/llms-full.txt` (central de ajuda; link no site oficial)
- **S2** `https://app.disruptybr.app/docs/webhook` ("Documentação de Webhook", Gateway v6.7.0)
- **S3** `https://app.disruptybr.app/docs` ("Documentação da API" v6.9.7, aba Webhooks)
- **S4** código público do checkout `pay.disruptybr.app` (evidência, não documentação)

Fora do ar pela rede do container: `ajuda.disrupty.com.br` (reset/503), `docs.disrupty.com.br` (502), `api.disrupty.com.br` (Cloudflare 1000). As buscas antigas ("paid", "5 reenvios") vinham desse domínio antigo e **não** batem com a documentação atual.

## Contrato
| Ponto | Classificação | Evidência |
|---|---|---|
| Status do webhook | **OFICIAL** | S2: `PAGO, PENDENTE, CANCELADO, RECUSADO, ESTORNADO, EM_PROCESSAMENTO`; S3: `PENDENTE, PAGO, RECUSADO, CANCELADO, ESTORNADO` |
| Chargeback no webhook | NÃO VERIFICÁVEL | só existe como filtro na tela de Vendas (S1) |
| Estorno dispara webhook | HIPÓTESE (forte) | S3 fala em "atualizações de status" e lista ESTORNADO |
| Campos | **OFICIAL** (S2) | `id` ("ID único da venda"), `productId`, `productName`, `amount` (centavos), `status`, `customerEmail`, `customerName`, `customerPhone`, `saleItems[]` (`offerId`, `name`, `price`), `externalTransactionId`. O exemplo de S3 difere (`transactionId`, sem `productId`) |
| Autenticação | OFICIAL só em parte | S2: header `X-Signature: sha256=…` em todas as notificações; segredo, algoritmo e conteúdo assinado **não documentados** |
| Token na URL preservado | HIPÓTESE | a URL do webhook é texto livre (S1) |
| Mesmo `id` no PAGO e no ESTORNADO | HIPÓTESE (plausível) | S2 manda usar `id` para idempotência; nada sobre estorno → **R01 continua aberto** |
| Reenvios | **OFICIAL** | S2: até 3 reenvios em 5, 15 e 30 min; resposta em até 5 s |
| Duplicidade | **OFICIAL** | S1: o mesmo evento pode chegar mais de uma vez |
| Ordem dos eventos | NÃO VERIFICÁVEL | — |
| Order bump no payload | HIPÓTESE | S2: `saleItems` = "produto + upsells" |
| Prefill de nome/e-mail/telefone | NÃO DOCUMENTADO | S4 lê da URL só `utm_*`, `src`, `sck`, `fbclid`, `externalId` |
| `sck`/UTM de volta no webhook | HIPÓTESE | S4 envia; nenhum payload documentado devolve |
| Ambiente de teste | **OFICIAL** | S1: link de teste válido por 10 min, sem cobrança; S2: chega ao webhook com `[Teste]` e valor 0 |
| Purchase do Pixel | **OFICIAL** | S1: o Pixel configurado na Disrupty dispara "Compra Finalizada", com opção de Conversions API |

Nada foi confirmado por teste real ainda.

## Divergências código × contrato
| # | Gravidade | Onde | Problema |
|---|---|---|---|
| X1 | **CRÍTICO** | `src/lib/checkout.ts` (`DISRUPTY_STATUS`) | só reconhece `paid`/`refunded`/`chargedback`. Com o payload oficial, `status: "PAGO"` vira `kind = null` → 200 "ignorado": **nenhuma venda libera acesso, nenhum estorno bloqueia**. Reproduzido pelo agente Payment rodando `normalize()` sobre o exemplo da doc |
| X2 | MÉDIO | `checkout.ts` (regex de produto) | aceita qualquer chave terminada em `id` em `saleItems`/`items`; o exemplo de S3 põe o id da venda em `saleItems[].id`. Converge com o achado M1 do Security |
| X3 | BAIXO | `checkout.ts` (`TXN_KEYS`) | `transactionId`/`externalTransactionId` não casam; o código cai no `id` de topo, que é o que a doc recomenda (funciona por sorte; ancorar em `id`) |
| X4 | MÉDIO | `checkout-webhook.ts` | X-Signature existe, mas sem segredo documentado continua desligada; token na URL é a única barreira |
| X5 | ALTO | `checkout-webhook.ts` | só 3 reenvios e prazo de 5 s: o caminho do `paid` (convite por e-mail + consultas) pode passar de 5 s, e uma marca presa deixa o comprador sem acesso após ~50 min |
| X6 | BAIXO | `checkout-webhook.ts` (rota pelo `sck`) | o payload documentado não traz `sck`; a rota sai do fallback pelo lead |
| X7 | MÉDIO | — | vendas de teste (valor 0) liberam acesso de verdade; útil para validar, mas não há filtro |

## O que o Victor precisa obter da Disrupty
1. JSON bruto + headers de uma venda **de teste** (link de teste da oferta, webhook apontado para um webhook.site).
2. Venda de teste **com o order bump** marcado (ver se o Vault aparece em `saleItems` e com qual id).
3. Payload de um **estorno** (o `id` é o mesmo do PAGO? qual o status exato?). Perguntar ao suporte o status de chargeback.
4. Do suporte: segredo, algoritmo e conteúdo assinado do `X-Signature`; se a query string `?token=` é preservada.
5. `productId` do ALPHA LAUNCH e `offerId` da oferta e do bump.
6. Print de Integrações → Webhooks e da configuração de entrega do produto.
