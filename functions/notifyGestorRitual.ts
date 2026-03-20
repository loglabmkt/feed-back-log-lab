import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { Resend } from 'npm:resend@4.0.1';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const ritualMap = {
    'AVALIACAO_45': 'Avaliação de Qualidade de Serviço — 45 Dias',
    'AVALIACAO_90': 'Avaliação de Qualidade de Serviço — 90 Dias',
    'TRIMESTRAL': 'Instrumento de Nível de Serviço — Trimestral',
    'ONE_ON_ONE': 'Registro de 1:1 (Conversa de Alinhamento)'
};

function buildEmailHtml(nomeGestor, nomeRotina) {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; background: #f9fafb; padding: 30px 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          <div style="background: #14141E; padding: 24px 30px; text-align: center;">
            <h1 style="color: #F8B137; margin: 0; font-size: 22px; letter-spacing: 0.5px;">Log Lab Digital</h1>
            <p style="color: #aaa; margin: 6px 0 0 0; font-size: 13px;">Log Lab</p>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin: 0 0 20px 0;">Olá, <strong>${nomeGestor}</strong>,</p>
            <p style="font-size: 15px; color: #444; margin: 0 0 16px 0;">
              Informamos que a rotina de avaliação <strong>${nomeRotina}</strong> para a avaliação de nível de serviço referente ao seu time está disponível para preenchimento.
            </p>
            <p style="font-size: 15px; color: #444; margin: 0 0 16px 0;">
              Esta análise é fundamental para o controle de qualidade das entregas previstas em contrato.
            </p>
            <div style="background: #f8f9fa; border-left: 4px solid #F8B137; border-radius: 4px; padding: 16px 20px; margin: 24px 0;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #555;">
                <strong>Tipo de Avaliação:</strong> ${nomeRotina}
              </p>
              <p style="margin: 0; font-size: 14px; color: #888;">
                <strong>Data de Vencimento:</strong> Confira acessando o seu espaço
              </p>
            </div>
            <p style="font-size: 15px; color: #444; margin: 0 0 24px 0;">
              Por favor, acesse o sistema pelo link abaixo para preencher o formulário técnico:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://feedback.loglabdigital.com.br/gestorlogin"
                 style="display: inline-block; background: #F8B137; color: #14141E; padding: 14px 36px; border-radius: 8px; font-weight: 700; font-size: 15px; text-decoration: none; letter-spacing: 0.3px;">
                Acessar Avaliação de Serviço
              </a>
            </div>
          </div>
          <div style="background: #f3f4f6; padding: 16px 30px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              LogLab Digital · Este é um email automático, não responda.
            </p>
          </div>
        </div>
      </div>
    `;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { gestorId, ritualType } = await req.json();

        if (!gestorId || !ritualType) {
            return Response.json({ error: 'gestorId e ritualType são obrigatórios' }, { status: 400 });
        }

        const nomeRotina = ritualMap[ritualType];
        if (!nomeRotina) {
            return Response.json({ error: 'ritualType inválido' }, { status: 400 });
        }

        const gestores = await base44.asServiceRole.entities.Gestor.filter({ id: gestorId });
        if (!gestores || gestores.length === 0) {
            return Response.json({ error: 'Gestor não encontrado' }, { status: 404 });
        }
        const gestor = gestores[0];

        await resend.emails.send({
            from: 'noreply@loglabdigital.com.br',
            to: gestor.email,
            subject: `Pendência: ${nomeRotina} – Avaliação disponível para preenchimento`,
            html: buildEmailHtml(gestor.full_name || 'Gestor', nomeRotina)
        });

        return Response.json({
            success: true,
            gestorId: gestor.id,
            gestorNome: gestor.full_name,
            ritualType,
            emailEnviado: gestor.email
        });

    } catch (error) {
        console.error('Erro ao notificar gestor:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});