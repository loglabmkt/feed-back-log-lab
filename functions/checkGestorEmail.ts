import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const gestores = await base44.asServiceRole.entities.Gestor.filter({ 
      email: email.toLowerCase() 
    });

    if (gestores.length === 0) {
      return Response.json({ found: false }, { status: 200 });
    }

    const gestor = gestores[0];

    if (gestor.has_password) {
      return Response.json({ 
        found: false,
        message: 'Este email já possui cadastro. Use a tela de login.' 
      }, { status: 200 });
    }

    return Response.json({ 
      found: true,
      gestor: {
        id: gestor.id,
        full_name: gestor.full_name,
        email: gestor.email
      }
    }, { status: 200 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});