import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CalendarDays, 
  MessageSquare,
  Target,
  TrendingUp,
  XCircle
} from "lucide-react";
import { addDays, differenceInDays, format, parseISO, isValid } from "date-fns";

const SUBMITTED_STATUSES = [
  "EM_REVISAO_ADMIN", "APROVADO", "CONVERSA_AGENDADA",
  "CONVERSA_REALIZADA", "PUBLICADO", "ASSINADO_COLABORADOR"
];

// Utils
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

function getStatusBadge(days, isCompleted, isExempt) {
  if (isCompleted) {
    return <Badge className="bg-emerald-100 text-emerald-700 text-xs">Concluído</Badge>;
  }
  if (isExempt) {
    return <Badge className="bg-slate-100 text-slate-500 text-xs">Isento (Retroativo)</Badge>;
  }
  if (days === null) {
    return <Badge className="bg-slate-100 text-slate-500 text-xs">Aguardando config</Badge>;
  }
  if (days < 0) {
    return <Badge className="bg-red-100 text-red-700 text-xs">Atrasado</Badge>;
  }
  if (days <= 14) {
    return <Badge className="bg-orange-100 text-orange-700 text-xs">Urgente</Badge>;
  }
  return <Badge className="bg-blue-100 text-blue-700 text-xs">Agendado</Badge>;
}

// Componente de Card Individual de Ritual
function RitualCard({ 
  ritual, 
  icon: Icon, 
  title, 
  description, 
  dueDate, 
  daysUntil, 
  isUnique, 
  isCompleted, 
  isExempt,
  completionDate,
  lastCompletedDate,
  totalCompleted,
  useAdmission,
  customStart,
  onToggleAdmission,
  onCustomStartChange,
  onMarkCompleted
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{background: 'rgba(248, 177, 55, 0.1)'}}
            >
              <Icon className="w-5 h-5" style={{color: '#F8B137'}} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-bold text-slate-900">{title}</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
          {getStatusBadge(daysUntil, isCompleted, isExempt)}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Config: Usar admissão */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-700">Usar data de admissão como base</p>
            <p className="text-xs text-slate-400 mt-0.5">
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
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Data de início</Label>
            <Input
              type="date"
              value={customStart || ""}
              onChange={(e) => onCustomStartChange(e.target.value)}
              disabled={isCompleted}
              className="h-8 text-sm"
            />
          </div>
        )}

        {/* Info do próximo */}
        {!isCompleted && !isExempt && dueDate && (
          <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  {isUnique ? "Data prevista" : "Próxima avaliação"}
                </p>
                <p className="text-sm font-bold text-slate-900">{fmt(dueDate)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Prazo</p>
                <p className={`text-sm font-bold ${
                  daysUntil < 0 ? 'text-red-600' : 
                  daysUntil <= 14 ? 'text-orange-600' : 
                  'text-blue-600'
                }`}>
                  {getDaysLabel(daysUntil)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rituais únicos: botão de marcar como concluído */}
        {isUnique && !isCompleted && !isExempt && (
          <Button
            size="sm"
            variant="outline"
            onClick={onMarkCompleted}
            className="w-full text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Marcar como Concluído
          </Button>
        )}

        {/* Info de conclusão */}
        {isCompleted && (
          <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50">
            <p className="text-xs text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
              {isUnique ? 'Marcado como concluído' : 'Concluído'}
            </p>
          </div>
        )}

        {/* Info de isenção */}
        {isExempt && (
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-600">
              <XCircle className="w-3.5 h-3.5 inline mr-1" />
              Ritual isento - data prevista já passou sem registro de avaliação
            </p>
          </div>
        )}

        {/* Histórico (rituais recorrentes) */}
        {!isUnique && totalCompleted > 0 && (
          <div className="p-2.5 rounded-lg bg-slate-50">
            <p className="text-xs text-slate-600">
              Última conclusão: <strong>{fmt(parseSafeDate(lastCompletedDate))}</strong>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Total de avaliações realizadas: {totalCompleted}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RotinasAvaliacaoRefatorada({ 
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

  const has45Record = feedbackRecords.some(
    r => r.feedback_type === "experience_45d" && 
         SUBMITTED_STATUSES.includes(r.workflow_status)
  );
  const is45Completed = cfg45.completed_manual || has45Record;
  const is45Exempt = !is45Completed && due45 && differenceInDays(today, due45) > 0;

  const actual45CompletionDate = cfg45.completed_manual 
    ? cfg45.completion_date 
    : feedbackRecords.find(r => r.feedback_type === "experience_45d")?.employee_validation_date;

  // ══════════════════════════════════════════════════════════════
  // RITUAL 90 DIAS
  // ══════════════════════════════════════════════════════════════
  const cfg90 = ritual90dConfig || {};
  const records90 = feedbackRecords
    .filter(r => r.feedback_type === "experience_90d" && SUBMITTED_STATUSES.includes(r.workflow_status))
    .sort((a, b) => new Date(b.employee_validation_date || b.feedback_date) - new Date(a.employee_validation_date || a.feedback_date));
  const last90 = records90[0];
  const last90Date = last90 ? parseSafeDate(last90.employee_validation_date || last90.feedback_date) : null;

  const base90 = last90Date 
    ? last90Date 
    : (cfg90.use_admission ? parseSafeDate(admissionDate) : parseSafeDate(cfg90.custom_start));
  const due90 = base90 ? addDays(base90, 90) : null;
  const days90 = due90 ? differenceInDays(due90, today) : null;

  const has90Record = records90.length > 0;
  const is90Completed = cfg90.completed_manual || has90Record;
  const is90Exempt = !is90Completed && due90 && differenceInDays(today, due90) > 0;

  const actual90CompletionDate = cfg90.completed_manual 
    ? cfg90.completion_date 
    : last90?.employee_validation_date;

  // ══════════════════════════════════════════════════════════════
  // RITUAL TRIMESTRAL
  // ══════════════════════════════════════════════════════════════
  const cfgTri = ritualTriConfig || {};
  const recordsTri = feedbackRecords
    .filter(r => r.feedback_type === "evaluation" && SUBMITTED_STATUSES.includes(r.workflow_status))
    .sort((a, b) => new Date(b.employee_validation_date || b.feedback_date) - new Date(a.employee_validation_date || a.feedback_date));
  const lastTri = recordsTri[0];
  const lastTriDate = lastTri ? parseSafeDate(lastTri.employee_validation_date || lastTri.feedback_date) : null;

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
    .filter(r => r.feedback_type === "one_on_one" && SUBMITTED_STATUSES.includes(r.workflow_status))
    .sort((a, b) => new Date(b.employee_validation_date || b.feedback_date) - new Date(a.employee_validation_date || a.feedback_date));
  const last1on1 = records1on1[0];
  const last1on1Date = last1on1 ? parseSafeDate(last1on1.employee_validation_date || last1on1.feedback_date) : null;

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
  };

  const handleMark90Completed = async () => {
    await onUpdateRitual?.({
      ritual_90d_completed_manual: true
    });
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-64 rounded-xl border bg-slate-50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      
      {/* Ritual 45 Dias */}
      <RitualCard
        ritual="45d"
        icon={Target}
        title="Avaliação de Experiência — 45 Dias"
        description="Ritual único · Ocorre uma vez após admissão"
        dueDate={due45}
        daysUntil={days45}
        isUnique={true}
        isCompleted={is45Completed}
        isExempt={is45Exempt}
        completionDate={actual45CompletionDate}
        useAdmission={cfg45.use_admission ?? true}
        customStart={cfg45.custom_start}
        onToggleAdmission={(val) => onUpdateRitual?.({ ritual_45d_use_admission: val })}
        onCustomStartChange={(val) => onUpdateRitual?.({ ritual_45d_custom_start: val || null })}
        onMarkCompleted={handleMark45Completed}
      />

      {/* Ritual 90 Dias */}
      <RitualCard
        ritual="90d"
        icon={TrendingUp}
        title="Avaliação de Qualidade de Serviço — 90 Dias"
        description="Ritual único · Inclui decisão contratual"
        dueDate={due90}
        daysUntil={days90}
        isUnique={true}
        isCompleted={is90Completed}
        isExempt={is90Exempt}
        completionDate={actual90CompletionDate}
        useAdmission={cfg90.use_admission ?? true}
        customStart={cfg90.custom_start}
        onToggleAdmission={(val) => onUpdateRitual?.({ ritual_90d_use_admission: val })}
        onCustomStartChange={(val) => onUpdateRitual?.({ ritual_90d_custom_start: val || null })}
        onMarkCompleted={handleMark90Completed}
      />

      {/* Ritual Trimestral */}
      <RitualCard
        ritual="trimestral"
        icon={CalendarDays}
        title="Instrumento de Nível de Serviço — Trimestral"
        description="Recorrente · A cada 90 dias"
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
      />

      {/* Ritual 1:1 */}
      <RitualCard
        ritual="1on1"
        icon={MessageSquare}
        title="Registro de 1:1 — Conversa de Alinhamento"
        description="Recorrente · Bimestral (a cada 60 dias)"
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
      />

    </div>
  );
}