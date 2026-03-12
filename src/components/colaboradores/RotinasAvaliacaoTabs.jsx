import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DateInput } from "@/components/ui/date-input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CalendarDays, 
  MessageSquare,
  Target,
  TrendingUp,
  XCircle,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { addDays, differenceInDays, format, parseISO, isValid } from "date-fns";
import { useNavigate } from "react-router-dom";

const SUBMITTED_STATUSES = [
  "EM_REVISAO_ADMIN", "APROVADO", "CONVERSA_AGENDADA",
  "CONVERSA_REALIZADA", "PUBLICADO", "ASSINADO_COLABORADOR"
];

const STATUS_CONFIG = {
  DISPONIVEL_PARA_GESTOR: { label: "Aguardando gestor", color: "bg-slate-100 text-slate-700" },
  EM_REVISAO_ADMIN: { label: "Em revisão", color: "bg-amber-100 text-amber-700" },
  APROVADO: { label: "Aprovado", color: "bg-blue-100 text-blue-700" },
  CONVERSA_AGENDADA: { label: "Conversa agendada", color: "bg-blue-100 text-blue-700" },
  CONVERSA_REALIZADA: { label: "Conversa realizada", color: "bg-blue-100 text-blue-700" },
  PUBLICADO: { label: "Publicado", color: "bg-blue-100 text-blue-700" },
  ASSINADO_COLABORADOR: { label: "Concluído e assinado", color: "bg-emerald-100 text-emerald-700" }
};

const BAND_CONFIG = {
  immediate_action: { label: "Ação Imediata", color: "bg-red-100 text-red-700" },
  attention: { label: "Atenção", color: "bg-orange-100 text-orange-700" },
  adequate: { label: "Adequado", color: "bg-blue-100 text-blue-700" },
  reference: { label: "Referência", color: "bg-emerald-100 text-emerald-700" }
};

function fmt(d) {
  if (!d || !isValid(d)) return "–";
  return format(d, "dd/MM/yyyy");
}

function parseSafeDate(str) {
  if (!str) return null;
  try {
    const d = parseISO(str);
    return isValid(d) ? d : null;
  } catch { return null; }
}

function getDaysLabel(days) {
  if (days === null || days === undefined) return "–";
  if (days < 0) return `${Math.abs(days)}d atrasado`;
  if (days === 0) return "Vence hoje";
  return `Em ${days} dias`;
}

function getTabBadge(days, isCompleted, isExempt) {
  if (isCompleted) {
    return <Badge className="ml-2 bg-emerald-100 text-emerald-700 text-xs">Concluído</Badge>;
  }
  if (isExempt) {
    return <Badge className="ml-2 bg-slate-100 text-slate-500 text-xs">Isento</Badge>;
  }
  if (days === null) {
    return <Badge className="ml-2 bg-slate-100 text-slate-500 text-xs">Pendente</Badge>;
  }
  if (days < 0) {
    return <Badge className="ml-2 bg-red-100 text-red-700 text-xs">Vencido</Badge>;
  }
  return <Badge className="ml-2 bg-blue-100 text-blue-700 text-xs">Agendado</Badge>;
}

function HistoricoItem({ avaliacao, onViewDetails }) {
  const statusCfg = STATUS_CONFIG[avaliacao.workflow_status] || {};
  const isConcluido = avaliacao.workflow_status === "ASSINADO_COLABORADOR";
  
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900">
                Criado em {fmt(parseSafeDate(avaliacao.feedback_date))}
              </span>
              <Badge className={statusCfg.color + " text-xs"}>
                {statusCfg.label}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              {isConcluido 
                ? `Concluído em ${fmt(parseSafeDate(avaliacao.employee_validation_date))}`
                : "Em andamento"}
            </p>
            <p className="text-xs text-slate-500">
              Gestor: <strong>{avaliacao.manager_name}</strong>
            </p>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onViewDetails(avaliacao.id)}
            className="text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1" />
            Ver detalhes
          </Button>
        </div>

        {/* Informações específicas por tipo */}
        <div className="flex flex-wrap gap-2 mt-2">
          {/* 45 e 90 Dias */}
          {(avaliacao.feedback_type === "experience_45d" || avaliacao.feedback_type === "experience_90d") && (
            <>
              {avaliacao.exp45_average && (
                <Badge variant="outline" className="text-xs">
                  Média: {Number(avaliacao.exp45_average).toFixed(2)}
                </Badge>
              )}
              {avaliacao.qs90_average && (
                <Badge variant="outline" className="text-xs">
                  Média: {Number(avaliacao.qs90_average).toFixed(2)}
                </Badge>
              )}
              {avaliacao.exp45_scores && (
                <Badge variant="outline" className="text-xs">
                  NO: {Object.values(avaliacao.exp45_scores).filter(v => v === "NO").length}
                </Badge>
              )}
              {avaliacao.qs90_scores && (
                <Badge variant="outline" className="text-xs">
                  NO: {Object.values(avaliacao.qs90_scores).filter(v => v === "NO").length}
                </Badge>
              )}
            </>
          )}

          {/* 90 Dias - Decisão Contratual */}
          {avaliacao.feedback_type === "experience_90d" && avaliacao.qs90_decision && (
            <Badge className={avaliacao.qs90_decision === "encerramento" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}>
              {avaliacao.qs90_decision === "encerramento" ? "Encerramento Contratual" : "Continuidade"}
            </Badge>
          )}

          {/* Trimestral */}
          {avaliacao.feedback_type === "evaluation" && (
            <>
              {avaliacao.total_score && (
                <Badge variant="outline" className="text-xs font-bold">
                  {avaliacao.total_score} pts
                </Badge>
              )}
              {avaliacao.performance_band && BAND_CONFIG[avaliacao.performance_band] && (
                <Badge className={BAND_CONFIG[avaliacao.performance_band].color + " text-xs"}>
                  {BAND_CONFIG[avaliacao.performance_band].label}
                </Badge>
              )}
              {(avaliacao.eval_action_1 || avaliacao.eval_action_2 || avaliacao.eval_action_3) && (
                <Badge variant="outline" className="text-xs">
                  {[avaliacao.eval_action_1, avaliacao.eval_action_2, avaliacao.eval_action_3].filter(Boolean).length} ações
                </Badge>
              )}
            </>
          )}

          {/* 1:1 */}
          {avaliacao.feedback_type === "one_on_one" && (
            <>
              {avaliacao.has_critical_impediment && (
                <Badge className="bg-red-100 text-red-700 text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Impedimento Crítico
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                Prestador ciente: {isConcluido ? "Sim" : "Não"}
              </Badge>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RitualTabContent({ 
  ritual,
  dueDate, 
  daysUntil, 
  isUnique, 
  isCompleted, 
  isExempt,
  lastCompletedDate,
  totalCompleted,
  useAdmission,
  customStart,
  onToggleAdmission,
  onCustomStartChange,
  onMarkCompleted,
  prestadorId,
  feedbackType
}) {
  const navigate = useNavigate();
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    loadHistorico();
  }, [prestadorId, feedbackType]);

  const loadHistorico = async () => {
    setLoadingHistorico(true);
    try {
      const records = await base44.entities.FeedbackRecord.filter({ 
        employee_id: prestadorId,
        feedback_type: feedbackType
      });
      const sorted = records
        .filter(r => SUBMITTED_STATUSES.includes(r.workflow_status))
        .sort((a, b) => new Date(b.feedback_date) - new Date(a.feedback_date));
      setHistorico(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const handleViewDetails = (feedbackId) => {
    navigate(`/RevisarFeedback?id=${feedbackId}`);
  };

  return (
    <div className="space-y-6">
      {/* SEÇÃO 1: Configuração do Ritual */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Configuração do Ritual</h3>
        
        {/* Toggle usar admissão */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">Usar data de admissão como base</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {useAdmission ? "Ativo" : "Customizado"}
            </p>
          </div>
          <Switch
            checked={useAdmission}
            onCheckedChange={onToggleAdmission}
            disabled={isCompleted}
          />
        </div>

        {/* Data customizada */}
        {!useAdmission && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Data de início</Label>
            <DateInput
              value={customStart || ""}
              onChange={onCustomStartChange}
              disabled={isCompleted}
            />
          </div>
        )}

        {/* Status atual */}
        {!isCompleted && !isExempt && dueDate && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">
                    {isUnique ? "Data prevista" : "Próxima avaliação"}
                  </p>
                  <p className="text-base font-bold text-slate-900">{fmt(dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Prazo</p>
                  <p className={`text-base font-bold ${
                    daysUntil < 0 ? 'text-red-600' : 
                    daysUntil <= 14 ? 'text-orange-600' : 
                    'text-blue-600'
                  }`}>
                    {getDaysLabel(daysUntil)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão marcar concluído (únicos) */}
        {isUnique && !isCompleted && !isExempt && onMarkCompleted && (
          <Button
            size="sm"
            variant="outline"
            onClick={onMarkCompleted}
            className="w-full"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Marcar como Concluído
          </Button>
        )}

        {/* Info conclusão */}
        {isCompleted && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-3">
              <p className="text-sm text-emerald-700 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isUnique ? 'Marcado como concluído' : 'Concluído'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info isenção */}
        {isExempt && (
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="p-3">
              <p className="text-sm text-slate-600 flex items-center">
                <XCircle className="w-4 h-4 mr-2" />
                Ritual isento - data prevista já passou sem registro
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* SEÇÃO 2: Histórico de Avaliações */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Histórico de Avaliações ({historico.length})
        </h3>

        {loadingHistorico ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : historico.length === 0 ? (
          <Card className="border-0 shadow-sm bg-slate-50">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-slate-500">
                Nenhuma avaliação registrada para este ritual.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {historico.map(avaliacao => (
              <HistoricoItem 
                key={avaliacao.id}
                avaliacao={avaliacao}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RotinasAvaliacaoTabs({ 
  prestadorId, 
  admissionDate,
  ritual45dConfig,
  ritual90dConfig,
  ritualTriConfig,
  ritual1on1Config,
  onUpdateRitual
}) {
  const [feedbackRecords, setFeedbackRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prestadorId) {
      loadRecords();
    }
  }, [prestadorId]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const records = await base44.entities.FeedbackRecord.filter({ 
        employee_id: prestadorId 
      });
      setFeedbackRecords(records);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ══════════════════════════════════════════════════════════════
  // RITUAL 45 DIAS
  // ══════════════════════════════════════════════════════════════
  const cfg45 = ritual45dConfig || {};
  const base45 = cfg45.use_admission 
    ? parseSafeDate(admissionDate) 
    : parseSafeDate(cfg45.custom_start);
  const due45 = base45 ? addDays(base45, 45) : null;
  const days45 = due45 ? differenceInDays(due45, today) : null;

  const records45 = feedbackRecords
    .filter(r => r.feedback_type === "experience_45d" && r.workflow_status === "ASSINADO_COLABORADOR")
    .sort((a, b) => new Date(b.employee_validation_date || 0) - new Date(a.employee_validation_date || 0));
  const last45 = records45[0];
  const has45Record = records45.length > 0;
  const is45Completed = cfg45.completed_manual || has45Record;
  const is45Exempt = !is45Completed && due45 && differenceInDays(today, due45) > 0;
  const last45Date = last45 ? parseSafeDate(last45.employee_validation_date) : null;

  // ══════════════════════════════════════════════════════════════
  // RITUAL 90 DIAS
  // ══════════════════════════════════════════════════════════════
  const cfg90 = ritual90dConfig || {};
  const records90 = feedbackRecords
    .filter(r => r.feedback_type === "experience_90d" && r.workflow_status === "ASSINADO_COLABORADOR")
    .sort((a, b) => new Date(b.employee_validation_date || 0) - new Date(a.employee_validation_date || 0));
  const last90 = records90[0];
  const last90Date = last90 ? parseSafeDate(last90.employee_validation_date) : null;

  const base90 = last90Date 
    ? last90Date 
    : (cfg90.use_admission ? parseSafeDate(admissionDate) : parseSafeDate(cfg90.custom_start));
  const due90 = base90 ? addDays(base90, 90) : null;
  const days90 = due90 ? differenceInDays(due90, today) : null;

  const has90Record = records90.length > 0;
  const is90Completed = cfg90.completed_manual || has90Record;
  const is90Exempt = !is90Completed && due90 && differenceInDays(today, due90) > 0;

  // ══════════════════════════════════════════════════════════════
  // RITUAL TRIMESTRAL
  // ══════════════════════════════════════════════════════════════
  const cfgTri = ritualTriConfig || {};
  const recordsTri = feedbackRecords
    .filter(r => r.feedback_type === "evaluation" && r.workflow_status === "ASSINADO_COLABORADOR")
    .sort((a, b) => new Date(b.employee_validation_date || 0) - new Date(a.employee_validation_date || 0));
  const lastTri = recordsTri[0];
  const lastTriDate = lastTri ? parseSafeDate(lastTri.employee_validation_date) : null;

  const baseTri = lastTriDate 
    ? lastTriDate 
    : (cfgTri.use_admission ? parseSafeDate(admissionDate) : parseSafeDate(cfgTri.custom_start));
  const dueTri = baseTri ? addDays(baseTri, 90) : null;
  const daysTri = dueTri ? differenceInDays(dueTri, today) : null;

  // ══════════════════════════════════════════════════════════════
  // RITUAL 1:1
  // ══════════════════════════════════════════════════════════════
  const cfg1on1 = ritual1on1Config || {};
  const records1on1 = feedbackRecords
    .filter(r => r.feedback_type === "one_on_one" && r.workflow_status === "ASSINADO_COLABORADOR")
    .sort((a, b) => new Date(b.employee_validation_date || 0) - new Date(a.employee_validation_date || 0));
  const last1on1 = records1on1[0];
  const last1on1Date = last1on1 ? parseSafeDate(last1on1.employee_validation_date) : null;

  const base1on1 = last1on1Date 
    ? last1on1Date 
    : (cfg1on1.use_admission ? parseSafeDate(admissionDate) : parseSafeDate(cfg1on1.custom_start));
  const due1on1 = base1on1 ? addDays(base1on1, 60) : null;
  const days1on1 = due1on1 ? differenceInDays(due1on1, today) : null;

  // ══════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════
  const handleMark45Completed = async () => {
    await onUpdateRitual?.({
      ritual_45d_completed_manual: true
    });
    loadRecords();
  };

  const handleMark90Completed = async () => {
    await onUpdateRitual?.({
      ritual_90d_completed_manual: true
    });
    loadRecords();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="45d" className="w-full">
      <TabsList className="w-full grid grid-cols-4 mb-6">
        <TabsTrigger value="45d" className="text-xs sm:text-sm">
          45 Dias
          {getTabBadge(days45, is45Completed, is45Exempt)}
        </TabsTrigger>
        <TabsTrigger value="90d" className="text-xs sm:text-sm">
          90 Dias
          {getTabBadge(days90, is90Completed, is90Exempt)}
        </TabsTrigger>
        <TabsTrigger value="tri" className="text-xs sm:text-sm">
          Trimestral
          {getTabBadge(daysTri, false, false)}
        </TabsTrigger>
        <TabsTrigger value="1on1" className="text-xs sm:text-sm">
          1:1 Bimestral
          {getTabBadge(days1on1, false, false)}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="45d">
        <RitualTabContent
          ritual="45d"
          dueDate={due45}
          daysUntil={days45}
          isUnique={true}
          isCompleted={is45Completed}
          isExempt={is45Exempt}
          lastCompletedDate={last45Date}
          totalCompleted={records45.length}
          useAdmission={cfg45.use_admission ?? true}
          customStart={cfg45.custom_start}
          onToggleAdmission={(val) => onUpdateRitual?.({ ritual_45d_use_admission: val })}
          onCustomStartChange={(val) => onUpdateRitual?.({ ritual_45d_custom_start: val || null })}
          onMarkCompleted={handleMark45Completed}
          prestadorId={prestadorId}
          feedbackType="experience_45d"
        />
      </TabsContent>

      <TabsContent value="90d">
        <RitualTabContent
          ritual="90d"
          dueDate={due90}
          daysUntil={days90}
          isUnique={true}
          isCompleted={is90Completed}
          isExempt={is90Exempt}
          lastCompletedDate={last90Date}
          totalCompleted={records90.length}
          useAdmission={cfg90.use_admission ?? true}
          customStart={cfg90.custom_start}
          onToggleAdmission={(val) => onUpdateRitual?.({ ritual_90d_use_admission: val })}
          onCustomStartChange={(val) => onUpdateRitual?.({ ritual_90d_custom_start: val || null })}
          onMarkCompleted={handleMark90Completed}
          prestadorId={prestadorId}
          feedbackType="experience_90d"
        />
      </TabsContent>

      <TabsContent value="tri">
        <RitualTabContent
          ritual="tri"
          dueDate={dueTri}
          daysUntil={daysTri}
          isUnique={false}
          isCompleted={false}
          isExempt={false}
          lastCompletedDate={lastTriDate}
          totalCompleted={recordsTri.length}
          useAdmission={cfgTri.use_admission ?? true}
          customStart={cfgTri.custom_start}
          onToggleAdmission={(val) => onUpdateRitual?.({ ritual_trimestral_use_admission: val })}
          onCustomStartChange={(val) => onUpdateRitual?.({ ritual_trimestral_custom_start: val || null })}
          prestadorId={prestadorId}
          feedbackType="evaluation"
        />
      </TabsContent>

      <TabsContent value="1on1">
        <RitualTabContent
          ritual="1on1"
          dueDate={due1on1}
          daysUntil={days1on1}
          isUnique={false}
          isCompleted={false}
          isExempt={false}
          lastCompletedDate={last1on1Date}
          totalCompleted={records1on1.length}
          useAdmission={cfg1on1.use_admission ?? true}
          customStart={cfg1on1.custom_start}
          onToggleAdmission={(val) => onUpdateRitual?.({ ritual_1on1_use_admission: val })}
          onCustomStartChange={(val) => onUpdateRitual?.({ ritual_1on1_custom_start: val || null })}
          prestadorId={prestadorId}
          feedbackType="one_on_one"
        />
      </TabsContent>
    </Tabs>
  );
}