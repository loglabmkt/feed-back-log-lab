import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const QS45_ITEMS = [
  { id: "e1",  label: "1. Assimilação de escopo e rapidez" },
  { id: "e2",  label: "2. Atuação colaborativa sem solicitação" },
  { id: "e3",  label: "3. Empenho e comprometimento na execução" },
  { id: "e4",  label: "4. Nível de qualidade nos resultados acordados" },
  { id: "e5",  label: "5. Articulação com ecossistema e parceiros" },
  { id: "e6",  label: "6. Superação de obstáculos e soluções" },
  { id: "e7",  label: "7. Conclusividade e compromisso com resultados" },
  { id: "e8",  label: "8. Valor agregado ao projeto e ao cliente" },
  { id: "e9",  label: "9. Conhecimento técnico e atualização" },
  { id: "e10", label: "10. Agilidade na resolução de problemas" },
  { id: "e11", label: "11. Organização e gestão de documentos/informações" },
  { id: "e12", label: "12. Iniciativa e motivação acima do mínimo" },
  { id: "e13", label: "13. Cumprimento de prazos e compromissos" },
];

const SCORE_COLORS = {
  4: "bg-emerald-100 text-emerald-700 border-emerald-200",
  3: "bg-blue-100 text-blue-700 border-blue-200",
  2: "bg-amber-100 text-amber-700 border-amber-200",
  1: "bg-red-100 text-red-700 border-red-200",
  "NO": "bg-slate-100 text-slate-600 border-slate-200",
};
const SCORE_LABELS = {
  4: "Referência / Supera",
  3: "Entrega o esperado",
  2: "Em desenvolvimento",
  1: "Crítico",
  "NO": "Não Observado",
};

// showQualitative: false no link público do prestador
export default function QS45Content({ fb, showQualitative = true }) {
  const scores = fb.qs45_scores || {};
  const average = fb.qs45_average;

  return (
    <div className="space-y-6">
      {/* Resultado */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resultado da Avaliação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="text-center px-6 py-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-600 mb-1">Média Ponderada</p>
              <p className="text-3xl font-bold" style={{color: '#F8B137'}}>
                {average ? Number(average).toFixed(2) : "—"}
                <span className="text-base font-normal text-slate-400">/4,00</span>
              </p>
            </div>
            <div className="text-center px-6 py-3 rounded-xl bg-slate-50 border">
              <p className="text-xs text-slate-500 mb-1">Itens Avaliados</p>
              <p className="text-2xl font-bold text-slate-700">
                {Object.keys(scores).length}
                <span className="text-sm font-normal text-slate-400">/13</span>
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">* Itens "Não Observado" são excluídos do cálculo da média.</p>
        </CardContent>
      </Card>

      {/* 13 itens */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{background: '#F8B137', color: '#14141E'}}>13</div>
            <CardTitle className="text-base font-bold">Itens de Avaliação — LOGLAB_QS_45</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {QS45_ITEMS.map(item => {
            const score = scores[item.id];
            const colorClass = SCORE_COLORS[score] ?? "bg-slate-50 text-slate-400 border-slate-200";
            return (
              <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-800 text-sm">{item.label}</span>
                {score !== undefined ? (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${colorClass}`}>
                    {score} – {SCORE_LABELS[score]}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Bloco Qualitativo — apenas Admin/Gestor */}
      {showQualitative && (fb.qs45_strengths || fb.qs45_improvements || fb.qs45_action_plan) && (
        <Card className="border-0 shadow-sm border-l-4 border-l-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{background: '#14141E'}}>USO INTERNO</span>
              <CardTitle className="text-base font-bold">Comentários Qualitativos (Gestor / Admin)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fb.qs45_strengths && (
              <div>
                <Label className="text-sm font-semibold text-slate-700">Pontos Fortes nas Entregas</Label>
                <div className="mt-2 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-slate-700 whitespace-pre-wrap text-sm">{fb.qs45_strengths}</p>
                </div>
              </div>
            )}
            {fb.qs45_improvements && (
              <div>
                <Label className="text-sm font-semibold text-slate-700">Pontos de Melhoria na Qualidade</Label>
                <div className="mt-2 p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-slate-700 whitespace-pre-wrap text-sm">{fb.qs45_improvements}</p>
                </div>
              </div>
            )}
            {fb.qs45_action_plan && (
              <div>
                <Label className="text-sm font-semibold text-slate-700">Plano de Ação</Label>
                <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-slate-700 whitespace-pre-wrap text-sm">{fb.qs45_action_plan}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}