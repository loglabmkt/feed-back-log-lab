import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, Clock, AlertCircle, CalendarDays, MessageSquare } from "lucide-react";
import { addDays, addMonths, differenceInDays, format, parseISO, isValid } from "date-fns";

const SUBMITTED_STATUSES = [
  "EM_REVISAO_ADMIN", "APROVADO", "CONVERSA_AGENDADA",
  "CONVERSA_REALIZADA", "PUBLICADO", "ASSINADO_COLABORADOR"
];

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

function getCardClass(days, done) {
  if (done) return "border-emerald-200 bg-emerald-50";
  if (days === null) return "border-slate-200 bg-slate-50 opacity-60";
  if (days < 0) return "border-red-200 bg-red-50";
  if (days <= 14) return "border-orange-200 bg-orange-50";
  return "border-slate-200 bg-slate-50";
}

function getBadgeClass(days, done) {
  if (done) return "bg-emerald-100 text-emerald-700";
  if (days === null) return "bg-slate-100 text-slate-500";
  if (days < 0) return "bg-red-100 text-red-700";
  if (days <= 14) return "bg-orange-100 text-orange-700";
  return "bg-blue-100 text-blue-700";
}

// Determina se deve usar admissão como padrão (quando não há config salva)
function deriveDefaultUseAdmission(admissionDate) {
  if (!admissionDate) return false;
  const adm = parseSafeDate(admissionDate);
  if (!adm) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Se a data de admissão é hoje ou no futuro → usa admissão. Se no passado → desliga (contexto de implantação).
  return differenceInDays(adm, today) >= 0;
}

export default function RotinasAvaliacao({
  admissionDate,
  employeeId,
  eval45dCompleted,
  onMark45dDone,
  useAdmissionForSchedule,
  scheduleStartDate,
  onScheduleConfigChange
}) {
  const [feedbackRecords, setFeedbackRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estado local controlado pelas props do pai
  const [localUseAdmission, setLocalUseAdmission] = useState(() => {
    if (useAdmissionForSchedule !== undefined && useAdmissionForSchedule !== null) {
      return useAdmissionForSchedule;
    }
    return deriveDefaultUseAdmission(admissionDate);
  });
  const [localStartDate, setLocalStartDate] = useState(scheduleStartDate || "");

  // Sincroniza quando o pai atualiza as props (ex: abre dialog para outro colaborador)
  useEffect(() => {
    const newUse = (useAdmissionForSchedule !== undefined && useAdmissionForSchedule !== null)
      ? useAdmissionForSchedule
      : deriveDefaultUseAdmission(admissionDate);
    setLocalUseAdmission(newUse);
    setLocalStartDate(scheduleStartDate || "");
  }, [useAdmissionForSchedule, scheduleStartDate]);

  // Quando admission_date muda e não há config explícita salva, re-calcula default
  useEffect(() => {
    if (useAdmissionForSchedule === undefined || useAdmissionForSchedule === null) {
      setLocalUseAdmission(deriveDefaultUseAdmission(admissionDate));
    }
  }, [admissionDate]);

  // Carrega registros quando employeeId muda
  useEffect(() => {
    if (employeeId) {
      loadRecords();
    } else {
      setFeedbackRecords([]);
    }
  }, [employeeId]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const records = await base44.entities.FeedbackRecord.filter({ employee_id: employeeId });
      setFeedbackRecords(records);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChange = (val) => {
    setLocalUseAdmission(val);
    onScheduleConfigChange?.({
      use_admission_for_schedule: val,
      schedule_start_date: localStartDate || null
    });
  };

  const handleStartDateChange = (val) => {
    setLocalStartDate(val);
    onScheduleConfigChange?.({
      use_admission_for_schedule: localUseAdmission,
      schedule_start_date: val || null
    });
  };

  // ── Determina data base ──
  let baseDate = null;
  if (localUseAdmission) {
    baseDate = parseSafeDate(admissionDate);
  } else {
    baseDate = parseSafeDate(localStartDate);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Cálculos de cada rotina ──

  // 45 Dias (única)
  const due45d = baseDate ? addDays(baseDate, 45) : null;
  const days45d = due45d ? differenceInDays(due45d, today) : null;
  const has45dRecord = feedbackRecords.some(r => r.feedback_type === "experience_45d");
  const is45dDone = has45dRecord || eval45dCompleted;

  // 90 Dias (a cada 90 dias)
  const records90d = feedbackRecords
    .filter(r => r.feedback_type === "experience_90d" && SUBMITTED_STATUSES.includes(r.workflow_status))
    .sort((a, b) => new Date(b.feedback_date) - new Date(a.feedback_date));
  const last90d = records90d[0];
  const base90d = last90d ? parseSafeDate(last90d.feedback_date) : baseDate;
  const due90d = base90d ? addDays(base90d, 90) : null;
  const days90d = due90d ? differenceInDays(due90d, today) : null;

  // Trimestral (a cada 3 meses)
  const recordsTrimestral = feedbackRecords
    .filter(r => r.feedback_type === "evaluation" && SUBMITTED_STATUSES.includes(r.workflow_status))
    .sort((a, b) => new Date(b.feedback_date) - new Date(a.feedback_date));
  const lastTrimestral = recordsTrimestral[0];
  const baseTrimestral = lastTrimestral ? parseSafeDate(lastTrimestral.feedback_date) : baseDate;
  const dueTrimestral = baseTrimestral ? addMonths(baseTrimestral, 3) : null;
  const daysTrimestral = dueTrimestral ? differenceInDays(dueTrimestral, today) : null;

  // 1:1 Bimestral (a cada 2 meses)
  const records1on1 = feedbackRecords
    .filter(r => r.feedback_type === "one_on_one" && SUBMITTED_STATUSES.includes(r.workflow_status))
    .sort((a, b) => new Date(b.feedback_date) - new Date(a.feedback_date));
  const last1on1 = records1on1[0];
  const base1on1 = last1on1 ? parseSafeDate(last1on1.feedback_date) : baseDate;
  const due1on1 = base1on1 ? addMonths(base1on1, 2) : null;
  const days1on1 = due1on1 ? differenceInDays(due1on1, today) : null;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 rounded-xl border-2 border-slate-100 bg-slate-50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* ── Configuração da data base ── */}
      <div className="p-3 rounded-xl border-2 border-slate-200 bg-white space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800">Usar data de admissão como base</p>
            <p className="text-xs text-slate-400 leading-tight mt-0.5">
              {admissionDate
                ? `Admissão: ${admissionDate.split('-').reverse().join('/')}`
                : "Nenhuma data de admissão cadastrada"
              }
            </p>
          </div>
          <Switch
            checked={localUseAdmission}
            onCheckedChange={handleToggleChange}
            disabled={!admissionDate}
          />
        </div>

        {localUseAdmission && admissionDate && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
            Base: <strong>{admissionDate.split('-').reverse().join('/')}</strong> (admissão)
          </div>
        )}

        {!localUseAdmission && (
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-700 font-semibold">
              Data de início do cronograma
            </Label>
            <Input
              type="date"
              value={localStartDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="h-8 text-sm"
            />
            {!localStartDate ? (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                ⚠ Informe uma data de início para calcular os prazos
              </p>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg">
                <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                Base: <strong>{localStartDate.split('-').reverse().join('/')}</strong> (data de start)
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sem data base configurada ── */}
      {!baseDate ? (
        <div className="flex items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl min-h-[160px]">
          <div className="text-center text-slate-400">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium text-slate-500">Cronograma indisponível</p>
            <p className="text-xs mt-1">
              {!localUseAdmission
                ? "Informe uma data de início para visualizar os prazos"
                : "Cadastre a data de admissão para calcular os ciclos"
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">

          {/* ── 45 Dias ── */}
          <div className={`p-3.5 rounded-xl border-2 transition-colors ${getCardClass(days45d, is45dDone)}`}>
            <div className="flex items-center gap-2 mb-1">
              {is45dDone
                ? <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                : (days45d ?? 0) < 0
                ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                : <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              }
              <p className="text-sm font-bold text-slate-900 flex-1">Avaliação 45 Dias</p>
              <Badge className={`text-xs flex-shrink-0 ${getBadgeClass(days45d, is45dDone)}`}>
                {is45dDone ? "Concluída" : getDaysLabel(days45d)}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">Única obrigatória · Prazo: {fmt(due45d)}</p>
            {is45dDone && !has45dRecord && <p className="text-xs text-emerald-600 mt-0.5">✓ Marcada manualmente como concluída</p>}
            {is45dDone && has45dRecord && <p className="text-xs text-emerald-600 mt-0.5">✓ Avaliação registrada no sistema</p>}
            {!is45dDone && (
              <Button
                size="sm"
                variant="outline"
                onClick={onMark45dDone}
                className="mt-2 w-full text-xs h-7 border-slate-300 hover:bg-white"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Marcar como Concluída
              </Button>
            )}
          </div>

          {/* ── 90 Dias ── */}
          <div className={`p-3.5 rounded-xl border-2 transition-colors ${getCardClass(days90d, false)}`}>
            <div className="flex items-center gap-2 mb-1">
              {(days90d ?? 0) < 0
                ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                : <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              }
              <p className="text-sm font-bold text-slate-900 flex-1">Avaliação de 90 Dias</p>
              <Badge className={`text-xs flex-shrink-0 ${getBadgeClass(days90d, false)}`}>
                {getDaysLabel(days90d)}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              A cada 90 dias · {last90d ? `Próxima: ${fmt(due90d)}` : `1ª avaliação: ${fmt(due90d)}`}
            </p>
            {last90d && (
              <p className="text-xs text-slate-400 mt-0.5">
                Última: {fmt(parseSafeDate(last90d.feedback_date))} · {records90d.length} realizada(s)
              </p>
            )}
          </div>

          {/* ── Trimestral ── */}
          <div className={`p-3.5 rounded-xl border-2 transition-colors ${getCardClass(daysTrimestral, false)}`}>
            <div className="flex items-center gap-2 mb-1">
              {(daysTrimestral ?? 0) < 0
                ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                : <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              }
              <p className="text-sm font-bold text-slate-900 flex-1">Avaliação Trimestral</p>
              <Badge className={`text-xs flex-shrink-0 ${getBadgeClass(daysTrimestral, false)}`}>
                {getDaysLabel(daysTrimestral)}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              A cada 3 meses · {lastTrimestral ? `Próxima: ${fmt(dueTrimestral)}` : `1ª avaliação: ${fmt(dueTrimestral)}`}
            </p>
            {lastTrimestral && (
              <p className="text-xs text-slate-400 mt-0.5">
                Última: {fmt(parseSafeDate(lastTrimestral.feedback_date))} · {recordsTrimestral.length} realizada(s)
              </p>
            )}
          </div>

          {/* ── 1:1 Bimestral ── */}
          <div className={`p-3.5 rounded-xl border-2 transition-colors ${getCardClass(days1on1, false)}`}>
            <div className="flex items-center gap-2 mb-1">
              {(days1on1 ?? 0) < 0
                ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                : <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
              }
              <p className="text-sm font-bold text-slate-900 flex-1">Registro de 1:1</p>
              <Badge className={`text-xs flex-shrink-0 ${getBadgeClass(days1on1, false)}`}>
                {getDaysLabel(days1on1)}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Conversa de Alinhamento · Bimestral (a cada 2 meses) · {last1on1 ? `Próximo: ${fmt(due1on1)}` : `1º registro: ${fmt(due1on1)}`}
            </p>
            {last1on1 && (
              <p className="text-xs text-slate-400 mt-0.5">
                Último: {fmt(parseSafeDate(last1on1.feedback_date))} · {records1on1.length} realizado(s)
              </p>
            )}
          </div>

        </div>
      )}

      {/* Rodapé informativo */}
      {baseDate && (
        <p className="text-xs text-slate-400 text-center pt-0.5">
          Prazos calculados a partir de{" "}
          <strong>{fmt(baseDate)}</strong>{" "}
          ({localUseAdmission ? "data de admissão" : "data de start"})
        </p>
      )}
    </div>
  );
}