import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { Resend } from 'npm:resend@4.0.1';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        let template;

        // Se veio de automação de entidade
        if (payload.event && payload.data && payload.old_data) {
            const { data, old_data } = payload;
            const wasActivated = old_data?.is_active === false && data?.is_active === true;
            if (!wasActivated) {
                return Response.json({ success: true, message: 'is_active não mudou para true' });
            }
            template = data;
        }
        // Se veio de chamada manual do frontend
        else if (payload.templateId) {
            const templates = await base44.asServiceRole.entities.FeedbackTemplate.filter({ id: payload.templateId });
            if (!templates || templates.length === 0) {
                return Response.json({ error: 'Template não encontrado' }, { status: 404 });
            }
            template = templates[0];
        } else {
            return Response.json({ error: 'Payload inválido' }, { status: 400 });
        }

        // Buscar gestores ativos
        const gestores = await base44.asServiceRole.entities.Gestor.filter({ status: 'active' });
        if (!gestores || gestores.length === 0) {
            return Response.json({ message: 'Nenhum gestor ativo encontrado', success: true });
        }

        const tipoMap = {
            'feedback': 'Feedback Trimestral',
            'one_on_one': '1:1 (Conversa de Alinhamento)',
            'evaluation': 'Avaliação Trimestral',
            'experience_45d': 'Avaliação de Experiência — 45 Dias',
            'experience_90d': 'Avaliação de Qualidade de Serviço — 90 Dias'
        };
        const tipoFeedback = tipoMap[template.feedback_type] || template.feedback_type;

        // Formatar prazo
        let deadlineText = 'Não definido';
        if (template.deadline) {
            const [year, month, day] = template.deadline.split('-');
            deadlineText = `${day}/${month}/${year}`;
        }

        const emailPromises = gestores.map(async (gestor) => {
            try {
                const nomeGestor = gestor.full_name || 'Gestor';
                await resend.emails.send({
                    from: 'noreply@loglabdigital.com.br',
                    to: gestor.email,
                    subject: `Pendência: Avaliação de Nível de Serviço — ${tipoFeedback}`,
                    html: `
                      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; background: #f9fafb; padding: 30px 0;">
                        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
                          
                          <div style="background: #14141E; padding: 24px 30px; text-align: center;">
                            <h1 style="color: #F8B137; margin: 0; font-size: 22px; letter-spacing: 0.5px;">Log Lab Digital</h1>
                            <p style="color: #aaa; margin: 6px 0 0 0; font-size: 13px;">Sistema de Compliance & Avaliação de Serviços</p>
                          </div>

                          <div style="padding: 30px;">
                            <p style="font-size: 16px; margin: 0 0 20px 0;">Olá, <strong>${nomeGestor}</strong>,</p>

                            <p style="font-size: 15px; color: #444; margin: 0 0 16px 0;">
                              Informamos que o prazo para a avaliação periódica de nível de serviço referente aos seus prestadores está se aproximando.
                              Esta análise é fundamental para o controle de qualidade das entregas previstas em contrato.
                            </p>

                            <div style="background: #f8f9fa; border-left: 4px solid #F8B137; border-radius: 4px; padding: 16px 20px; margin: 24px 0;">
                              <p style="margin: 0 0 8px 0; font-size: 14px; color: #555;">
                                <strong>Tipo de Avaliação:</strong> ${tipoFeedback}
                              </p>
                              <p style="margin: 0; font-size: 14px; color: ${template.deadline ? '#d97706' : '#888'};">
                                <strong>Data de Vencimento:</strong> ${deadlineText}
                              </p>
                            </div>

                            <p style="font-size: 15px; color: #444; margin: 0 0 24px 0;">
                              Por favor, acesse o sistema pelo link abaixo para preencher o formulário técnico:
                            </p>

                            <div style="text-align: center; margin: 30px 0;">
                              <a href="https://feedback.loglabdigital.com.br/GestorFeedbacks"
                                 style="display: inline-block; background: #F8B137; color: #14141E; padding: 14px 36px; border-radius: 8px; font-weight: 700; font-size: 15px; text-decoration: none; letter-spacing: 0.3px;">
                                Acessar Avaliação de Serviço
                              </a>
                            </div>
                          </div>

                          <div style="background: #f3f4f6; padding: 16px 30px; text-align: center;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                              LogLab Digital — Sistema de Compliance RH · Este é um email automático, não responda.
                            </p>
                          </div>
                        </div>
                      </div>
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
        return Response.json({ error: error.message }, { status: 500 });
    }
});