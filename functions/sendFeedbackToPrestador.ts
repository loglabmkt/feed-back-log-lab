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

    // Buscar o feedback
    const feedbacks = await base44.asServiceRole.entities.FeedbackRecord.filter({ id: feedbackId });
    if (!feedbacks || feedbacks.length === 0) {
      return Response.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const feedback = feedbacks[0];
    const { employee_name, employee_email, manager_name, feedback_type, feedback_date } = feedback;

    // Gerar token de confirmação
    const confirmationToken = await base44.functions.invoke('generateFeedbackConfirmationToken', {
      feedbackId: feedbackId,
      employeeEmail: employee_email
    });

    const token = confirmationToken.data.token;
    const confirmationUrl = `${new URL(req.url).origin}/confirmar-feedback?token=${token}`;

    // Email para o prestador
    const prestadorResult = await resend.emails.send({
      from: 'noreply@loglabdigital.com.br',
      to: employee_email,
      subject: 'Tarefa pendente: Confirme a Avaliação Realizada',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #14141E; margin: 0;">Log Lab Digital</h1>
            </div>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0 0 15px 0; font-size: 16px;">Prezado(a) <strong>${employee_name}</strong>,</p>
              
              <p style="margin: 15px 0; font-size: 15px;">
                Informamos que a avaliação técnica referente ao nível de serviço prestado no período foi formalmente concluída pela empresa contratante.
              </p>

              <p style="margin: 15px 0; font-size: 15px;">
                Para fins de registro contratual e conformidade, solicitamos que confirme o recebimento da avaliação clicando no botão abaixo:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationUrl}" style="display: inline-block; background: #F8B137; color: #14141E; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px;">
                  Confirmar Recebimento da Avaliação
                </a>
              </div>

              <p style="margin: 15px 0; font-size: 14px; color: #666;">
                Este procedimento registra apenas o recebimento da avaliação realizada
              </p>
            </div>
          </div>
        </div>
      `
    });

    if (!prestadorResult.id) {
      return Response.json({ error: 'Failed to send email to prestador' }, { status: 500 });
    }

    return Response.json({ 
      success: true,
      prestadorEmailId: prestadorResult.id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});