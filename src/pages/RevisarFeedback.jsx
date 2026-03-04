import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Avaliação Trimestral helpers ──────────────────────────────────────────────
const HARD_SKILLS = [
  { id: "h1", label: "H1 – Conhecimento Técnico" },
  { id: "h2", label: "H2 – Qualidade das Entregas" },
  { id: "h3", label: "H3 – Produtividade" },
  { id: "h4", label: "H4 – Gestão de Informações" },
  { id: "h5", label: "H5 – Cumprimento de Prazos" },
];
const SOFT_SKILLS = [
  { id: "s1", label: "S1 – Comunicação" },
  { id: "s2", label: "S2 – Trabalho em Equipe" },
  { id: "s3", label: "S3 – Proatividade" },
  { id: "s4", label: "S4 – Adaptabilidade" },
  { id: "s5", label: "S5 – Responsabilidade" },
];
const SCORE_LABELS = { 1: "Abaixo do Esperado", 2: "Em Desenvolvimento", 3: "Atende ao Esperado", 4: "Supera o Esperado" };
const SCORE_COLORS = {
  1: "bg-red-100 text-red-700 border-red-200",
  2: "bg-amber-100 text-amber-700 border-amber-200",
  3: "bg-blue-100 text-blue-700 border-blue-200",
  4: "bg-emerald-100 text-emerald-700 border-emerald-200",
};
const BAND_LABELS = {
  immediate_action: { label: "Alerta – PIP", color: "bg-red-100 text-red-700 border-red-300" },
  attention: { label: "Atenção – Suporte necessário", color: "bg-amber-100 text-amber-700 border-amber-300" },
  adequate: { label: "Adequado – Manutenção", color: "bg-blue-100 text-blue-700 border-blue-300" },
  reference: { label: "Referência – Promoção", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
};

function CriterionRow({ label, score, evidence }) {
  const colorClass = SCORE_COLORS[score] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-slate-800 text-sm">{label}</span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colorClass} flex-shrink-0`}>
          {score} – {SCORE_LABELS[score]}
        </span>
      </div>
      {evidence && (
        <p className="text-sm text-slate-500 italic border-t pt-2 mt-1">Evidência: {evidence}</p>
      )}
    </div>
  );
}

function AvaliacaoContent({ fb }) {
  const hardTotal = HARD_SKILLS.reduce((s, c) => s + (fb[`${c.id}_score`] || 0), 0);
  const softTotal = SOFT_SKILLS.reduce((s, c) => s + (fb[`${c.id}_score`] || 0), 0);
  const band = BAND_LABELS[fb.performance_band] || {};
  return (
    <div className="space-y-6">
      {/* Resultado */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resultado da Avaliação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="text-center px-6 py-3 rounded-xl bg-slate-50 border">
              <p className="text-xs text-slate-500 mb-1">Pontuação Total</p>
              <p className="text-3xl font-black" style={{color: '#F8B137'}}>{fb.total_score}<span className="text-base font-normal text-slate-400">/40</span></p>
            </div>
            <div className="text-center px-6 py-3 rounded-xl bg-slate-50 border">
              <p className="text-xs text-slate-500 mb-1">Hard Skills</p>
              <p className="text-2xl font-bold text-slate-700">{hardTotal}<span className="text-sm font-normal text-slate-400">/20</span></p>
            </div>
            <div className="text-center px-6 py-3 rounded-xl bg-slate-50 border">
              <p className="text-xs text-slate-500 mb-1">Soft Skills</p>
              <p className="text-2xl font-bold text-slate-700">{softTotal}<span className="text-sm font-normal text-slate-400">/20</span></p>
            </div>
            {fb.performance_band && (
              <div className={`px-4 py-3 rounded-xl border ${band.color}`}>
                <p className="text-xs font-semibold mb-0.5">Faixa de Desempenho</p>
                <p className="font-bold text-sm">{band.label}</p>
              </div>
            )}
          </div>
          {fb.recommended_action && (
            <p className="mt-3 text-sm text-slate-600"><strong>Ação recomendada:</strong> {fb.recommended_action}</p>
          )}
          {fb.quarter_reference && (
            <p className="mt-1 text-sm text-slate-500">Trimestre: <strong>{fb.quarter_reference}</strong></p>
          )}
        </CardContent>
      </Card>

      {/* Hard Skills */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{background: '#14141E'}}>H</div>
            <CardTitle className="text-base font-bold">Bloco H – Hard Skills</CardTitle>
            <span className="ml-auto text-sm font-bold text-slate-600">{hardTotal}/20</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {HARD_SKILLS.map(c => (
            <CriterionRow key={c.id} label={c.label} score={fb[`${c.id}_score`]} evidence={fb[`${c.id}_evidence`]} />
          ))}
        </CardContent>
      </Card>

      {/* Soft Skills */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{background: '#F8B137', color: '#14141E'}}>S</div>
            <CardTitle className="text-base font-bold">Bloco S – Soft Skills</CardTitle>
            <span className="ml-auto text-sm font-bold text-slate-600">{softTotal}/20</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {SOFT_SKILLS.map(c => (
            <CriterionRow key={c.id} label={c.label} score={fb[`${c.id}_score`]} evidence={fb[`${c.id}_evidence`]} />
          ))}
        </CardContent>
      </Card>

      {/* Plano de Ação */}
      {(fb.eval_action_1 || fb.eval_action_2 || fb.eval_action_3) && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base font-bold">Plano de Ação (PDI)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {fb.eval_action_1 && (
              <div className="p-4 bg-slate-50 rounded-xl border">
                <p className="text-xs font-bold text-slate-500 mb-1">Ação 1 *</p>
                <p className="text-sm text-slate-800">{fb.eval_action_1}</p>
              </div>
            )}
            {fb.eval_action_2 && (
              <div className="p-4 bg-slate-50 rounded-xl border">
                <p className="text-xs font-bold text-slate-500 mb-1">Ação 2 *</p>
                <p className="text-sm text-slate-800">{fb.eval_action_2}</p>
              </div>
            )}
            {fb.eval_action_3 && (
              <div className="p-4 bg-slate-50 rounded-xl border">
                <p className="text-xs font-bold text-slate-500 mb-1">Ação 3 (opcional)</p>
                <p className="text-sm text-slate-800">{fb.eval_action_3}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function RevisarFeedback() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const params = new URLSearchParams(window.location.search);
      const feedbackId = params.get('id');
      
      if (!feedbackId) {
        navigate(createPageUrl("Feedbacks"));
        return;
      }

      const feedbackData = await base44.entities.FeedbackRecord.filter({ id: feedbackId });
      
      if (!feedbackData || feedbackData.length === 0) {
        navigate(createPageUrl("Feedbacks"));
        return;
      }

      const fb = feedbackData[0];
      setFeedback(fb);
    } catch (e) {
      console.error(e);
      setError("Erro ao carregar feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setError("");
    setApproving(true);

    try {
      await base44.entities.FeedbackRecord.update(feedback.id, {
        workflow_status: "APROVADO",
        admin_approved_by: currentUser.id,
        admin_approved_date: new Date().toISOString()
      });

      navigate(createPageUrl("Respostas"));
    } catch (e) {
      setError(e.message || "Erro ao aprovar feedback");
    } finally {
      setApproving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Feedback não encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Button 
          variant="ghost" 
          onClick={() => navigate(createPageUrl("Feedbacks"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {feedback.workflow_status === 'EM_REVISAO_ADMIN' ? 'Revisar Feedback' : 'Visualizar Feedback'}
            </h1>
            <p className="text-slate-500">
              {feedback.workflow_status === 'EM_REVISAO_ADMIN' 
                ? 'Analise e aprove o feedback preenchido pelo gestor'
                : 'Feedback já revisado e aprovado'}
            </p>
          </div>
          {feedback.workflow_status === 'EM_REVISAO_ADMIN' ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Em Revisão
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Aprovado
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Informações do Colaborador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-semibold">
                {getInitials(feedback.employee_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold text-slate-900">{feedback.employee_name}</p>
              <p className="text-sm text-slate-500">{feedback.employee_email}</p>
              <p className="text-xs text-slate-400 mt-1">
                Gestor: {feedback.manager_name} • Data: {feedback.feedback_date && format(new Date(feedback.feedback_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {feedback.feedback_type === 'evaluation' ? (
        <AvaliacaoContent fb={feedback} />
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Conteúdo do Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-2">Pontos Fortes</Label>
              <div className="mt-2 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-slate-700 whitespace-pre-wrap">{feedback.strengths}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-2">Pontos de Melhoria</Label>
              <div className="mt-2 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-slate-700 whitespace-pre-wrap">{feedback.improvements}</p>
              </div>
            </div>
            {feedback.action_plan && (
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2">Plano de Ação</Label>
                <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-slate-700 whitespace-pre-wrap">{feedback.action_plan}</p>
                </div>
              </div>
            )}
            {feedback.additional_notes && (
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2">Observações</Label>
                <div className="mt-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-slate-700 whitespace-pre-wrap">{feedback.additional_notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {feedback.workflow_status === 'EM_REVISAO_ADMIN' ? (
        <>
          <Alert className="bg-blue-50 border-blue-200 mb-6">
            <AlertDescription className="text-blue-700">
              <strong>Revisão de Conformidade:</strong> Verifique se o conteúdo está adequado às políticas da empresa antes de aprovar.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button 
              onClick={handleApprove}
              disabled={approving}
              style={{background: '#22C55E', color: 'white'}}
              className="font-semibold"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {approving ? "Aprovando..." : "Concluir e Aprovar Feedback"}
            </Button>
          </div>

          <Alert className="bg-slate-50 border-slate-200">
            <AlertDescription className="text-slate-600">
              Após a aprovação, o gestor deverá agendar uma conversa com o colaborador antes de publicar o feedback.
            </AlertDescription>
          </Alert>
        </>
      ) : (
        <Alert className="bg-emerald-50 border-emerald-200">
          <AlertDescription className="text-emerald-700">
            <CheckCircle className="w-5 h-5 inline mr-2" />
            <strong>Feedback em conformidade:</strong> Disponibilizado para o gestor enviar ao colaborador após conversa pessoalmente.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}