import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, Send, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import GestorLayout from "@/components/GestorLayout";

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

const SCALE = [
  { value: 1, label: "1 – Crítico", color: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200" },
  { value: 2, label: "2 – Em desenvolvimento", color: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200" },
  { value: 3, label: "3 – Entrega o esperado", color: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200" },
  { value: 4, label: "4 – Referência / Supera", color: "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200" },
  { value: "NO", label: "NO – Não Observado", color: "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200" },
];

function ScaleButton({ value, selected, onClick }) {
  const opt = SCALE.find(s => s.value === value);
  const isSelected = selected === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${opt.color} ${isSelected ? 'ring-2 ring-offset-1 ring-slate-400 scale-105' : 'opacity-70'}`}
    >
      {opt.label}
    </button>
  );
}

function ItemRow({ item, score, onScore }) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
      <p className="font-semibold text-slate-800 text-sm">{item.label}</p>
      <div className="flex flex-wrap gap-2">
        {SCALE.map(opt => (
          <ScaleButton key={opt.value} value={opt.value} selected={score} onClick={onScore} />
        ))}
      </div>
    </div>
  );
}

export default function AvaliacaoQS45() {
  const navigate = useNavigate();
  const [gestor, setGestor] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [scores, setScores] = useState({});
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [actionPlan, setActionPlan] = useState("");

  useEffect(() => {
    const session = localStorage.getItem('gestor_session');
    if (!session) { window.location.href = '/gestorlogin'; return; }
    setGestor(JSON.parse(session));
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (!id) { navigate(createPageUrl("GestorFeedbacks")); return; }

      const list = await base44.entities.FeedbackRecord.filter({ id });
      if (!list || list.length === 0) { navigate(createPageUrl("GestorFeedbacks")); return; }

      const fb = list[0];
      setFeedback(fb);

      if (fb.qs45_scores) setScores(fb.qs45_scores);
      if (fb.qs45_strengths) setStrengths(fb.qs45_strengths);
      if (fb.qs45_improvements) setImprovements(fb.qs45_improvements);
      if (fb.qs45_action_plan) setActionPlan(fb.qs45_action_plan);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calcAverage = (sc) => {
    const valid = Object.values(sc).filter(v => v !== "NO" && v !== undefined);
    if (valid.length === 0) return 0;
    return valid.reduce((a, b) => a + Number(b), 0) / valid.length;
  };

  const answeredCount = QS45_ITEMS.filter(i => scores[i.id] !== undefined).length;
  const allAnswered = answeredCount === QS45_ITEMS.length;
  const qualitativeOk = strengths.trim().length >= 20 && improvements.trim().length >= 20 && actionPlan.trim().length >= 20;

  const handleSave = async (sendToAdmin = false) => {
    setError("");

    if (sendToAdmin) {
      if (!allAnswered) { setError("Avalie todos os 13 itens antes de enviar."); return; }
      if (!qualitativeOk) { setError("Preencha os três campos qualitativos (mínimo 20 caracteres cada)."); return; }
    }

    setSaving(true);
    try {
      const avg = calcAverage(scores);
      await base44.entities.FeedbackRecord.update(feedback.id, {
        qs45_scores: scores,
        qs45_average: avg,
        qs45_strengths: strengths,
        qs45_improvements: improvements,
        qs45_action_plan: actionPlan,
        workflow_status: sendToAdmin ? "EM_REVISAO_ADMIN" : "DISPONIVEL_PARA_GESTOR"
      });

      if (sendToAdmin) {
        try {
          await base44.functions.invoke('notifyAdminNewEvaluation', { feedbackId: feedback.id });
        } catch (_) {}
        setSubmitted(true);
      } else {
        setError("Rascunho salvo com sucesso!");
      }
    } catch (e) {
      setError(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <GestorLayout gestor={gestor} currentPage="feedbacks">
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8B137]" />
      </div>
    </GestorLayout>
  );

  if (submitted) return (
    <GestorLayout gestor={gestor} currentPage="feedbacks">
      <div className="max-w-2xl mx-auto text-center py-20 space-y-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{background: '#F8B137'}}>
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Avaliação enviada!</h2>
        <p className="text-slate-500">O Admin foi notificado e irá revisar a avaliação em breve.</p>
        <Button onClick={() => navigate(createPageUrl("GestorFeedbacks"))} style={{background: '#F8B137', color: '#14141E'}}>
          Voltar aos Feedbacks
        </Button>
      </div>
    </GestorLayout>
  );

  const canEdit = !feedback || feedback.workflow_status === "DISPONIVEL_PARA_GESTOR";

  return (
    <GestorLayout gestor={gestor} currentPage="feedbacks">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Button variant="ghost" onClick={() => navigate(createPageUrl("GestorFeedbacks"))} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Avaliação de Qualidade de Serviço — 45 Dias</h1>
              <p className="text-slate-500">Prestador: <strong>{feedback?.employee_name}</strong></p>
            </div>
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 border flex-shrink-0">QS-45 · Log Lab</Badge>
          </div>
        </div>

        {error && (
          <Alert variant={error.includes("sucesso") ? "default" : "destructive"}>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!canEdit && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-700">Esta avaliação já foi enviada para revisão do Admin e não pode ser editada.</AlertDescription>
          </Alert>
        )}

        {/* Progresso */}
        <Card className="border-0 shadow-sm" style={{borderLeft: '4px solid #F8B137'}}>
          <CardContent className="p-4 flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-black" style={{color: '#F8B137'}}>{answeredCount}<span className="text-base font-normal text-slate-400">/13</span></p>
              <p className="text-xs text-slate-500">Itens avaliados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-slate-800">
                {answeredCount > 0 ? calcAverage(scores).toFixed(2) : "—"}
                <span className="text-base font-normal text-slate-400">/4,00</span>
              </p>
              <p className="text-xs text-slate-500">Média parcial</p>
            </div>
            <p className="text-xs text-slate-400 ml-auto">* Itens "Não Observado" são excluídos da média.</p>
          </CardContent>
        </Card>

        {/* 13 itens */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{background: '#F8B137', color: '#14141E'}}>13</div>
              Itens de Avaliação Objetiva
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {QS45_ITEMS.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                score={scores[item.id]}
                onScore={(val) => canEdit && setScores(prev => ({ ...prev, [item.id]: val }))}
              />
            ))}
          </CardContent>
        </Card>

        {/* Bloco Qualitativo — USO INTERNO */}
        <Card className="border-0 shadow-sm border-l-4 border-l-slate-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{background: '#14141E'}}>USO INTERNO</span>
              14 – Comentários Qualitativos (Gestor / Empresa Contratante)
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">Este bloco é visível apenas para o Gestor e o Admin/RH. Não será exibido ao prestador de serviços.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Pontos Fortes nas Entregas *</Label>
              <Textarea
                value={strengths}
                onChange={e => canEdit && setStrengths(e.target.value)}
                placeholder="Descreva os pontos fortes observados nas entregas..."
                rows={4}
                disabled={!canEdit}
              />
              <p className="text-xs text-slate-400">{strengths.length} caracteres (mín. 20)</p>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Pontos de Melhoria na Qualidade *</Label>
              <Textarea
                value={improvements}
                onChange={e => canEdit && setImprovements(e.target.value)}
                placeholder="Descreva os pontos que precisam de melhoria..."
                rows={4}
                disabled={!canEdit}
              />
              <p className="text-xs text-slate-400">{improvements.length} caracteres (mín. 20)</p>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Plano de Ação *</Label>
              <Textarea
                value={actionPlan}
                onChange={e => canEdit && setActionPlan(e.target.value)}
                placeholder="Descreva as ações acordadas para melhoria..."
                rows={4}
                disabled={!canEdit}
              />
              <p className="text-xs text-slate-400">{actionPlan.length} caracteres (mín. 20)</p>
            </div>
          </CardContent>
        </Card>

        {canEdit && (
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              <Save className="w-4 h-4 mr-2" /> Salvar Rascunho
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={saving || !allAnswered || !qualitativeOk}
              style={{background: '#F8B137', color: '#14141E'}}
              className="font-semibold"
            >
              <Send className="w-4 h-4 mr-2" />
              {saving ? "Enviando..." : "Enviar para Revisão Admin"}
            </Button>
          </div>
        )}
      </div>
    </GestorLayout>
  );
}