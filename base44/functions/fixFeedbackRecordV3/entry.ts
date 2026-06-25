/**
 * fixFeedbackRecordV3
 * Restaura employee_name e manager_name dos 55 FeedbackRecords
 * com base no snapshot de 2026-06-24T06:00.
 * NÃO altera nenhum outro campo.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CORRECTIONS = {
  "6a2b1a54028100b31664a721": { employee_name: "Mirela Silva", manager_name: "Haisa de Arruda Hashimoto" },
  "6a295fc70ab2d16709b3d366": { employee_name: "Mirela Silva", manager_name: "Haisa de Arruda Hashimoto" },
  "6a282125b4b855cca0572c9c": { employee_name: "Heitor Araujo", manager_name: "Mônica Jabur" },
  "6a26e54df79485d07057a230": { employee_name: "Mirela Silva", manager_name: "Haisa de Arruda Hashimoto" },
  "6a26d2337bd0c12bb0570929": { employee_name: "Savio Campos", manager_name: "Mônica Jabur" },
  "6a19e8f27c6630faecd8933e": { employee_name: "Bruno Santos", manager_name: "Marcos Antonio Dos Anjos" },
  "6a19e8d8b405d109cb163b0b": { employee_name: "Jose Junior", manager_name: "Marcos Antonio Dos Anjos" },
  "6a19e8b7391464985f27c444": { employee_name: "Joao Soares", manager_name: "Marcos Antonio Dos Anjos" },
  "6a19e89fd8acf91146d442c8": { employee_name: "Monica Jabur", manager_name: "Marcos Antonio Dos Anjos" },
  "6a189027a97800b7c8dde7aa": { employee_name: "Heitor Araujo", manager_name: "Mônica Jabur" },
  "6a186808021fb9a741a13950": { employee_name: "Jhonatan Pinto", manager_name: "Mônica Jabur" },
  "6a1867b4068172808cc09420": { employee_name: "Manuela Pereira", manager_name: "Mônica Jabur" },
  "6a18675a4d281ebe279f6570": { employee_name: "Eduarda Silva", manager_name: "Mônica Jabur" },
  "6a1866d65e30a3a35974423d": { employee_name: "Juliano Reis", manager_name: "Mônica Jabur" },
  "6a18664c319100bd0e18a4d9": { employee_name: "Izaide Tenutes", manager_name: "Mônica Jabur" },
  "6a1865c384bc6ca4c94832b0": { employee_name: "Luciano Silva", manager_name: "Mônica Jabur" },
  "6a18655b604a2c23dd07cf04": { employee_name: "Heitor Araujo", manager_name: "Mônica Jabur" },
  "6a1863df580d45a5a68576f1": { employee_name: "Manuela Pereira", manager_name: "Mônica Jabur" },
  "6a1862a56e8decafe7dbf7cf": { employee_name: "Jhonatan Pinto", manager_name: "Mônica Jabur" },
  "6a109f3713e4e3278c351465": { employee_name: "Dalva Eloy", manager_name: "Dulcineia Maria Lins" },
  "6a1093849d73c58ba60b0a30": { employee_name: "Alveny Andrade", manager_name: "Dulcineia Maria Lins" },
  "6a1091600be9290d91ba10b7": { employee_name: "Thalita Assis", manager_name: "Dulcineia Maria Lins" },
  "6a1065786a6d3ec475d9f01e": { employee_name: "Thalita Assis", manager_name: "Dulcineia Maria Lins" },
  "6a0f7d574ea379ac43cdf157": { employee_name: "Bryan Dellaquila", manager_name: "Marcos Florisbelo" },
  "6a0f7aa18f63315d7a5a0c64": { employee_name: "Bruna Silva", manager_name: "Marcos Florisbelo" },
  "6a0f791f36eb1e0cf618cd7c": { employee_name: "Ana Heilmann", manager_name: "Marcos Florisbelo" },
  "6a0f7000d2c13a0c434505f0": { employee_name: "Samantha Diniz", manager_name: "Marcos Florisbelo" },
  "6a0cba6bb2fab929788e5c22": { employee_name: "Gabryelle Aguirre", manager_name: "Haisa de Arruda Hashimoto" },
  "6a0cb94cac72ede06562bd13": { employee_name: "Mirela Silva", manager_name: "Haisa de Arruda Hashimoto" },
  "6a0cb65b0184853af7b89a82": { employee_name: "Helena Barbosa", manager_name: "Haisa de Arruda Hashimoto" },
  "6a02413ce0eaf63d0ff81047": { employee_name: "Elenilson Almeida", manager_name: "Dulcineia Maria Lins" },
  "6a023e6cc291710a480a889e": { employee_name: "Elenilson Almeida", manager_name: "Dulcineia Maria Lins" },
  "69fa0abf70a6e24ce30e2363": { employee_name: "Amanda Porcionato", manager_name: "Haisa de Arruda Hashimoto" },
  "69fa091c880fbb636d0097d6": { employee_name: "Matheus Silva Abdalla", manager_name: "Haisa de Arruda Hashimoto" },
  "69f350f17a27bd596684e2e5": { employee_name: "Ricardo Germano", manager_name: "Marcos Antonio Dos Anjos" },
  "69f25baab12bf512685be0a3": { employee_name: "Rodolpho Bispo", manager_name: "Haisa de Arruda Hashimoto" },
  "69f251c054450b448e75c404": { employee_name: "Joao Soares", manager_name: "Marcos Antonio Dos Anjos" },
  "69f0c612c94c2d58adef4f27": { employee_name: "Samantha Diniz", manager_name: "Marcos Florisbelo" },
  "69e41609a68f9b768fbbb8f2": { employee_name: "Pedro Dalfior", manager_name: "Ericka Chaves Ribeiro" },
  "69e2a543e4fa7d0475894603": { employee_name: "Heitor Araujo", manager_name: "Mônica Jabur" },
  "69e29eaca415708052fe1f56": { employee_name: "Juliano Reis", manager_name: "Mônica Jabur" },
  "69e29778dfeb5517d183c223": { employee_name: "Luciano Silva", manager_name: "Mônica Jabur" },
  "69e2392a870fa44207128afa": { employee_name: "Rany Santos", manager_name: "Marcos Florisbelo" },
  "69e2374b023846a5da093563": { employee_name: "Klayre Ferreira", manager_name: "Marcos Florisbelo" },
  "69e234f6dc6e4be847711b41": { employee_name: "Samantha Diniz", manager_name: "Marcos Florisbelo" },
  "69e163b12a5609671c48b128": { employee_name: "Izaide Tenutes", manager_name: "Mônica Jabur" },
  "69e160d7c76c929629354867": { employee_name: "Eduarda Silva", manager_name: "Mônica Jabur" },
  "69de855103bafcacee8c96f8": { employee_name: "Bryan Dellaquila", manager_name: "Marcos Florisbelo" },
  "69de5cc28ed114ae49049de0": { employee_name: "Bruna Silva", manager_name: "Marcos Florisbelo" },
  "69de55a12db68a030af396f9": { employee_name: "Klayre Ferreira", manager_name: "Marcos Florisbelo" },
  "69de518fe15c36ed73949525": { employee_name: "Ana Heilmann", manager_name: "Marcos Florisbelo" },
  "69de4db6f251b76f26d47ff6": { employee_name: "Rany Santos", manager_name: "Marcos Florisbelo" },
  "69de43e5dca7388223711370": { employee_name: "Samantha Diniz", manager_name: "Marcos Florisbelo" },
  "69dcf2cadad9065f38819f51": { employee_name: "Samantha Diniz", manager_name: "Marcos Florisbelo" },
  "69c534ee975bd4925393229b": { employee_name: "Kellen da Silva Miranda", manager_name: "Rodolpho da Silva Bispo" },
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

    for (const [id, names] of Object.entries(CORRECTIONS)) {
      try {
        await base44.asServiceRole.entities.FeedbackRecord.update(id, {
          employee_name: names.employee_name,
          manager_name: names.manager_name
        });
        updated++;
      } catch (e) {
        errors.push({ id, error: e.message });
      }
    }

    return Response.json({
      updated,
      skipped,
      errors,
      total: Object.keys(CORRECTIONS).length
    });

  } catch (error) {
    console.error('fixFeedbackRecordV3 error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});