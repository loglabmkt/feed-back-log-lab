import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedbackId, employeeEmail } = await req.json();

    if (!feedbackId || !employeeEmail) {
      return Response.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Gerar token usando crypto
    const tokenData = `${feedbackId}:${employeeEmail}:${Date.now()}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(tokenData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const token = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Armazenar token na entidade FeedbackRecord
    await base44.asServiceRole.entities.FeedbackRecord.update(feedbackId, {
      public_access_token: token,
      public_link_generated_date: new Date().toISOString()
    });

    return Response.json({ token });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});