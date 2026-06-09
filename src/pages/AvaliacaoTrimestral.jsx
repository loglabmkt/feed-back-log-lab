import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Save, AlertCircle, CheckCircle,
  User, Calendar, ClipboardList, ChevronRight, Search, Users, BookOpen
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CompetencyCriterion from "@/components/avaliacao/CompetencyCriterion";
import ScoreSummary, { getBandKey, BANDS } from "@/components/avaliacao/ScoreSummary";
import GuiaGestorTrimestral from "@/components/avaliacao/GuiaGestorTrimestral";

const GUIA_READ_KEY = "guia_trimestral_lido";

// ─── Criteria definitions ────────────────────────────────────────────────────

const HARD_SKILLS = [
  { id: "h1", label: "H1 – Qualidade Técnica das Entregas", description: "O código/produto entregue tem qualidade, causa pouco retrabalho e atende os critérios de aceite?" },
  { id: "h2", label: "H2 – Cumprimento de Prazo e Acordos", description: "As sprints e marcos de projeto foram respeitados? Comunicou antecipadamente impedimentos?" },
  { id: "h3", label: "H3 – Domínio de Ferramentas e Processos", description: "Domina as stacks, metodologias e processos internos da Loglab sem suporte básico recorrente?" },
  { id: "h4", label: "H4 – Resolução de Problemas Técnicos", description: "Diagnostica e resolve bugs/desafios com autonomia ou escala de forma estruturada quando necessário?" },
  { id: "h5", label: "H5 – Organização e Gestão do Próprio Trabalho", description: "Prioriza tarefas com lógica, usa as ferramentas da Loglab (Azure DevOps, ServiceNow, Expense, GLPI) e mantém visibilidade do fluxo?" },
];

const SOFT_SKILLS = [
  { id: "s1", label: "S1 – Proatividade e Iniciativa", description: "Antecipa problemas, propõe melhorias e não espera ser acionado para agir?" },
  { id: "s2", label: "S2 – Comunicação Assertiva", description: "Comunica riscos, bloqueios e andamento de forma clara e tempestiva para o time e stakeholders?" },
  { id: "s3", label: "S3 – Colaboração e Integração com Outros Prestadores", description: "Contribui com as empresas, compartilha conhecimento e apoia seus pares sem prejudicar suas próprias entregas?" },
  { id: "s4", label: "S4 – Adaptabilidade e Gestão de Pressão", description: "Mantém qualidade e equilíbrio emocional em mudanças de escopo, prazos curtos ou crises de projeto?" },
  { id: "s5", label: "S5 – Responsabilidade e Comprometimento", description: "Cumpre combinados, participa dos rituais da equipe e assume a responsabilidade sobre suas entregas e resultados?" },
];

const ALL_CRITERIA = [...HARD_SKILLS, ...SOFT_SKILLS];

const BANDS_MAP = {
  immediate_action: "Plano de melhoria estruturado (PIP) com acompanhamento quinzenal e metas claras.",
  attention: "Identificar gargalos específicos. 1:1 focado em desenvolvimento e suporte ativo do gestor.",
  adequate: "Prestador entrega dentro do esperado. Manter consistência e explorar evolução gradual.",
  reference: "Explorar protagonismo, escopo ampliado, projetos estratégicos e renovação contratual diferenciada.",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AvaliacaoTrimestral() {
  const [gestor, setGestor] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [allColaboradores, setAllColaboradores] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showColabModal, setShowColabModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [quarterRef, setQuarterRef] = useState("");
  const [scores, setScores] = useState({});
  const [evidences, setEvidences] = useState({});
  const [evalAction1, setEvalAction1] = useState("");
  const [evalAction2, setEvalAction2] = useState("");
  const [evalAction3, setEvalAction3] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showGuia, setShowGuia] = useState(false);
  const [isFirstTimeGuia, setIsFirstTimeGuia] = useState(false);
  const [dataAvaliacao, setDataAvaliacao] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => { checkAuth(); }, []);

  const [evaluatedIds, setEvaluatedIds] = useState(new Set());

  const checkAuth = async () => {
    const session = localStorage.getItem("gestor_session");
    if (!session) { window.location.href = "/gestorlogin"; return; }
    const sessionData = JSON.parse(session);
    setGestor(sessionData);

    // Mostrar guia automaticamente se não foi lido
    const alreadyRead = localStorage.getItem(GUIA_READ_KEY);
    if (!alreadyRead) {
      setIsFirstTimeGuia(true);
      setShowGuia(true);
    }

    try {
      const [emps, feedbacks] = await Promise.all([
        base44.entities.Colaborador.filter({ manager_id: sessionData.id, status: "active" }),
        base44.entities.FeedbackRecord.filter({ manager_id: sessionData.id })
      ]);
      setEmployees(emps);
      setAllColaboradores(emps); // Gestor só vê seu time

      // Colaboradores já avaliados (trimestral ou 45d) com status concluído/assinado
      const doneStatuses = ["PUBLICADO", "ASSINADO_COLABORADOR", "CONVERSA_REALIZADA", "EM_REVISAO_ADMIN", "APROVADO"];
      const doneTypes = ["evaluation", "experience_45d"];
      const evalDone = new Set(
        feedbacks
          .filter(f => doneTypes.includes(f.feedback_type) && doneStatuses.includes(f.workflow_status))
          .map(f => f.employee_id)
      );
      setEvaluatedIds(evalDone);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ─── Computed values ────────────────────────────────────────────────────────

  const totalScore = useMemo(() => ALL_CRITERIA.reduce((sum, c) => sum + (scores[c.id] || 0), 0), [scores]);
  const filledCount = useMemo(() => ALL_CRITERIA.filter(c => scores[c.id]).length, [scores]);

  const missingEvidences = useMemo(() => {
    return ALL_CRITERIA
      .filter(c => { const s = scores[c.id]; return s && s !== 3 && !evidences[c.id]?.trim(); })
      .map(c => c.id);
  }, [scores, evidences]);

  const hardTotal = HARD_SKILLS.reduce((s, c) => s + (scores[c.id] || 0), 0);
  const softTotal = SOFT_SKILLS.reduce((s, c) => s + (scores[c.id] || 0), 0);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleScoreChange = (id, value) => setScores(prev => ({ ...prev, [id]: value }));
  const handleEvidenceChange = (id, value) => setEvidences(prev => ({ ...prev, [id]: value }));

  const handleSave = async () => {
    setSubmitAttempted(true);
    setError("");
    if (!selectedEmployee) { setError("Selecione o colaborador avaliado."); return; }
    if (!dataAvaliacao) { setError("Informe a data em que a avaliação foi realizada."); return; }
    if (!quarterRef) { setError("Selecione o trimestre de referência."); return; }
    if (filledCount < 10) { setError(`Preencha todos os 10 critérios. Faltam ${10 - filledCount}.`); return; }
    if (missingEvidences.length > 0) {
      setError(`Evidências obrigatórias faltando: ${missingEvidences.map(id => id.toUpperCase()).join(", ")}. Notas 1, 2 e 4 exigem evidência.`);
      return;
    }
    if (!evalAction1.trim()) { setError("Ação Prática 1 é obrigatória."); return; }
    if (!evalAction2.trim()) { setError("Ação Prática 2 é obrigatória."); return; }

    setSaving(true);
    const bandKey = getBandKey(totalScore);
    try {
      await base44.entities.FeedbackRecord.create({
        template_id: "LOGLAB_NS_TRIMESTRAL",
        template_title: "Instrumento de Avaliação de Nível de Serviço — Trimestral",
        feedback_type: "evaluation",
        workflow_status: "EM_REVISAO_ADMIN",
        manager_id: gestor.id,
        manager_name: gestor.full_name,
        employee_id: selectedEmployee.id,
        employee_name: selectedEmployee.full_name,
        employee_email: selectedEmployee.email,
        feedback_date: dataAvaliacao,
        quarter_reference: quarterRef,
        h1_score: scores.h1, h1_evidence: evidences.h1 || "",
        h2_score: scores.h2, h2_evidence: evidences.h2 || "",
        h3_score: scores.h3, h3_evidence: evidences.h3 || "",
        h4_score: scores.h4, h4_evidence: evidences.h4 || "",
        h5_score: scores.h5, h5_evidence: evidences.h5 || "",
        s1_score: scores.s1, s1_evidence: evidences.s1 || "",
        s2_score: scores.s2, s2_evidence: evidences.s2 || "",
        s3_score: scores.s3, s3_evidence: evidences.s3 || "",
        s4_score: scores.s4, s4_evidence: evidences.s4 || "",
        s5_score: scores.s5, s5_evidence: evidences.s5 || "",
        total_score: totalScore,
        performance_band: bandKey,
        recommended_action: BANDS_MAP[bandKey] || "",
        eval_action_1: evalAction1,
        eval_action_2: evalAction2,
        eval_action_3: evalAction3,
      });
      setSaved(true);
      // Notificar admins por e-mail
      base44.functions.invoke("notifyAdminNewEvaluation", {
        managerName: gestor.full_name,
        employeeName: selectedEmployee.full_name,
        appUrl: window.location.origin,
      }).catch(() => {});
      setTimeout(() => { window.location.href = "/gestorfeedbacks"; }, 2500);
    } catch (e) {
      setError("Erro ao salvar a avaliação. Tente novamente.");
      console.error(e);
    } finally { setSaving(false); }
  };

  // ─── Guia handlers ───────────────────────────────────────────────────────────

  const handleMarkGuiaAsRead = () => {
    localStorage.setItem(GUIA_READ_KEY, "true");
    setShowGuia(false);
    setIsFirstTimeGuia(false);
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  // ─── Success state ────────────────────────────────────────────────────────────

  if (saved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="border-0 shadow-xl max-w-sm w-full text-center">
          <CardContent className="py-12 px-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Avaliação Enviada!</h2>
            <p className="text-slate-500 mb-1">Encaminhada para revisão do Admin.</p>
            <p className="text-sm text-slate-400">Redirecionando para seus feedbacks...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor: "#F8B137"}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      {/* ── Guia do Gestor Modal ── */}
      <GuiaGestorTrimestral
        open={showGuia}
        onClose={() => setShowGuia(false)}
        onMarkAsRead={handleMarkGuiaAsRead}
        isFirstTime={isFirstTimeGuia}
      />

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-lg border-b-2 shadow-sm" style={{borderColor: "#F8B137"}}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Instrumento de Avaliação de Nível de Serviço — Trimestral</h1>
            <p className="text-xs text-slate-400">LOGLAB_NS_TRIMESTRAL · Escala par 1–4 (sem ponto neutro) · Soma simples 10–40 pontos</p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => { setIsFirstTimeGuia(false); setShowGuia(true); }}
            className="flex-shrink-0 gap-1.5 font-bold text-xs shadow-sm"
            style={{ background: "#F8B137", color: "#14141E" }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Guia do Gestor
          </Button>
          {filledCount > 0 && (
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-slate-500">{filledCount}/10 critérios</p>
              <p className="text-lg font-black" style={{color: "#F8B137"}}>{totalScore} pts</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">

        {/* ── 1. IDENTIFICATION ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <User className="w-4 h-4" style={{color: "#F8B137"}} />
              Seção 1 – Identificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gestor (readonly) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Gestor (Auto-preenchido)</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-white text-xs font-bold" style={{background: "#14141E"}}>
                      {getInitials(gestor?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{gestor?.full_name}</p>
                    <p className="text-xs text-slate-500">{gestor?.email}</p>
                  </div>
                </div>
              </div>

              {/* Quarter */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Trimestre de Referência *</label>
                <Select value={quarterRef} onValueChange={setQuarterRef}>
                  <SelectTrigger className={`h-[58px] ${submitAttempted && !quarterRef ? "border-red-400" : ""}`}>
                    <SelectValue placeholder="Selecione o trimestre..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q1">Q1 – Janeiro a Março</SelectItem>
                    <SelectItem value="Q2">Q2 – Abril a Junho</SelectItem>
                    <SelectItem value="Q3">Q3 – Julho a Setembro</SelectItem>
                    <SelectItem value="Q4">Q4 – Outubro a Dezembro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date manual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Data da Avaliação *
              </label>
              <p className="text-xs text-slate-400">Informe a data em que a avaliação foi realizada</p>
              <input
                type="date"
                value={dataAvaliacao}
                onChange={(e) => setDataAvaliacao(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F8B137] focus:border-[#F8B137]"
              />
            </div>
              {selectedEmployee && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cargo (Auto)</label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900 text-sm">{selectedEmployee.position || "—"}</p>
                    <p className="text-xs text-slate-500">{selectedEmployee.department || ""}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Employee selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Colaborador Avaliado *</label>
              
              {/* Search + buttons row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar colaborador pelo nome..."
                    className="pl-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setModalSearch(""); setShowColabModal(true); }}
                  className="flex-shrink-0 gap-2"
                >
                  <Users className="w-4 h-4" />
                  Ver todos
                </Button>
              </div>

              {/* Search results */}
              {searchQuery.trim().length > 0 && (() => {
                const results = allColaboradores.filter(e =>
                  e.full_name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                return results.length === 0 ? (
                  <p className="text-sm text-slate-400 py-1 px-1">Nenhum colaborador encontrado.</p>
                ) : (
                  <div className="border rounded-xl overflow-hidden divide-y">
                    {results.map(emp => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => { setSelectedEmployee(emp); setSearchQuery(""); }}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-amber-50 text-left transition-colors"
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs font-bold text-white bg-slate-400">
                            {getInitials(emp.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-sm truncate">{emp.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">{emp.position || emp.department || emp.email}</p>
                        </div>
                        {evaluatedIds.has(emp.id) && (
                          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                        )}
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Selected employee display */}
              {selectedEmployee && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-[#F8B137] bg-amber-50">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className="text-xs font-bold" style={{background: "#F8B137", color: "#14141E"}}>
                      {getInitials(selectedEmployee.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-sm">{selectedEmployee.full_name}</p>
                    <p className="text-xs text-slate-500">{selectedEmployee.position || selectedEmployee.department || selectedEmployee.email}</p>
                  </div>
                  <CheckCircle className="w-4 h-4 flex-shrink-0" style={{color: "#F8B137"}} />
                  <button
                    type="button"
                    onClick={() => setSelectedEmployee(null)}
                    className="text-xs text-slate-400 hover:text-red-500 ml-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {!selectedEmployee && searchQuery.trim().length === 0 && (
                <p className="text-xs text-slate-400">Digite para buscar ou clique em "Ver todos" para listar colaboradores.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── 2. HARD SKILLS ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm" style={{background: "#14141E"}}>H</div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Bloco H – Hard Skills</CardTitle>
                <p className="text-sm text-slate-500">Competências técnicas e de execução (H1 a H5)</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-slate-400">Parcial</p>
                <p className="text-xl font-black text-slate-700">{hardTotal}<span className="text-sm font-normal text-slate-400">/20</span></p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {HARD_SKILLS.map(criterion => (
              <CompetencyCriterion
                key={criterion.id}
                criterion={criterion}
                score={scores[criterion.id]}
                evidence={evidences[criterion.id]}
                onScoreChange={(v) => handleScoreChange(criterion.id, v)}
                onEvidenceChange={(v) => handleEvidenceChange(criterion.id, v)}
                hasError={submitAttempted && missingEvidences.includes(criterion.id)}
              />
            ))}
          </CardContent>
        </Card>

        {/* ── 3. SOFT SKILLS ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style={{background: "#F8B137", color: "#14141E"}}>S</div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Bloco S – Soft Skills</CardTitle>
                <p className="text-sm text-slate-500">Competências comportamentais e relacionais (S1 a S5)</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-slate-400">Parcial</p>
                <p className="text-xl font-black text-slate-700">{softTotal}<span className="text-sm font-normal text-slate-400">/20</span></p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {SOFT_SKILLS.map(criterion => (
              <CompetencyCriterion
                key={criterion.id}
                criterion={criterion}
                score={scores[criterion.id]}
                evidence={evidences[criterion.id]}
                onScoreChange={(v) => handleScoreChange(criterion.id, v)}
                onEvidenceChange={(v) => handleEvidenceChange(criterion.id, v)}
                hasError={submitAttempted && missingEvidences.includes(criterion.id)}
              />
            ))}
          </CardContent>
        </Card>

        {/* ── 4. SCORE SUMMARY ── */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <ClipboardList className="w-3 h-3" /> Seção 4 – Resultado e Faixa de Desempenho (Auto-calculado)
          </p>
          <ScoreSummary totalScore={totalScore} filledCount={filledCount} />
        </div>

        {/* ── 5. ACTION PLAN ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <ChevronRight className="w-4 h-4" style={{color: "#F8B137"}} />
              Seção 5 – Plano de Ação (PDI)
            </CardTitle>
            <p className="text-sm text-slate-500">Defina ações concretas baseadas na avaliação. Ações 1 e 2 são obrigatórias.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: "Ação Prática 1", value: evalAction1, onChange: setEvalAction1, required: true, placeholder: "Ex: Participar de treinamento em Excel avançado até 30/06..." },
              { label: "Ação Prática 2", value: evalAction2, onChange: setEvalAction2, required: true, placeholder: "Ex: Realizar check-in semanal com o gestor para acompanhar entregas..." },
              { label: "Ação Prática 3", value: evalAction3, onChange: setEvalAction3, required: false, placeholder: "Opcional – Ex: Liderar a próxima retrospectiva do time..." },
            ].map(({ label, value, onChange, required, placeholder }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  {label}
                  {required
                    ? <span className="text-red-500 ml-1">*</span>
                    : <Badge variant="outline" className="text-slate-400 border-slate-200 font-normal text-xs ml-1">Opcional</Badge>
                  }
                </label>
                <Textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className={`min-h-[90px] resize-none ${submitAttempted && required && !value.trim() ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {submitAttempted && required && !value.trim() && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{label} é obrigatória.
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Error alert ── */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Missing evidences summary ── */}
        {submitAttempted && missingEvidences.length > 0 && (
          <Alert className="border-amber-300 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Evidências obrigatórias em aberto:</strong>{" "}
              {missingEvidences.map(id => id.toUpperCase()).join(", ")}.{" "}
              Notas 1, 2 e 4 exigem evidência com exemplos concretos.
            </AlertDescription>
          </Alert>
        )}

        {/* ── Modal: Ver todos colaboradores ── */}
        <Dialog open={showColabModal} onOpenChange={setShowColabModal}>
          <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Selecionar Colaborador</DialogTitle>
            </DialogHeader>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Buscar pelo nome..."
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto flex-1 divide-y border rounded-xl">
              {allColaboradores
                .filter(e => e.full_name.toLowerCase().includes(modalSearch.toLowerCase()))
                .map(emp => (
                  <button
                   key={emp.id}
                   type="button"
                   onClick={() => { setSelectedEmployee(emp); setShowColabModal(false); setSearchQuery(""); }}
                   className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-amber-50 text-left transition-colors"
                  >
                   <Avatar className="h-8 w-8 flex-shrink-0">
                     <AvatarFallback className="text-xs font-bold text-white bg-slate-400">
                       {getInitials(emp.full_name)}
                     </AvatarFallback>
                   </Avatar>
                   <div className="min-w-0 flex-1">
                     <p className="font-bold text-slate-900 text-sm truncate">{emp.full_name}</p>
                     <p className="text-xs text-slate-500 truncate">{emp.position || emp.department || emp.email}</p>
                   </div>
                   {evaluatedIds.has(emp.id) && (
                     <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-500" title="Já avaliado" />
                   )}
                   {selectedEmployee?.id === emp.id && (
                     <CheckCircle className="w-4 h-4 flex-shrink-0" style={{color: "#F8B137"}} />
                   )}
                  </button>
                ))
              }
              {allColaboradores.filter(e => e.full_name.toLowerCase().includes(modalSearch.toLowerCase())).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">Nenhum resultado encontrado.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Submit ── */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            Após salvar, a avaliação será encaminhada ao Admin para revisão e aprovação antes de ser publicada ao colaborador.
          </p>
          <div className="flex gap-3 flex-shrink-0">
            <Button variant="outline" onClick={() => window.history.back()} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-8 font-bold shadow-md"
              style={{background: "#F8B137", color: "#14141E"}}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar e Enviar para Revisão"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}