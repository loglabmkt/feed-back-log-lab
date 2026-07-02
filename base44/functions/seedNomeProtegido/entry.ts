/**
 * seedNomeProtegido
 * Função one-time: popula a entidade NomeProtegido a partir dos mapas CORRECTIONS
 * verificados de checkAndRestoreColaborador (86 ids) e checkAndRestoreFeedbackRecord (52 ids).
 * Idempotente: verifica se já existe antes de criar.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CORRECTIONS_COLABORADOR = {
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
  "6a46615cd59d78a99e3c2a4d": { full_name: "Eliel Elias de Andrade", position: "Analista de Requisitos", status: "active" },
};

const CORRECTIONS_FEEDBACK = {
  "69c534ee975bd4925393229b": { employee_name: "Kellen da Silva Miranda", manager_name: "Rodolpho da Silva Bispo" },
  "69dcf2cadad9065f38819f51": { employee_name: "Samantha Diniz", manager_name: "Marcos Florisbelo" },
  "69de43e5dca7388223711370": { employee_name: "Samantha Diniz", manager_name: "Marcos Florisbelo" },
  "69de4db6f251b76f26d47ff6": { employee_name: "Rany Santos", manager_name: "Marcos Florisbelo" },
  "69de518fe15c36ed73949525": { employee_name: "Ana Heilmann", manager_name: "Marcos Florisbelo" },
  "69de55a12db68a030af396f9": { employee_name: "Klayre Ferreira", manager_name: "Marcos Florisbelo" },
  "69de5cc28ed114ae49049de0": { employee_name: "Bruna Silva", manager_name: "Marcos Florisbelo" },
  "69de855103bafcacee8c96f8": { employee_name: "Bryan Dellaquila", manager_name: "Marcos Florisbelo" },
  "69e160d7c76c929629354867": { employee_name: "Eduarda Silva", manager_name: "Mônica Jabur" },
  "69e163b12a5609671c48b128": { employee_name: "Izaide Tenutes", manager_name: "Mônica Jabur" },
  "69e234f6dc6e4be847711b41": { employee_name: "Samantha Diniz", manager_name: "Marcos Florisbelo" },
  "69e2374b023846a5da093563": { employee_name: "Klayre Ferreira", manager_name: "Marcos Florisbelo" },
  "69e2392a870fa44207128afa": { employee_name: "Rany Santos", manager_name: "Marcos Florisbelo" },
  "69e29778dfeb5517d183c223": { employee_name: "Luciano Silva", manager_name: "Mônica Jabur" },
  "69e29eaca415708052fe1f56": { employee_name: "Juliano Reis", manager_name: "Mônica Jabur" },
  "69e2a543e4fa7d0475894603": { employee_name: "Heitor Araujo", manager_name: "Mônica Jabur" },
  "69e41609a68f9b768fbbb8f2": { employee_name: "Pedro Dalfior", manager_name: "Ericka Chaves Ribeiro" },
  "69f0c612c94c2d58adef4f27": { employee_name: "Samantha Diniz", manager_name: "Marcos Florisbelo" },
  "69f251c054450b448e75c404": { employee_name: "Joao Soares", manager_name: "Marcos Antonio Dos Anjos" },
  "69f25baab12bf512685be0a3": { employee_name: "Rodolpho Bispo", manager_name: "Haisa de Arruda Hashimoto" },
  "69f350f17a27bd596684e2e5": { employee_name: "Ricardo Germano", manager_name: "Marcos Antonio Dos Anjos" },
  "69fa091c880fbb636d0097d6": { employee_name: "Matheus Silva Abdalla", manager_name: "Haisa de Arruda Hashimoto" },
  "69fa0abf70a6e24ce30e2363": { employee_name: "Amanda Porcionato", manager_name: "Haisa de Arruda Hashimoto" },
  "6a023e6cc291710a480a889e": { employee_name: "Elenilson Almeida", manager_name: "Dulcineia Maria Lins" },
  "6a02413ce0eaf63d0ff81047": { employee_name: "Elenilson Almeida", manager_name: "Dulcineia Maria Lins" },
  "6a0cb65b0184853af7b89a82": { employee_name: "Helena Barbosa", manager_name: "Haisa de Arruda Hashimoto" },
  "6a0cb94cac72ede06562bd13": { employee_name: "Mirela Silva", manager_name: "Haisa de Arruda Hashimoto" },
  "6a0cba6bb2fab929788e5c22": { employee_name: "Gabryelle Aguirre", manager_name: "Haisa de Arruda Hashimoto" },
  "6a0f7000d2c13a0c434505f0": { employee_name: "Samantha Diniz", manager_name: "Marcos Florisbelo" },
  "6a0f791f36eb1e0cf618cd7c": { employee_name: "Ana Heilmann", manager_name: "Marcos Florisbelo" },
  "6a0f7aa18f63315d7a5a0c64": { employee_name: "Bruna Silva", manager_name: "Marcos Florisbelo" },
  "6a0f7d574ea379ac43cdf157": { employee_name: "Bryan Dellaquila", manager_name: "Marcos Florisbelo" },
  "6a1065786a6d3ec475d9f01e": { employee_name: "Thalita Assis", manager_name: "Dulcineia Maria Lins" },
  "6a1091600be9290d91ba10b7": { employee_name: "Thalita Assis", manager_name: "Dulcineia Maria Lins" },
  "6a1093849d73c58ba60b0a30": { employee_name: "Alveny Andrade", manager_name: "Dulcineia Maria Lins" },
  "6a109f3713e4e3278c351465": { employee_name: "Dalva Eloy", manager_name: "Dulcineia Maria Lins" },
  "6a1862a56e8decafe7dbf7cf": { employee_name: "Jhonatan Pinto", manager_name: "Mônica Jabur" },
  "6a1863df580d45a5a68576f1": { employee_name: "Manuela Pereira", manager_name: "Mônica Jabur" },
  "6a18655b604a2c23dd07cf04": { employee_name: "Heitor Araujo", manager_name: "Mônica Jabur" },
  "6a1865c384bc6ca4c94832b0": { employee_name: "Luciano Silva", manager_name: "Mônica Jabur" },
  "6a18664c319100bd0e18a4d9": { employee_name: "Izaide Tenutes", manager_name: "Mônica Jabur" },
  "6a1866d65e30a3a35974423d": { employee_name: "Juliano Reis", manager_name: "Mônica Jabur" },
  "6a18675a4d281ebe279f6570": { employee_name: "Eduarda Silva", manager_name: "Mônica Jabur" },
  "6a1867b4068172808cc09420": { employee_name: "Manuela Pereira", manager_name: "Mônica Jabur" },
  "6a186808021fb9a741a13950": { employee_name: "Jhonatan Pinto", manager_name: "Mônica Jabur" },
  "6a189027a97800b7c8dde7aa": { employee_name: "Heitor Araujo", manager_name: "Mônica Jabur" },
  "6a19e89fd8acf91146d442c8": { employee_name: "Monica Jabur", manager_name: "Marcos Antonio Dos Anjos" },
  "6a19e8b7391464985f27c444": { employee_name: "Joao Soares", manager_name: "Marcos Antonio Dos Anjos" },
  "6a19e8d8b405d109cb163b0b": { employee_name: "Jose Junior", manager_name: "Marcos Antonio Dos Anjos" },
  "6a19e8f27c6630faecd8933e": { employee_name: "Bruno Santos", manager_name: "Marcos Antonio Dos Anjos" },
  "6a26d2337bd0c12bb0570929": { employee_name: "Savio Campos", manager_name: "Mônica Jabur" },
  "6a282125b4b855cca0572c9c": { employee_name: "Heitor Araujo", manager_name: "Mônica Jabur" },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Carregar existentes para deduplicação
    const existentes = await base44.asServiceRole.entities.NomeProtegido.list('-created_date', 500);
    const existentesSet = new Set(existentes.map(e => `${e.entidade}::${e.registro_id}`));

    let criadosColab = 0;
    let criadosFeedback = 0;

    // Seed Colaborador
    for (const [id, data] of Object.entries(CORRECTIONS_COLABORADOR)) {
      const key = `Colaborador::${id}`;
      if (existentesSet.has(key)) continue;
      await base44.asServiceRole.entities.NomeProtegido.create({
        entidade: "Colaborador",
        registro_id: id,
        nome_correto: data.full_name,
        cargo_correto: data.position,
        ativo: true,
      });
      criadosColab++;
    }

    // Seed FeedbackRecord
    for (const [id, data] of Object.entries(CORRECTIONS_FEEDBACK)) {
      const key = `FeedbackRecord::${id}`;
      if (existentesSet.has(key)) continue;
      await base44.asServiceRole.entities.NomeProtegido.create({
        entidade: "FeedbackRecord",
        registro_id: id,
        nome_correto: data.employee_name,
        nome_gestor_correto: data.manager_name,
        ativo: true,
      });
      criadosFeedback++;
    }

    const total = await base44.asServiceRole.entities.NomeProtegido.list('-created_date', 500);
    const countColab = total.filter(e => e.entidade === 'Colaborador').length;
    const countFeedback = total.filter(e => e.entidade === 'FeedbackRecord').length;

    return Response.json({
      success: true,
      criados: { Colaborador: criadosColab, FeedbackRecord: criadosFeedback },
      total_na_entidade: { Colaborador: countColab, FeedbackRecord: countFeedback, total: total.length },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});