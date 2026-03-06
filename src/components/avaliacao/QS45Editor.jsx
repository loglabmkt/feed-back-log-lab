import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const QS45_ITEMS = [
  { id: "e1", label: "1. Assimilação de escopo e rapidez" },
  { id: "e2", label: "2. Atuação colaborativa sem solicitação" },
  { id: "e3", label: "3. Empenho e comprometimento na execução" },
  { id: "e4", label: "4. Nível de qualidade nos resultados acordados" },
  { id: "e5", label: "5. Articulação com ecossistema e parceiros" },
  { id: "e6", label: "6. Superação de obstáculos e soluções" },
  { id: "e7", label: "7. Conclusividade e compromisso com resultados" },
  { id: "e8", label: "8. Valor agregado ao projeto e ao cliente" },
  { id: "e9", label: "9. Conhecimento técnico e atualização" },
  { id: "e10", label: "10. Agilidade na resolução de problemas" },
  { id: "e11", label: "11. Organização e gestão de documentos/informações" },
  { id: "e12", label: "12. Iniciativa e motivação acima do mínimo" },
  { id: "e13", label: "13. Cumprimento de prazos e compromissos" },
];

const SCORE_COLORS = {
  4: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 cursor-pointer",
  3: "bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer",
  2: "bg-amber-50 border-amber-200 hover:bg-amber-100 cursor-pointer",
  1: "bg-red-50 border-red-200 hover:bg-red-100 cursor-pointer",
  "NO": "bg-slate-50 border-slate-200 hover:bg-slate-100 cursor-pointer",
};

const SCORE_LABELS = {
  4: "Referência / Supera",
  3: "Entrega o esperado",
  2: "Em desenvolvimento",
  1: "Crítico",
  "NO": "Não Observado",
};

export default function QS45Editor({ initialData = {}, onSave, isSaving = false }) {
  const [scores, setScores] = useState(initialData.qs45_scores || {});
  const [strengths, setStrengths] = useState(initialData.qs45_strengths || "");
  const [improvements, setImprovements] = useState(initialData.qs45_improvements || "");
  const [actionPlan, setActionPlan] = useState(initialData.qs45_action_plan || "");
  const [validationError, setValidationError] = useState("");

  const handleScoreClick = (itemId, score) => {
    setScores(prev => ({
      ...prev,
      [itemId]: prev[itemId] === score ? undefined : score
    }));
  };

  const handleSubmit = () => {
    // Validação: campos qualitativos são obrigatórios
    if (!strengths.trim() || !improvements.trim() || !actionPlan.trim()) {
      setValidationError("Todos os campos qualitativos são obrigatórios (Pontos Fortes, Melhoria e Plano de Ação).");
      return;
    }

    // Calcular média (excluindo NO)
    const validScores = Object.values(scores).filter(s => s !== "NO" && s !== undefined);
    const average = validScores.length > 0 
      ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2)
      : null;

    onSave({
      qs45_scores: scores,
      qs45_strengths: strengths,
      qs45_improvements: improvements,
      qs45_action_plan: actionPlan,
      qs45_average: average
    });
  };

  const totalScored = Object.keys(scores).filter(k => scores[k] !== undefined).length;

  return (
    <div className="space-y-6">
      {/* Progresso */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Progresso da Avaliação</p>
              <p className="text-xs text-slate-500 mt-1">{totalScored} de 13 itens avaliados</p>
            </div>
            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all" 
                style={{width: `${(totalScored / 13) * 100}%`, background: '#F8B137'}}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 13 Itens de Avaliação */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{background: '#F8B137', color: '#14141E'}}>13</div>
            <CardTitle className="text-base">Itens de Avaliação — LOGLAB_QS_45</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {QS45_ITEMS.map(item => (
            <div key={item.id} className="p-4 rounded-xl border bg-white">
              <Label className="text-sm font-semibold text-slate-800 block mb-3">{item.label}</Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, "NO"].map(score => (
                  <button
                    key={score}
                    onClick={() => handleScoreClick(item.id, score)}
                    className={`px-4 py-2 rounded-lg border-2 font-semibold text-xs transition-all ${
                      scores[item.id] === score 
                        ? "ring-2 ring-offset-2 ring-slate-400" 
                        : ""
                    } ${SCORE_COLORS[score]}`}
                  >
                    {score} – {SCORE_LABELS[score]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bloco Qualitativo */}
      <Card className="border-0 shadow-sm border-l-4" style={{borderLeftColor: '#F8B137'}}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{background: '#F8B137', color: '#14141E'}}>OBRIGATÓRIO</span>
            <CardTitle className="text-base">Comentários Qualitativos</CardTitle>
          </div>
          <p className="text-xs text-slate-500 mt-2">Estes campos são essenciais para contextualizar a avaliação.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-slate-700">Pontos Fortes nas Entregas *</Label>
            <Textarea
              placeholder="Descreva os principais pontos positivos identificados no desempenho..."
              value={strengths}
              onChange={e => setStrengths(e.target.value)}
              className="mt-2 resize-none"
              rows={3}
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700">Pontos de Melhoria na Qualidade *</Label>
            <Textarea
              placeholder="Indique aspectos que precisam ser melhorados..."
              value={improvements}
              onChange={e => setImprovements(e.target.value)}
              className="mt-2 resize-none"
              rows={3}
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700">Plano de Ação *</Label>
            <Textarea
              placeholder="Defina as ações concretas e prazos para evolução..."
              value={actionPlan}
              onChange={e => setActionPlan(e.target.value)}
              className="mt-2 resize-none"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Erro de validação */}
      {validationError && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{validationError}</p>
        </div>
      )}

      {/* Botão de Submissão */}
      <div className="flex justify-end gap-2">
        <Button 
          onClick={handleSubmit}
          disabled={isSaving}
          style={{background: '#F8B137', color: '#14141E'}}
          className="font-semibold"
        >
          {isSaving ? "Salvando..." : "Salvar e Enviar para Revisão"}
        </Button>
      </div>
    </div>
  );
}