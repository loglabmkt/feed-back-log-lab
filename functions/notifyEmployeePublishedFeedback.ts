import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { feedbackId } = await req.json();

        if (!feedbackId) {
            return Response.json({ 
                error: 'feedbackId é obrigatório' 
            }, { status: 400 });
        }

        // Buscar o feedback
        const feedbacks = await base44.asServiceRole.entities.FeedbackRecord.filter({ id: feedbackId });
        
        if (!feedbacks || feedbacks.length === 0) {
            return Response.json({ error: 'Feedback não encontrado' }, { status: 404 });
        }

        const feedback = feedbacks[0];

        // Enviar email para o colaborador
        await resend.emails.send({
            from: 'Compliance RH <marketing@loglabdigital.com.br>',
            to: feedback.employee_email,
            subject: `✅ Seu Feedback está Disponível para Verificação`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <h2 style="color: #14141E; margin-bottom: 20px;">Olá, ${feedback.employee_name}</h2>
                  
                  <p style="color: #333; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                    Seu feedback está disponível para verificação, acesse seu portal com suas credenciais e faça seu check list no feedback.
                  </p>
                  
                  <div style="margin: 30px 0; text-align: center;">
                    <a href="https://feedback.loglabdigital.com.br/Colaborador" 
                       style="background: #F8B137; color: #14141E; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                      Acessar Portal
                    </a>
                  </div>
                  
                  <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
                    <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                      <strong>Gestor:</strong> ${feedback.manager_name}
                    </p>
                    <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                      <strong>Template:</strong> ${feedback.template_title}
                    </p>
                  </div>
                </div>
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
                  LogLab Digital - Sistema de Compliance RH
                </p>
              </div>
            `
        });

        return Response.json({ 
            success: true,
            message: `Email enviado para ${feedback.employee_email}`
        });

    } catch (error) {
        console.error('Erro ao enviar notificação:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});