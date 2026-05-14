import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// CORREÇÃO 7 — Endpoint de diagnóstico (apenas Admin)
// Retorna feedbacks com status ASSINADO_COLABORADOR que não têm email_enviado_em preenchido.
// Apenas informativo — NÃO dispara emails.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const allAssinados = await base44.asServiceRole.entities.FeedbackRecord.filter({
      workflow_status: 'ASSINADO_COLABORADOR'
    });

    const semEmail = allAssinados.filter(fb => !fb.email_enviado_em);

    return Response.json({
      total_assinados: allAssinados.length,
      total_sem_email: semEmail.length,
      feedbacks: semEmail.map(fb => ({
        id: fb.id,
        employee_name: fb.employee_name,
        employee_email: fb.employee_email,
        manager_name: fb.manager_name,
        feedback_type: fb.feedback_type,
        employee_validation_date: fb.employee_validation_date,
        public_link_generated_date: fb.public_link_generated_date,
        email_status: fb.email_status || 'nao_registrado'
      }))
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});