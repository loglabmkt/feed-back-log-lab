import React from "react";
import { Label } from "@/components/ui/label";

const QS90_CRITERIA = [
  { id: "comunicacao", label: "Comunicação" },
  { id: "prazo", label: "Cumprimento de Prazos" },
  { id: "qualidade", label: "Qualidade das Entregas" },
  { id: "proatividade", label: "Proatividade" },
  { id: "relacionamento", label: "Relacionamento" },
  { id: "adaptabilidade", label: "Adaptabilidade" },
  { id: "conhecimento", label: "Conhecimento Técnico" },
  { id: "responsabilidade", label: "Responsabilidade" },
  { id: "organizacao", label: "Organização" },
  { id: "resolucao", label: "Resolução de Problemas" },
  { id: "comprometimento", label: "Comprometimento" },
  { id: "atendimento", label: "Atendimento ao Cliente" },
  { id: "inovacao", label: "Inovação" },
];

const SCORE_COLORS = {
  1: "text-red-600 bg-red-50",
  2: "text-orange-600 bg-orange-50",
  3: "text-yellow-600 bg-yellow-50",
  4: "text-green-600 bg-green-50",
  5: "text-emerald-600 bg-emerald-50",
};

const SCORE_LABELS = {
  1: "Muito Abaixo",
  2: "Abaixo",
  3: "Dentro",
  4: "Acima",
  5: "Muito Acima",
};

const DECISION_LABELS = {
  continuidade: "Continuidade",
  continuidade_melhoria: "Continuidade com Melhorias",
  encerramento: "Encerramento",
};

function FieldBlock({ label, value, colorClass = "bg-slate-50 border-slate-200", labelClass = "text-slate-600" }) {
  if (!value) return null;
  return (
    <div>
      <p className={`text-xs font-semibold mb-1 ${labelClass}`}>{label}</p>
      <div className={`p-3 rounded-lg border ${colorClass}`}>
        <p className="text-slate-700 text-sm whitespace-pre-wrap">{value}</p>
      </div>
    </div>
  );
}

function ScoreRow({ label, score }) {
  if (!score) return null;
  const colorClass = SCORE_COLORS[score] || "text-slate-600 bg-slate-50";
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-700">{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorClass}`}>
        {score} — {SCORE_LABELS[score]}
      </span>
    </div>
  );
}

// Feedback / One on One / genérico
function GenericContent({ feedback, expanded }) {
  const hasContent = feedback.strengths || feedback.improvements || feedback.action_plan || feedback.additional_notes;

  if (!hasContent) {
    return <p className="text-slate-400 italic text-sm">Nenhum conteúdo disponível</p>;
  }

  return (
    <div className="space-y-3">
      {/* Resumo compacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {feedback.strengths && (
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <p className="font-semibold text-emerald-700 text-xs mb-1">Pontos Fortes</p>
            <p className="text-slate-700 line-clamp-3">{feedback.strengths}</p>
          </div>
        )}
        {feedback.improvements && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
            <p className="font-semibold text-amber-700 text-xs mb-1">Pontos de Melhoria</p>
            <p className="text-slate-700 line-clamp-3">{feedback.improvements}</p>
          </div>
        )}
        {feedback.action_plan && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="font-semibold text-blue-700 text-xs mb-1">Plano de Ação</p>
            <p className="text-slate-700 line-clamp-3">{feedback.action_plan}</p>
          </div>
        )}
        {feedback.additional_notes && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="font-semibold text-slate-600 text-xs mb-1">Observações</p>
            <p className="text-slate-700 line-clamp-3">{feedback.additional_notes}</p>
          </div>
        )}
      </div>

      {expanded && (
        <div className="space-y-3 border-t pt-4 mt-2">
          <FieldBlock label="Pontos Fortes" value={feedback.strengths} colorClass="bg-emerald-50 border-emerald-100" labelClass="text-emerald-700" />
          <FieldBlock label="Pontos de Melhoria" value={feedback.improvements} colorClass="bg-amber-50 border-amber-100" labelClass="text-amber-700" />
          <FieldBlock label="Plano de Ação" value={feedback.action_plan} colorClass="bg-blue-50 border-blue-100" labelClass="text-blue-700" />
          <FieldBlock label="Observações" value={feedback.additional_notes} />
        </div>
      )}
    </div>
  );
}

// Avaliação de Experiência 45 dias
function Exp45Content({ feedback, expanded }) {
  const scores = feedback.exp45_scores || {};
  const hasScores = Object.keys(scores).length > 0;

  return (
    <div className="space-y-3">
      {feedback.exp45_average !== undefined && feedback.exp45_average !== null && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-700">{Number(feedback.exp45_average).toFixed(1)}</p>
            <p className="text-xs text-blue-500">Média Geral</p>
          </div>
          <div className="flex-1 text-sm text-slate-600">Avaliação de Experiência 45 Dias</div>
        </div>
      )}

      {!expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {feedback.exp45_strengths && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="font-semibold text-emerald-700 text-xs mb-1">Pontos Fortes</p>
              <p className="text-slate-700 line-clamp-3">{feedback.exp45_strengths}</p>
            </div>
          )}
          {feedback.exp45_developments && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="font-semibold text-amber-700 text-xs mb-1">Pontos de Desenvolvimento</p>
              <p className="text-slate-700 line-clamp-3">{feedback.exp45_developments}</p>
            </div>
          )}
        </div>
      )}

      {expanded && (
        <div className="space-y-4 border-t pt-4">
          {hasScores && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Pontuações por Critério</p>
              <div className="bg-slate-50 rounded-lg p-3 border">
                {QS90_CRITERIA.map(c => scores[c.id] != null && (
                  <ScoreRow key={c.id} label={c.label} score={scores[c.id]} />
                ))}
              </div>
            </div>
          )}
          <FieldBlock label="Pontos Fortes" value={feedback.exp45_strengths} colorClass="bg-emerald-50 border-emerald-100" labelClass="text-emerald-700" />
          <FieldBlock label="Pontos de Desenvolvimento" value={feedback.exp45_developments} colorClass="bg-amber-50 border-amber-100" labelClass="text-amber-700" />
          <FieldBlock label="Plano de Ação" value={feedback.exp45_action_plan} colorClass="bg-blue-50 border-blue-100" labelClass="text-blue-700" />
        </div>
      )}
    </div>
  );
}

// Avaliação de Qualidade de Serviço 90 dias
function Qs90Content({ feedback, expanded }) {
  const scores = feedback.qs90_scores || {};
  const hasScores = Object.keys(scores).length > 0;

  return (
    <div className="space-y-3">
      {feedback.qs90_average !== undefined && feedback.qs90_average !== null && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-700">{Number(feedback.qs90_average).toFixed(1)}</p>
            <p className="text-xs text-blue-500">Média Geral</p>
          </div>
          {feedback.qs90_decision && (
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              feedback.qs90_decision === 'encerramento' ? 'bg-red-100 text-red-700' :
              feedback.qs90_decision === 'continuidade_melhoria' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {DECISION_LABELS[feedback.qs90_decision] || feedback.qs90_decision}
            </div>
          )}
        </div>
      )}

      {!expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {feedback.qs90_strengths && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="font-semibold text-emerald-700 text-xs mb-1">Pontos Fortes</p>
              <p className="text-slate-700 line-clamp-3">{feedback.qs90_strengths}</p>
            </div>
          )}
          {feedback.qs90_improvements && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="font-semibold text-amber-700 text-xs mb-1">Pontos de Melhoria</p>
              <p className="text-slate-700 line-clamp-3">{feedback.qs90_improvements}</p>
            </div>
          )}
        </div>
      )}

      {expanded && (
        <div className="space-y-4 border-t pt-4">
          {hasScores && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Pontuações por Critério</p>
              <div className="bg-slate-50 rounded-lg p-3 border">
                {QS90_CRITERIA.map(c => scores[c.id] != null && (
                  <ScoreRow key={c.id} label={c.label} score={scores[c.id]} />
                ))}
              </div>
            </div>
          )}
          <FieldBlock label="Pontos Fortes" value={feedback.qs90_strengths} colorClass="bg-emerald-50 border-emerald-100" labelClass="text-emerald-700" />
          <FieldBlock label="Pontos de Melhoria" value={feedback.qs90_improvements} colorClass="bg-amber-50 border-amber-100" labelClass="text-amber-700" />
          {feedback.qs90_decision_justification && (
            <FieldBlock label="Justificativa da Decisão" value={feedback.qs90_decision_justification} />
          )}
        </div>
      )}
    </div>
  );
}

// Avaliação Trimestral (evaluation)
function EvaluationContent({ feedback, expanded }) {
  return (
    <div className="space-y-3">
      {feedback.performance_band && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-700">{feedback.total_score ?? '—'}</p>
            <p className="text-xs text-blue-500">Pontuação Total</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            feedback.performance_band === 'immediate_action' ? 'bg-red-100 text-red-700' :
            feedback.performance_band === 'attention' ? 'bg-yellow-100 text-yellow-700' :
            feedback.performance_band === 'adequate' ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }`}>
            {{
              immediate_action: 'Ação Imediata',
              attention: 'Atenção',
              adequate: 'Adequado',
              reference: 'Referência',
            }[feedback.performance_band] || feedback.performance_band}
          </div>
        </div>
      )}

      {!expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {feedback.strengths && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="font-semibold text-emerald-700 text-xs mb-1">Pontos Fortes</p>
              <p className="text-slate-700 line-clamp-3">{feedback.strengths}</p>
            </div>
          )}
          {feedback.improvements && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="font-semibold text-amber-700 text-xs mb-1">Pontos de Melhoria</p>
              <p className="text-slate-700 line-clamp-3">{feedback.improvements}</p>
            </div>
          )}
        </div>
      )}

      {expanded && (
        <div className="space-y-4 border-t pt-4">
          <FieldBlock label="Pontos Fortes" value={feedback.strengths} colorClass="bg-emerald-50 border-emerald-100" labelClass="text-emerald-700" />
          <FieldBlock label="Pontos de Melhoria" value={feedback.improvements} colorClass="bg-amber-50 border-amber-100" labelClass="text-amber-700" />
          <FieldBlock label="Plano de Ação" value={feedback.action_plan} colorClass="bg-blue-50 border-blue-100" labelClass="text-blue-700" />
          <FieldBlock label="Ação Recomendada" value={feedback.recommended_action} />
          {(feedback.eval_action_1 || feedback.eval_action_2 || feedback.eval_action_3) && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Ações de Desenvolvimento</p>
              <div className="space-y-2">
                {feedback.eval_action_1 && <FieldBlock label="Ação 1" value={feedback.eval_action_1} />}
                {feedback.eval_action_2 && <FieldBlock label="Ação 2" value={feedback.eval_action_2} />}
                {feedback.eval_action_3 && <FieldBlock label="Ação 3" value={feedback.eval_action_3} />}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FeedbackContentSummary({ feedback, expanded }) {
  if (!feedback) return null;

  const type = feedback.feedback_type;

  if (type === 'experience_45d') return <Exp45Content feedback={feedback} expanded={expanded} />;
  if (type === 'experience_90d') return <Qs90Content feedback={feedback} expanded={expanded} />;
  if (type === 'evaluation') return <EvaluationContent feedback={feedback} expanded={expanded} />;
  return <GenericContent feedback={feedback} expanded={expanded} />;
}