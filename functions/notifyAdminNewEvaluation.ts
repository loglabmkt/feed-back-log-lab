import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "noreply@loglabdigital.com.br";
const RECIPIENTS = [
  { email: "rodolpho.bispo@loglabdigital.com.br", name: "Rodolpho" },
  { email: "haisa.hashimoto@loglabdigital.com.br", name: "Haisa" },
];

function buildHtml(recipientName, managerName, employeeName, appUrl) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:#14141E;padding:28px 40px;text-align:center;">
            <span style="color:#F8B137;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Log Lab Digital</span>
            <div style="color:#94a3b8;font-size:12px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Sistema de Avaliações</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 8px;font-size:16px;color:#64748b;">Olá, <strong style="color:#14141E;">${recipientName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
              O gestor <strong>${managerName}</strong> finalizou o formulário de avaliação de nível de serviço referente ao prestador <strong>${employeeName}</strong>.
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#334155;line-height:1.6;">
              A avaliação está aguardando sua revisão e aprovação no sistema.
            </p>

            <!-- Button -->
            <div style="text-align:center;margin:32px 0;">
              <a href="${appUrl}" target="_blank"
                style="display:inline-block;background:#F8B137;color:#14141E;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.2px;">
                Acessar o Sistema
              </a>
            </div>

            <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.5;">
              Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br/>
              <a href="${appUrl}" style="color:#F8B137;word-break:break-all;">${appUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              Este é um e-mail automático do sistema de avaliações Log Lab Digital.<br/>
              Por favor, não responda a este e-mail.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  }

  try {
    const { managerName, employeeName, appUrl } = await req.json();

    if (!managerName || !employeeName) {
      return Response.json({ error: "managerName e employeeName são obrigatórios" }, { status: 400 });
    }

    const systemUrl = appUrl || "https://app.base44.com";
    const subject = `Ação Necessária: Validar Avaliação de Serviço – ${employeeName}`;

    const results = await Promise.all(
      RECIPIENTS.map(async (recipient) => {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `Log Lab Digital <${FROM}>`,
            to: [recipient.email],
            subject,
            html: buildHtml(recipient.name, managerName, employeeName, systemUrl),
          }),
        });

        const data = await res.json();
        return { email: recipient.email, status: res.status, data };
      })
    );

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});