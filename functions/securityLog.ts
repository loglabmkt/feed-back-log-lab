import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const { timestamp, page, userAgent } = await req.json();

    const base44 = createClientFromRequest(req);

    await base44.asServiceRole.entities.SecurityLog.create({
      event_type: "devtools_detected",
      page: page || "unknown",
      user_agent: userAgent || "unknown",
      timestamp: timestamp || new Date().toISOString(),
    });

    return Response.json({ received: true });
  } catch (error) {
    // Silent fail — never block the user
    return Response.json({ received: true });
  }
});