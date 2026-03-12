import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { Resend } from 'npm:resend@4.0.1';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedbackId } = await req.json();

    if (!feedbackId) {
      return Response.json({ 
        error: 'Missing required parameter: feedbackId' 
      }, { status: 400 });
    }

    // Buscar o feedback para pegar manager_id e employee_name
    const feedbacks = await base44.asServiceRole.entities.FeedbackRecord.filter({ id: feedbackId });
    if (!feedbacks || feedbacks.length === 0) {
      return Response.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const feedback = feedbacks[0];
    const { manager_id, manager_name, employee_name, admin_director_notes } = feedback;

    // Buscar o gestor para pegar o email
    const gestores = await base44.asServiceRole.entities.Gestor.filter({ id: manager_id });
    if (!gestores || gestores.length === 0) {
      return Response.json({ error: 'Manager not found' }, { status: 404 });
    }

    const managerEmail = gestores[0].email;

    const result = await resend.emails.send({
      from: 'noreply@loglabdigital.com.br',
      to: managerEmail,
      subject: 'Avaliação Validada: Agendar Alinhamento de Nível de Serviço',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #14141E; margin: 0;">Log Lab Digital</h1>
            </div>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 16px;">Olá, <strong>${manager_name}</strong>,</p>
              
              <p style="margin: 15px 0; font-size: 15px;">
                A avaliação de nível de serviço referente ao prestador <strong>${employee_name}</strong> foi validada internamente pela contratante.
              </p>

              <p style="margin: 15px 0; font-size: 15px; font-weight: 600; color: #F8B137;">
                Agende ainda hoje a reunião de devolutiva junto ao prestador para tratar dos indicadores e entregas do período.
              </p>
            </div>

            ${admin_director_notes ? `
            <div style="background: #f3f0ff; padding: 15px; border-left: 4px solid #8b5cf6; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #6d28d9;">
                📝 Comentário de Calibragem da Diretoria:
              </p>
              <p style="margin: 0; font-size: 14px; color: #4c1d95; white-space: pre-wrap;">
                ${admin_director_notes}
              </p>
            </div>
            ` : ''}

            <div style="background: #fff5f0; padding: 15px; border-left: 4px solid #F8B137; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Próximos Passos:</strong> Acesse o painel de gerenciamento para visualizar os detalhes completos da avaliação e agendar a reunião.
              </p>
            </div>

            <div style="text-align: center; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 12px; color: #999; margin: 0;">
                Este é um email automatizado. Por favor, não responda diretamente.
              </p>
              <p style="font-size: 12px; color: #999; margin: 5px 0 0 0;">
                Log Lab Digital © 2026
              </p>
            </div>
          </div>
        </div>
      `
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return Response.json({ error: result.error }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      emailId: result.data?.id,
      recipient: managerEmail
    });

  } catch (error) {
    console.error("Function error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});