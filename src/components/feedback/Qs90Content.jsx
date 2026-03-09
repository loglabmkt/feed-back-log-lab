/**
 * Qs90Content — Componente de visualização da Avaliação de Qualidade de Serviço 90 Dias.
 * Recebe `fb` (FeedbackRecord) e `isInternal` (boolean).
 * - isInternal=true  → exibe Blocos 14 e 15 (Admin / Gestor)
 * - isInternal=false → oculta Blocos 14 e 15 (view pública do Prestador)
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Lock } from "lucide-react";

const QS90_ITEMS = [
  { id: "q1",  label: "1",  description: "Assimilou o escopo das atividades contratadas com facilidade e rapidez." },
  { id: "q2",  label: "2",  description: "Atua de forma colaborativa com outras empresas e pares, contribuindo sem necessidade de solicitação expressa." },
  { id: "q3",  label: "3",  description: "Demonstra empenho, envolvimento e comprometimento na execução dos serviços contratados." },
  { id: "q4",  label: "4",  description: "Apresenta elevado nível de qualidade na execução e nos resultados das entregas." },
  { id: "q5",  label: "5",  description: "Articula-se com facilidade com membros de sua equipe, demais áreas e parceiros externos para gerar resultados." },
  { id: "q6",  label: "6",  description: "Supera obstáculos que surgem na execução dos serviços, identificando e implementando alternativas de solução." },
  { id: "q7",  label: "7",  description: "Conduz atividades até a conclusão, sendo conclusivo na entrega dos resultados acordados." },
  { id: "q8",  label: "8",  description: "A atuação agrega valor ao projeto e às entregas da equipe." },
  { id: "q9",  label: "9",  description: "A empresa demonstra conhecimento técnico adequado ao escopo contratado, compartilhando-o e buscando atualização quando necessário." },
  { id: "q10", label: "10", description: "O responsável técnico é ágil na identificação e geração de soluções para problemas relacionados ao escopo dos serviços." },
  { id: "q11", label: "11", description: "A empresa organiza adequadamente suas atividades e a gestão de documentos e informações vinculadas ao projeto." },
  { id: "q12", label: "12", description: "Demonstra iniciativa e motivação para entregar resultados acima do mínimo esperado." },
  { id: "q13", label: "13", description: "Cumpre os prazos acordados e os compromissos assumidos no âmbito da prestação de serviços." },
];

const SCORE_COLORS = {
  4: "bg-emerald-100 text-emerald-700 border-emerald-200",
  3: "bg-blue-100 text-blue-700 border-blue-200",
  2: "bg-amber-100 text-amber-700 border-amber-200",
  1: "bg-red-100 text-red-700 border-red-200",
  "NO": "bg-slate-100 text-slate-600 border-slate-200",
};
const SCORE_LABELS = { 4: "Referência / Supera", 3: "Entrega o esperado", 2: "Em desenvolvimento", 1: "Crítico", "NO": "Não Observado" };

const DECISION_LABELS = {
  continuidade: "Continuidade contratual recomendada.",
  continuidade_melhoria: "Continuidade contratual recomendada com plano de melhoria de serviço acordado.",
  encerramento: "Encerramento contratual recomendado.",
};

export default function Qs90Content({ fb, isInternal = false }) {
  const scores = fb.qs90_scores || {};
  const average = fb.qs90_average;

  return (
    <div className="space-y-6">

      {/* Resultado */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resultado — Avaliação de Qualidade de Serviço 90 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="text-center px-6 py-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-600 mb-1">Média Aritmética</p>
              <p className="text-3xl font-bold" style={{color: "#F8B137"}}>
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
          <p className="mt-3 text-xs text-slate-400">* Fórmula: Σ notas ÷ (13 − contagem de "Não Observado")</p>
        </CardContent>
      </Card>

      {/* 13 Itens */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{background: "#F8B137", color: "#14141E"}}>13</div>
            <CardTitle className="text-base font-bold">Itens de Avaliação</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {QS90_ITEMS.map(item => {
            const score = scores[item.id];
            const colorClass = SCORE_COLORS[score] || "bg-slate-100 text-slate-600 border-slate-200";
            return (
              <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-800 leading-relaxed">
                    <span className="font-bold text-slate-900">{item.label}. </span>
                    {item.description}
                  </p>
                  {score !== undefined ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${colorClass}`}>
                      {score} – {SCORE_LABELS[score]}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 flex-shrink-0">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Blocos 14 e 15 — apenas para uso interno */}
      {isInternal ? (
        <>
          {/* Bloco 14 */}
          {(fb.qs90_strengths || fb.qs90_improvements) && (
            <Card className="border-0 shadow-sm" style={{borderLeft: "4px solid #6366f1"}}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2" style={{color: "#6366f1"}}>
                  <Lock className="w-4 h-4" />
                  Bloco 14 – Comentários Qualitativos (Uso Interno)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fb.qs90_strengths && (
                  <div>
                    <p className="text-sm font-bold text-slate-700 mb-2">Pontos Fortes Observados nas Entregas</p>
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="text-slate-700 whitespace-pre-wrap text-sm">{fb.qs90_strengths}</p>
                    </div>
                  </div>
                )}
                {fb.qs90_improvements && (
                  <div>
                    <p className="text-sm font-bold text-slate-700 mb-2">Pontos de Melhoria na Qualidade do Serviço</p>
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-slate-700 whitespace-pre-wrap text-sm">{fb.qs90_improvements}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bloco 15 – alerta de encerramento */}
          {fb.qs90_decision && (
            <Card className={`border-0 shadow-sm ${fb.qs90_decision === "encerramento" ? "ring-2 ring-red-500" : ""}`}
              style={{borderLeft: `4px solid ${fb.qs90_decision === "encerramento" ? "#dc2626" : "#F8B137"}`}}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-sm font-bold flex items-center gap-2 ${fb.qs90_decision === "encerramento" ? "text-red-700" : "text-slate-700"}`}>
                  <Lock className="w-4 h-4" />
                  Bloco 15 – Decisão Contratual (Uso Interno)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">

                {/* Alerta imediato para encerramento */}
                {fb.qs90_decision === "encerramento" && (
                  <Alert className="bg-red-50 border-2 border-red-500">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <AlertDescription className="text-red-800 font-bold text-sm">
                      ⚠️ ENCERRAMENTO CONTRATUAL RECOMENDADO — Requer atenção imediata do Administrador.
                    </AlertDescription>
                  </Alert>
                )}

                <div className={`p-4 rounded-xl border-2 ${
                  fb.qs90_decision === "encerramento"
                    ? "border-red-400 bg-red-50"
                    : "border-amber-300 bg-amber-50"
                }`}>
                  <p className={`text-sm font-bold ${fb.qs90_decision === "encerramento" ? "text-red-800" : "text-amber-800"}`}>
                    {DECISION_LABELS[fb.qs90_decision]}
                  </p>
                </div>

                {fb.qs90_decision_justification && (
                  <div>
                    <p className="text-sm font-bold text-slate-700 mb-2">Justificativa da Decisão Contratual</p>
                    <div className={`p-4 rounded-lg border ${fb.qs90_decision === "encerramento" ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-200"}`}>
                      <p className="text-slate-700 whitespace-pre-wrap text-sm">{fb.qs90_decision_justification}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        // Placeholder para o Prestador: confirma ciência sem revelar a decisão
        <Card className="border-0 shadow-sm bg-slate-50">
          <CardContent className="py-6 text-center">
            <Lock className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-500">
              Os comentários qualitativos e a decisão contratual são de <strong>uso exclusivo do Contratante</strong> e não são exibidos aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}