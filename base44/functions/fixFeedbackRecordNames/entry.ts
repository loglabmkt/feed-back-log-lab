/**
 * fixFeedbackRecordNames
 * Corrige employee_name e manager_name nos 55 FeedbackRecords mapeados.
 * Não altera nenhum outro campo.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const EMPLOYEE_CORRECTIONS = {
  "6a2b1a54028100b31664a721": "Mirela Silva",
  "6a295fc70ab2d16709b3d366": "Mirela Silva",
  "6a282125b4b855cca0572c9c": "Heitor Araujo",
  "6a26e54df79485d07057a230": "Mirela Silva",
  "6a26d2337bd0c12bb0570929": "Savio Campos",
  "6a19e8f27c6630faecd8933e": "Bruno Santos",
  "6a19e8d8b405d109cb163b0b": "Jose Junior",
  "6a19e8b7391464985f27c444": "Joao Soares",
  "6a19e89fd8acf91146d442c8": "Monica Jabur",
  "6a189027a97800b7c8dde7aa": "Heitor Araujo",
  "6a186808021fb9a741a13950": "Jhonatan Pinto",
  "6a1867b4068172808cc09420": "Manuela Pereira",
  "6a18675a4d281ebe279f6570": "Eduarda Silva",
  "6a1866d65e30a3a35974423d": "Juliano Reis",
  "6a18664c319100bd0e18a4d9": "Izaide Tenutes",
  "6a1865c384bc6ca4c94832b0": "Luciano Silva",
  "6a18655b604a2c23dd07cf04": "Heitor Araujo",
  "6a1863df580d45a5a68576f1": "Manuela Pereira",
  "6a1862a56e8decafe7dbf7cf": "Jhonatan Pinto",
  "6a109f3713e4e3278c351465": "Dalva Eloy",
  "6a1093849d73c58ba60b0a30": "Alveny Andrade",
  "6a1091600be9290d91ba10b7": "Thalita Assis",
  "6a1065786a6d3ec475d9f01e": "Thalita Assis",
  "6a0f7d574ea379ac43cdf157": "Bryan Dellaquila",
  "6a0f7aa18f63315d7a5a0c64": "Bruna Silva",
  "6a0f791f36eb1e0cf618cd7c": "Ana Heilmann",
  "6a0f7000d2c13a0c434505f0": "Samantha Diniz",
  "6a0cba6bb2fab929788e5c22": "Gabryelle Aguirre",
  "6a0cb94cac72ede06562bd13": "Mirela Silva",
  "6a0cb65b0184853af7b89a82": "Helena Barbosa",
  "6a02413ce0eaf63d0ff81047": "Elenilson Almeida",
  "6a023e6cc291710a480a889e": "Elenilson Almeida",
  "69fa0abf70a6e24ce30e2363": "Amanda Porcionato",
  "69fa091c880fbb636d0097d6": "Matheus Silva Abdalla",
  "69f350f17a27bd596684e2e5": "Ricardo Germano",
  "69f25baab12bf512685be0a3": "Rodolpho Bispo",
  "69f251c054450b448e75c404": "Joao Soares",
  "69f0c612c94c2d58adef4f27": "Samantha Diniz",
  "69e41609a68f9b768fbbb8f2": "Pedro Dalfior",
  "69e2a543e4fa7d0475894603": "Heitor Araujo",
  "69e29eaca415708052fe1f56": "Juliano Reis",
  "69e29778dfeb5517d183c223": "Luciano Silva",
  "69e2392a870fa44207128afa": "Rany Santos",
  "69e2374b023846a5da093563": "Klayre Ferreira",
  "69e234f6dc6e4be847711b41": "Samantha Diniz",
  "69e163b12a5609671c48b128": "Izaide Tenutes",
  "69e160d7c76c929629354867": "Eduarda Silva",
  "69de855103bafcacee8c96f8": "Bryan Dellaquila",
  "69de5cc28ed114ae49049de0": "Bruna Silva",
  "69de55a12db68a030af396f9": "Klayre Ferreira",
  "69de518fe15c36ed73949525": "Ana Heilmann",
  "69de4db6f251b76f26d47ff6": "Rany Santos",
  "69de43e5dca7388223711370": "Samantha Diniz",
  "69dcf2cadad9065f38819f51": "Samantha Diniz",
  "69c534ee975bd4925393229b": "Kellen da Silva Miranda",
};

const MANAGER_IDS = [
  "69b0876fae21baa2dbc96e69",
  "69bc3b0c2a25be4a4725ec4e",
  "69d4ff61e216b4759820f2e2",
  "69d4ffbed073251b2fc853cb",
  "69d500028fc95bcd0ff88c94",
  "69d5009289bcc5ca1d7511a8",
  "69d5012a159ef9692d821002",
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });

    // 1. Montar mapa manager_id → full_name
    const managerIdToName = {};
    for (const managerId of MANAGER_IDS) {
      try {
        const gestor = await base44.asServiceRole.entities.Gestor.get(managerId);
        if (gestor && gestor.full_name) {
          managerIdToName[managerId] = gestor.full_name;
        }
      } catch (e) {
        console.error(`Gestor não encontrado: ${managerId}`, e.message);
      }
    }

    // 2. Iterar os FeedbackRecords do mapa e aplicar correções
    let total_processado = 0;
    let total_atualizado = 0;
    const erros = [];

    for (const [fbId, correctEmployeeName] of Object.entries(EMPLOYEE_CORRECTIONS)) {
      total_processado++;
      try {
        const record = await base44.asServiceRole.entities.FeedbackRecord.get(fbId);
        if (!record) {
          erros.push({ id: fbId, error: 'Registro não encontrado' });
          continue;
        }

        const correctManagerName = record.manager_id ? (managerIdToName[record.manager_id] || record.manager_name) : record.manager_name;

        // Só atualiza se ao menos um campo estiver diferente
        const employeeChanged = record.employee_name !== correctEmployeeName;
        const managerChanged  = record.manager_name  !== correctManagerName;

        if (!employeeChanged && !managerChanged) continue;

        await base44.asServiceRole.entities.FeedbackRecord.update(fbId, {
          employee_name: correctEmployeeName,
          manager_name:  correctManagerName
        });

        total_atualizado++;
      } catch (e) {
        erros.push({ id: fbId, error: e.message });
      }
    }

    return Response.json({
      success: true,
      total_processado,
      total_atualizado,
      total_erros: erros.length,
      erros,
      manager_map: managerIdToName
    });

  } catch (error) {
    console.error('fixFeedbackRecordNames error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});