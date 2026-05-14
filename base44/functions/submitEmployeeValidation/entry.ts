import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// DESCONTINUADO — Este endpoint foi substituído por confirmFeedbackToken.
// O arquivo foi preservado para histórico, mas todas as chamadas são bloqueadas.
// Data de descontinuação: 2026-05-14

Deno.serve(async (_req) => {
  return Response.json({
    error: "Este endpoint foi descontinuado. Use confirmFeedbackToken.",
    deprecated: true
  }, { status: 410 }); // 410 Gone
});