import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const CORRECTIONS = {
  "6a22d91a532fd10f8b88188a": "Savio Campos",
  "6a0f6553d08d3c960659772f": "Brunno Resino",
  "69e29feb820ab35c848efa2b": "Heitor Araujo",
  "69e1321a0a175dec5c158c11": "Wanderson Leao",
  "69e1316bcbb9999770a5bdce": "Milena Sousa",
  "69e1304f01613f6a5dc94164": "Altair Soares",
  "69d553039c48bdad89344d5c": "Luiz Eduardo de Souza Nunes",
  "69d552c402941239042ddde2": "Matheus Silva Abdalla",
  "69d4ff4619bd56666fd138e1": "Ericka Ribeiro",
  "69d4fef4298bd7bf14b1ad0c": "Monica Jabur",
  "69d4fe415f4573f46b702e32": "Marcos Antonio",
  "69d4fdf5740311b7dd13cbe6": "Marcos Florisbelo",
  "69d4fd824c08a3a0239804de": "Dulcineia Lins",
  "69bc3b7030efb2bed447b3ea": "Kellen Miranda",
  "69b2d3a05b43385f9f6e29ed": "Rafael Araujo",
  "69b2d26665a54627692d4dcc": "Amanda Porcionato",
  "69b2d1e36295202cb5ac7d70": "Thalita Gemma",
  "69b2d1e36295202cb5ac7d71": "Ana Paula Heilmann",
  "69b2d1e36295202cb5ac7d72": "Bruna Lima",
  "69b2d1e36295202cb5ac7d73": "Bryan Dellaquila",
  "69b2d1e36295202cb5ac7d74": "Klayre Marques",
  "69b2d1e36295202cb5ac7d75": "Rany Vitoria",
  "69b2d1e36295202cb5ac7d76": "Samantha Diniz",
  "69b2d1e36295202cb5ac7d77": "Arthur Buzzo",
  "69b2d1e36295202cb5ac7d78": "Bruno Bertochi",
  "69b2d1e36295202cb5ac7d79": "Débora Resende",
  "69b2d1e36295202cb5ac7d7a": "João Abranches",
  "69b2d1e36295202cb5ac7d7b": "Jose Alves",
  "69b2d1e36295202cb5ac7d7c": "Leandro Barata",
  "69b2d1e36295202cb5ac7d7d": "Marcus Pavan",
  "69b2d1e36295202cb5ac7d7e": "Monica Jabur",
  "69b2d1e36295202cb5ac7d7f": "Ricardo Germano",
  "69b2d1e36295202cb5ac7d80": "Anderson Julio",
  "69b2d1e36295202cb5ac7d81": "Carlos Butrago",
  "69b2d1e36295202cb5ac7d82": "Deuclério Salles",
  "69b2d1e36295202cb5ac7d83": "Eduarda Moreira da Silva",
  "69b2d1e36295202cb5ac7d84": "Hudson Lopes",
  "69b2d1e36295202cb5ac7d85": "Iraci Brugnago",
  "69b2d1e36295202cb5ac7d86": "Izaide Tenutes",
  "69b2d1e36295202cb5ac7d87": "Jhonatan Santos Pinto",
  "69b2d1e36295202cb5ac7d88": "Jonathan Amorim",
  "69b2d1e36295202cb5ac7d89": "Juliano Koslowisk",
  "69b2d1e36295202cb5ac7d8a": "Luciano Tenorio",
  "69b2d1e36295202cb5ac7d8b": "Manuela Callejas",
  "69b2d1e36295202cb5ac7d8c": "Maurício Lucas Alberti",
  "69b2d1e36295202cb5ac7d8d": "Rafaela Bernandes",
  "69b2d1e36295202cb5ac7d8e": "Tássio Jose",
  "69b2d1e36295202cb5ac7d8f": "Alexandre Araujo",
  "69b2d1e36295202cb5ac7d90": "Alexandre Muniz",
  "69b2d1e36295202cb5ac7d92": "Arthur Erckat",
  "69b2d1e36295202cb5ac7d93": "Cristiana Dias",
  "69b2d1e36295202cb5ac7d94": "Danyllo Mendanha",
  "69b2d1e36295202cb5ac7d95": "Diego Maciel",
  "69b2d1e36295202cb5ac7d96": "Elisson Lopes",
  "69b2d1e36295202cb5ac7d97": "Erica Pereira",
  "69b2d1e36295202cb5ac7d98": "Guilherme Nário",
  "69b2d1e36295202cb5ac7d99": "Igor Alencastro",
  "69b2d1e36295202cb5ac7d9b": "Júlia Correia Alvez",
  "69b2d1e36295202cb5ac7d9c": "Kellen Moya",
  "69b2d1e36295202cb5ac7d9d": "Kerollaine Mendes Ribeiro",
  "69b2d1e36295202cb5ac7d9e": "Luana Bulgarelli Mendes",
  "69b2d1e36295202cb5ac7d9f": "Lucas Gomes Bezerra",
  "69b2d1e36295202cb5ac7da0": "Maico Pessoa",
  "69b2d1e36295202cb5ac7da1": "Marcela Luz",
  "69b2d1e36295202cb5ac7da2": "Marcos Julião",
  "69b2d1e36295202cb5ac7da4": "Patricia Sebalhos",
  "69b2d1e36295202cb5ac7da5": "Pedro Henrique Dalfior",
  "69b2d1e36295202cb5ac7da6": "Raquel Zampronio",
  "69b2d1e36295202cb5ac7da7": "Richard Samagaia",
  "69b2d1e36295202cb5ac7da8": "Roberto Castro",
  "69b2d1e36295202cb5ac7da9": "Roseara Santos",
  "69b2d1e36295202cb5ac7daa": "Thiago Moraes",
  "69b2d1e36295202cb5ac7dab": "Victor Hugo de Mattos",
  "69b2d1e36295202cb5ac7d64": "Cleiton Fernandes",
  "69b2d1e36295202cb5ac7d65": "Gabryelle Aguirre",
  "69b2d1e36295202cb5ac7d66": "Helena Cristina Martins Barbosa",
  "69b2d1e36295202cb5ac7d67": "Juliana Rezende Lisboa",
  "69b2d1e36295202cb5ac7d68": "Mirela Caroline Gonzaga da Silva",
  "69b2d1e36295202cb5ac7d69": "Rodolpho da Silva Bispo",
  "69b2d1e36295202cb5ac7d6a": "Alveny Andrade",
  "69b2d1e36295202cb5ac7d6b": "Brenda Strobel",
  "69b2d1e36295202cb5ac7d6c": "Bruna Lasmar",
  "69b2d1e36295202cb5ac7d6d": "Dalva Eloy",
  "69b2d1e36295202cb5ac7d6e": "Elenilson Nunes",
  "69b2d1e36295202cb5ac7d6f": "Pedro Henrique Sampaio",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const updated = [];
    const errors = [];

    for (const [id, full_name] of Object.entries(CORRECTIONS)) {
      try {
        await base44.asServiceRole.entities.Colaborador.update(id, { full_name });
        updated.push(id);
      } catch (e) {
        errors.push({ id, error: e.message });
      }
    }

    return Response.json({
      success: true,
      total_processed: Object.keys(CORRECTIONS).length,
      total_updated: updated.length,
      total_errors: errors.length,
      updated,
      errors
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});