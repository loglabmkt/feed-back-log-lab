import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const ADMIN_EMAILS = [
  'haisa.hashimoto@argointeligencia.com.br',
  'rodolpho.bispo@loglabdigital.com.br'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { managerName, managerEmail, employeeName } = await req.json();

    if (!managerName || !employeeName) {
      return Response.json({ error: 'managerName e employeeName são obrigatórios' }, { status: 400 });
    }

    // E-mail para os admins
    const adminEmailPromises = ADMIN_EMAILS.map(email =>
      resend.emails.send({
        from: 'noreply@loglabdigital.com.br',
        to: email,
        subject: `Ação Necessária: Validar Avaliação de Serviço – ${employeeName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; padding: 32px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6980e7673597ded54b61feca/68c8706a7_LOG-LAB-TECNOLOGIA-QUE-TRANSFORMA-NOVA-BRANCO-LARANJA.png" alt="LogLab" style="height: 48px; margin-bottom: 24px;" />
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Olá,</p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                O gestor <strong>${managerName}</strong> finalizou o formulário de avaliação de nível de serviço referente ao prestador <strong>${employeeName}</strong>.
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                O documento está disponível para conferência e validação técnica no painel administrativo.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://feedback.loglabdigital.com.br/"
                   style="background: #F8B137; color: #14141E; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Acessar Painel Administrativo
                </a>
              </div>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
              LogLab Digital – Sistema de Compliance RH
            </p>
          </div>
        `
      })
    );

    await Promise.all(emailPromises);

    return Response.json({ success: true, message: `E-mail enviado para ${ADMIN_EMAILS.length} destinatários` });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});