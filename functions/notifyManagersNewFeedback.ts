import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        const { templateId } = payload;

        if (!templateId) {
            return Response.json({ error: 'templateId é obrigatório' }, { status: 400 });
        }

        // Buscar o template
        const templates = await base44.asServiceRole.entities.FeedbackTemplate.filter({ id: templateId });
        
        if (!templates || templates.length === 0) {
            return Response.json({ error: 'Template não encontrado' }, { status: 404 });
        }

        const template = templates[0];

        // Buscar APENAS gestores ativos da tabela Gestor
        const gestores = await base44.asServiceRole.entities.Gestor.filter({ status: 'active' });

        if (!gestores || gestores.length === 0) {
            return Response.json({ 
                message: 'Nenhum gestor ativo encontrado',
                success: true
            });
        }

        // Preparar tipo do feedback para exibição
        const tipoMap = {
            'feedback': 'Feedback Trimestral',
            'one_on_one': 'One-on-One',
            'evaluation': 'Avaliação de Experiência'
        };
        const tipoFeedback = tipoMap[template.feedback_type] || template.feedback_type;

        // Enviar email via Resend para cada gestor
        const emailPromises = gestores.map(async (gestor) => {
            try {
                await resend.emails.send({
                    from: 'Compliance RH <onboarding@resend.dev>',
                    to: gestor.email,
                    subject: `✅ Novo Template de Feedback Disponível: ${template.title}`,
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        </head>
                        <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Titillium Web', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
                                <tr>
                                    <td align="center">
                                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                                            <!-- Header -->
                                            <tr>
                                                <td style="background: linear-gradient(135deg, #F8B137 0%, #e6a030 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
                                                    <div style="width: 64px; height: 64px; background: #14141E; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                                                        <span style="font-size: 32px;">📋</span>
                                                    </div>
                                                    <h1 style="margin: 0; color: #14141E; font-size: 28px; font-weight: 700;">Novo Template Disponível</h1>
                                                </td>
                                            </tr>
                                            
                                            <!-- Body -->
                                            <tr>
                                                <td style="padding: 40px;">
                                                    <p style="margin: 0 0 24px 0; color: #334155; font-size: 16px; line-height: 1.6;">
                                                        Olá, <strong>${gestor.full_name}</strong>!
                                                    </p>
                                                    
                                                    <p style="margin: 0 0 24px 0; color: #334155; font-size: 16px; line-height: 1.6;">
                                                        Um novo template de feedback foi ativado e está disponível para uso:
                                                    </p>
                                                    
                                                    <!-- Template Card -->
                                                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(248, 177, 55, 0.1) 0%, rgba(248, 177, 55, 0.05) 100%); border-left: 4px solid #F8B137; border-radius: 12px; padding: 24px; margin: 24px 0;">
                                                        <tr>
                                                            <td>
                                                                <h2 style="margin: 0 0 16px 0; color: #14141E; font-size: 22px; font-weight: 700;">
                                                                    ${template.title}
                                                                </h2>
                                                                <p style="margin: 8px 0; color: #475569; font-size: 15px;">
                                                                    <strong>Tipo:</strong> ${tipoFeedback}
                                                                </p>
                                                                ${template.checklist_questions?.length > 0 ? `
                                                                <p style="margin: 8px 0; color: #475569; font-size: 15px;">
                                                                    <strong>Checklist:</strong> ${template.checklist_questions.length} perguntas de validação
                                                                </p>
                                                                ` : ''}
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    
                                                    <p style="margin: 24px 0; color: #334155; font-size: 16px; line-height: 1.6;">
                                                        Você já pode utilizar este template para realizar feedbacks com sua equipe.
                                                    </p>
                                                    
                                                    <!-- CTA Button -->
                                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                                                        <tr>
                                                            <td align="center">
                                                                <a href="${Deno.env.get('BASE44_APP_URL') || window.location.origin}/gestorlogin" 
                                                                   style="display: inline-block; background: #F8B137; color: #14141E; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(248, 177, 55, 0.3);">
                                                                    Acessar Plataforma
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            
                                            <!-- Footer -->
                                            <tr>
                                                <td style="padding: 32px; background-color: #f8f9fa; border-radius: 0 0 16px 16px; text-align: center;">
                                                    <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                                                        Esta é uma notificação automática do <strong>Compliance RH</strong>.<br>
                                                        Você está recebendo este e-mail porque é gestor cadastrado no sistema.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </body>
                        </html>
                    `
                });
                return { success: true, email: gestor.email };
            } catch (emailError) {
                console.error(`Erro ao enviar email para ${gestor.email}:`, emailError);
                return { success: false, email: gestor.email, error: emailError.message };
            }
        });

        const results = await Promise.all(emailPromises);
        const successCount = results.filter(r => r.success).length;
        const failedEmails = results.filter(r => !r.success);

        return Response.json({ 
            success: true, 
            message: `Notificação enviada para ${successCount} de ${gestores.length} gestor(es)`,
            total_gestores: gestores.length,
            emails_enviados: successCount,
            falhas: failedEmails.length > 0 ? failedEmails : undefined
        });

    } catch (error) {
        console.error('Erro ao notificar gestores:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});