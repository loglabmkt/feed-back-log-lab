import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { Resend } from 'npm:resend@4.0.1';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { feedbackId, baseUrl } = await req.json();

    if (!feedbackId) {
      return Response.json({ error: 'Missing feedbackId' }, { status: 400 });
    }

    // Buscar o feedback via service role (gestor não é usuário Base44)
    const feedbacks = await base44.asServiceRole.entities.FeedbackRecord.filter({ id: feedbackId });
    if (!feedbacks || feedbacks.length === 0) {
      return Response.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const feedback = feedbacks[0];
    const { employee_name, employee_email } = feedback;

    // Gerar token de confirmação
    const tokenData = `${feedbackId}:${employee_email}:${Date.now()}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(tokenData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const token = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Salvar token no feedback
    await base44.asServiceRole.entities.FeedbackRecord.update(feedbackId, {
      public_access_token: token,
      public_link_generated_date: new Date().toISOString()
    });

    // URL de confirmação usando baseUrl enviado pelo frontend
    const appBase = (baseUrl || '').replace(/\/$/, '');
    const confirmationUrl = `${appBase}/confirmarfeedback?token=${token}`;

    // Enviar email para o colaborador/prestador
    const result = await resend.emails.send({
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
                <a href="${confirmationUrl}" style="display: inline-block; background: #F8B137; color: #14141E; padding: 14px 36px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Validar Feedback
                </a>
              </div>

              <p style="margin: 15px 0; font-size: 13px; color: #888;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br/>
                <a href="${confirmationUrl}" style="color: #F8B137; word-break: break-all;">${confirmationUrl}</a>
              </p>

              <p style="margin: 15px 0; font-size: 13px; color: #999;">
                Este procedimento registra apenas o recebimento da avaliação realizada.
              </p>
            </div>
          </div>
        </div>
      `
    });

    if (result.error) {
      return Response.json({ error: result.error.message || 'Failed to send email' }, { status: 500 });
    }

    return Response.json({ 
      success: true,
      emailId: result.data?.id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});