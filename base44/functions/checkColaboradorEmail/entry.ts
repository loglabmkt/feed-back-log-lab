import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const colaboradores = await base44.asServiceRole.entities.Colaborador.filter({ 
      email: email.toLowerCase() 
    });

    if (colaboradores.length === 0) {
      return Response.json({ found: false }, { status: 200 });
    }

    const colaborador = colaboradores[0];

    if (colaborador.has_password) {
      return Response.json({ 
        found: false,
        message: 'Este email já possui cadastro. Use a tela de login.' 
      }, { status: 200 });
    }

    return Response.json({ 
      found: true,
      colaborador: {
        id: colaborador.id,
        full_name: colaborador.full_name,
        email: colaborador.email
      }
    }, { status: 200 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});