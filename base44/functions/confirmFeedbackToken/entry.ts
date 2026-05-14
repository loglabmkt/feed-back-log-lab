import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { Resend } from 'npm:resend@4.0.1';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Token é obrigatório' }, { status: 400 });
    }

    // Buscar feedback via service role (página pública, sem auth de usuário)
    const feedbacks = await base44.asServiceRole.entities.FeedbackRecord.filter({
      public_access_token: token
    });

    if (!feedbacks || feedbacks.length === 0) {
      return Response.json({ error: 'Token inválido ou expirado' }, { status: 404 });
    }

    const fb = feedbacks[0];

    // CORREÇÃO 5: Token uso único — bloquear se já assinado
    if (fb.workflow_status === 'ASSINADO_COLABORADOR') {
      return Response.json({ success: true, alreadyConfirmed: true, feedback: fb });
    }

    // CORREÇÃO 5: Expiração de 30 dias
    if (fb.public_link_generated_date) {
      const linkAge = Date.now() - new Date(fb.public_link_generated_date).getTime();
      if (linkAge > THIRTY_DAYS_MS) {
        return Response.json({ 
          error: 'Link expirado. Solicite novo envio ao administrador.',
          expired: true
        }, { status: 410 });
      }
    }

    // Atualizar status para confirmado
    await base44.asServiceRole.entities.FeedbackRecord.update(fb.id, {
      workflow_status: 'ASSINADO_COLABORADOR',
      employee_validation_date: new Date().toISOString()
    });

    // Notificar admins por email
    const now = new Date();
    await resend.emails.send({
      from: 'noreply@loglabdigital.com.br',
      to: ['haisa.hashimoto@loglabdigital.com.br', 'rodolpho.bispo@loglabdigital.com.br'],
      subject: `Confirmação Recebida: Avaliação de Serviço — ${fb.employee_name}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #14141E;">Log Lab Digital</h1>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p>Olá, Haisa e Rodolpho,</p>
            <p>O prestador <strong>${fb.employee_name}</strong> confirmou o recebimento da avaliação em <strong>${now.toLocaleDateString('pt-BR')}</strong> às <strong>${now.toLocaleTimeString('pt-BR')}</strong>.</p>
            <div style="background: white; border-left: 4px solid #F8B137; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px;"><strong>ID do Feedback:</strong> ${fb.id}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Gestor:</strong> ${fb.manager_name || '-'}</p>
            </div>
          </div>
        </div>
      `
    });

    return Response.json({ success: true, feedback: fb });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});