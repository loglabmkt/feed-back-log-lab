import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LOTR = ["Frodo","Gandalf","Aragorn","Legolas","Gimli","Boromir","Galadriel","Samwise","Peregrin","Elrond","Sauron","Saruman"];

const CORRECTIONS = {
  "69b2d1e36295202cb5ac7d70": { full_name: "Thalita Gemma", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d71": { full_name: "Ana Paula Heilmann", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d72": { full_name: "Bruna Lima", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d73": { full_name: "Bryan Dellaquila", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d74": { full_name: "Klayre Marques", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d75": { full_name: "Rany Vitoria", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d76": { full_name: "Samantha Diniz", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d77": { full_name: "Arthur Buzzo", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d78": { full_name: "Bruno Bertochi", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d79": { full_name: "Débora Resende", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d7a": { full_name: "João Abranches", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d7b": { full_name: "Jose Alves", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d7c": { full_name: "Leandro Barata", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d7d": { full_name: "Marcus Pavan", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d7e": { full_name: "Monica Jabur", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d7f": { full_name: "Ricardo Germano", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d80": { full_name: "Anderson Julio", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d81": { full_name: "Carlos Butrago", position: "", status: "active" },
  "69b2d26665a54627692d4dcc": { full_name: "Amanda Porcionato", position: "", status: "active" },
  "69b2d3a05b43385f9f6e29ed": { full_name: "Rafael Jose de Araujo", position: "Analista de Marketing", status: "active" },
  "69bc3b7030efb2bed447b3ea": { full_name: "Kellen da Silva Miranda", position: "Analista de Departamento Pessoal", status: "active" },
  "69d4fd824c08a3a0239804de": { full_name: "Dulcineia Maria Lins", position: "Gerente Financeiro", status: "active" },
  "69d4fdf5740311b7dd13cbe6": { full_name: "Marcos Florisbelo", position: "Gerente de Faturamento/Auditoria", status: "active" },
  "69d4fe415f4573f46b702e32": { full_name: "Marcos Antonio Dos Anjos", position: "Gerente de Fábrica de Software", status: "active" },
  "69d4fef4298bd7bf14b1ad0c": { full_name: "Monica Jabur", position: "Gerente de Processos", status: "active" },
  "69d4ff4619bd56666fd138e1": { full_name: "Ericka Chaves Ribeiro", position: "Consultor de Projetos de TI", status: "active" },
  "69d552c402941239042ddde2": { full_name: "Matheus Silva Abdalla", position: "Analista Administrativo", status: "active" },
  "69d553039c48bdad89344d5c": { full_name: "Luiz Eduardo de Souza Nunes", position: "Analista", status: "active" },
  "69e1304f01613f6a5dc94164": { full_name: "Altair Soares", position: "Gerente de Marketing", status: "active" },
  "69e1316bcbb9999770a5bdce": { full_name: "Milena Sousa", position: "Analista de Comunicação", status: "active" },
  "69e1321a0a175dec5c158c11": { full_name: "Wanderson Leao", position: "Diretor de Arte", status: "active" },
  "69e29feb820ab35c848efa2b": { full_name: "Heitor Araujo", position: "Assistente de Projetos", status: "active" },
  "6a0f6553d08d3c960659772f": { full_name: "Brunno Resino", position: "Designer Gráfico", status: "active" },
  "6a22d91a532fd10f8b88188a": { full_name: "Savio Campos", position: "Analista de Qualidade", status: "active" }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let updated = 0, skipped = 0, errors = [];

    for (const [id, correction] of Object.entries(CORRECTIONS)) {
      try {
        const current = await base44.asServiceRole.entities.Colaborador.get(id);
        const isLotr = LOTR.some(n => (current.full_name || "").includes(n));
        if (!isLotr) { skipped++; continue; }
        await base44.asServiceRole.entities.Colaborador.update(id, {
          full_name: correction.full_name,
          position: correction.position,
          status: correction.status
        });
        updated++;
      } catch (e) {
        errors.push({ id, error: e.message });
      }
    }

    return Response.json({ updated, skipped, errors, total: Object.keys(CORRECTIONS).length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});