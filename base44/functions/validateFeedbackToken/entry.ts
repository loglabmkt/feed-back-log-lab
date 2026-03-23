import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Token é obrigatório' }, { status: 400 });
    }

    const feedbacks = await base44.asServiceRole.entities.FeedbackRecord.filter({ 
      public_access_token: token 
    });
    
    if (!feedbacks || feedbacks.length === 0) {
      return Response.json({ error: 'Token inválido ou expirado' }, { status: 404 });
    }

    const feedback = feedbacks[0];

    return Response.json({ 
      feedback,
      success: true 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});