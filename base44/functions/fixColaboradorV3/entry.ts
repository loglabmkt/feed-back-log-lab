import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CORRECTIONS = {
  "69b2d1e36295202cb5ac7d64": { full_name: "Cleiton Fernandes", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d65": { full_name: "Gabryelle Aguirre", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d66": { full_name: "Helena Cristina Martins Barbosa", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d67": { full_name: "Juliana Rezende Lisboa", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d68": { full_name: "Mirela Caroline Gonzaga da Silva", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d69": { full_name: "Rodolpho da Silva Bispo", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d6a": { full_name: "Alveny Andrade", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d6b": { full_name: "Brenda Strobel", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d6c": { full_name: "Bruna Lasmar", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d6d": { full_name: "Dalva Eloy", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d6e": { full_name: "Elenilson Nunes", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d6f": { full_name: "Pedro Henrique Sampaio", position: "", status: "active" },
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
  "69b2d1e36295202cb5ac7d82": { full_name: "Deuclério Salles", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d83": { full_name: "Eduarda Moreira da Silva", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d84": { full_name: "Hudson Lopes", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d85": { full_name: "Iraci Brugnago", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d86": { full_name: "Izaide Tenutes", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d87": { full_name: "Jhonatan Santos Pinto", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d88": { full_name: "Jonathan Amorim", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d89": { full_name: "Juliano Koslowisk", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d8a": { full_name: "Luciano Tenorio", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d8b": { full_name: "Manuela Callejas", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d8c": { full_name: "Maurício Lucas Alberti", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d8d": { full_name: "Rafaela Bernandes", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d8e": { full_name: "Tássio Jose", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d8f": { full_name: "Alexandre Araujo", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d90": { full_name: "Alexandre Muniz", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d92": { full_name: "Arthur Erckat", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d93": { full_name: "Cristiana Dias", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d94": { full_name: "Danyllo Mendanha", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d95": { full_name: "Diego Maciel", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d96": { full_name: "Elisson Lopes", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d97": { full_name: "Erica Pereira", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d98": { full_name: "Guilherme Nário", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d99": { full_name: "Igor Alencastro", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d9b": { full_name: "Júlia Correia Alvez", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d9c": { full_name: "Kellen Moya", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d9d": { full_name: "Kerollaine Mendes Ribeiro", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d9e": { full_name: "Luana Bulgarelli Mendes", position: "", status: "active" },
  "69b2d1e36295202cb5ac7d9f": { full_name: "Lucas Gomes Bezerra", position: "", status: "active" },
  "69b2d1e36295202cb5ac7da0": { full_name: "Maico Pessoa", position: "", status: "active" },
  "69b2d1e36295202cb5ac7da1": { full_name: "Marcela Luz", position: "", status: "active" },
  "69b2d1e36295202cb5ac7da2": { full_name: "Marcos Julião", position: "", status: "active" },
  "69b2d1e36295202cb5ac7da4": { full_name: "Patricia Sebalhos", position: "", status: "active" },
  "69b2d1e36295202cb5ac7da5": { full_name: "Pedro Henrique Dalfior", position: "", status: "active" },
  "69b2d1e36295202cb5ac7da6": { full_name: "Raquel Zampronio", position: "", status: "active" },
  "69b2d1e36295202cb5ac7da7": { full_name: "Richard Samagaia", position: "", status: "active" },
  "69b2d1e36295202cb5ac7da8": { full_name: "Roberto Castro", position: "", status: "active" },
  "69b2d1e36295202cb5ac7da9": { full_name: "Roseara Santos", position: "", status: "active" },
  "69b2d1e36295202cb5ac7daa": { full_name: "Thiago Moraes", position: "", status: "active" },
  "69b2d1e36295202cb5ac7dab": { full_name: "Victor Hugo de Mattos", position: "", status: "active" },
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
  "6a22d91a532fd10f8b88188a": { full_name: "Savio Campos", position: "Analista de Qualidade", status: "active" },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });

    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (const [id, expected] of Object.entries(CORRECTIONS)) {
      try {
        const record = await base44.asServiceRole.entities.Colaborador.get(id);
        if (!record) {
          errors.push({ id, error: `Not found` });
          continue;
        }

        const currentPosition = record.position ?? "";
        if (
          record.full_name === expected.full_name &&
          currentPosition === expected.position &&
          record.status === expected.status
        ) {
          skipped++;
          continue;
        }

        await base44.asServiceRole.entities.Colaborador.update(id, {
          full_name: expected.full_name,
          position: expected.position,
          status: expected.status,
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