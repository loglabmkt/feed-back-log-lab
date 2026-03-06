import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { gestor_id, code } = await req.json();

    if (!gestor_id || !code) {
      return Response.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const gestor = await base44.asServiceRole.entities.Gestor.get(gestor_id);

    if (!gestor) {
      return Response.json({ error: 'Gestor não encontrado' }, { status: 404 });
    }

    if (!gestor.verification_code || !gestor.verification_code_expires) {
      return Response.json({ error: 'Nenhum código de verificação ativo. Solicite um novo.' }, { status: 400 });
    }

    // Verificar expiração
    if (new Date() > new Date(gestor.verification_code_expires)) {
      return Response.json({ error: 'Código expirado. Solicite um novo código.' }, { status: 400 });
    }

    // Verificar código
    if (gestor.verification_code !== code.trim()) {
      return Response.json({ error: 'Código incorreto. Verifique e tente novamente.' }, { status: 400 });
    }

    // Limpar o código após validação bem-sucedida
    await base44.asServiceRole.entities.Gestor.update(gestor_id, {
      verification_code: null,
      verification_code_expires: null
    });

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});