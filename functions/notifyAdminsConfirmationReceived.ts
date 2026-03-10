import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { Resend } from 'npm:resend@4.0.1';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { feedbackId, employeeName } = await req.json();

    if (!feedbackId || !employeeName) {
      return Response.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    const now = new Date();
    const confirmationDate = now.toLocaleDateString('pt-BR');
    const confirmationTime = now.toLocaleTimeString('pt-BR');

    // Email para Haisa e Rodolpho informando confirmação (sem exigir auth Base44)
    const result = await resend.emails.send({
      from: 'noreply@loglabdigital.com.br',
      to: ['haisa.hashimoto@loglabdigital.com.br', 'rodolpho.bispo@loglabdigital.com.br'],
      subject: `Confirmação Recebida: Avaliação de Serviço — ${employeeName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #14141E; margin: 0;">Log Lab Digital</h1>
            </div>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0 0 15px 0; font-size: 16px;">Olá, Haisa e Rodolpho,</p>
              
              <p style="margin: 15px 0; font-size: 15px;">
                O processo de avaliação de nível de serviço do prestador <strong>${employeeName}</strong> foi <strong>finalizado com sucesso</strong>.
              </p>

              <p style="margin: 15px 0; font-size: 15px;">
                A confirmação de recebimento foi realizada pelo prestador em <strong>${confirmationDate}</strong> às <strong>${confirmationTime}</strong> e o protocolo já se encontra arquivado no histórico do sistema.
              </p>

              <div style="background: white; border-left: 4px solid #F8B137; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  <strong>ID do Feedback:</strong> ${feedbackId}
                </p>
              </div>
            </div>
          </div>
        </div>
      `
    });

    if (result.error) {
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    return Response.json({ 
      success: true,
      emailId: result.data?.id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});