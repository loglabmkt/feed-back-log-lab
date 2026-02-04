import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { feedbackId, scheduledDate } = await req.json();

        if (!feedbackId || !scheduledDate) {
            return Response.json({ 
                error: 'feedbackId e scheduledDate são obrigatórios' 
            }, { status: 400 });
        }

        // Buscar o feedback
        const feedbacks = await base44.asServiceRole.entities.FeedbackRecord.filter({ id: feedbackId });
        
        if (!feedbacks || feedbacks.length === 0) {
            return Response.json({ error: 'Feedback não encontrado' }, { status: 404 });
        }

        const feedback = feedbacks[0];
        
        // Formatar data para dd/MM/yyyy
        const dataFormatada = new Date(scheduledDate).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Enviar email para o colaborador
        await resend.emails.send({
            from: 'Compliance RH <marketing@loglabdigital.com.br>',
            to: feedback.employee_email,
            subject: `📅 Conversa Agendada sobre seu Feedback`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <h2 style="color: #14141E; margin-bottom: 20px;">Olá, ${feedback.employee_name}</h2>
                  
                  <p style="color: #333; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                    Você tem uma nova conversa agendada com seu gestor sobre seu feedback no dia <strong>${dataFormatada}</strong>, combine o melhor horário com o seu gestor.
                  </p>
                  
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
                  Obrigado<br>
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