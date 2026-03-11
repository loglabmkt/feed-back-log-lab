import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, CalendarDays } from "lucide-react";
import { addDays, addMonths, differenceInDays, format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RotinasAvaliacao({ admissionDate, employeeId, eval45dCompleted, onMark45dDone }) {
  const [feedbackRecords, setFeedbackRecords] = useState([]);
  const [loading, setLoading] = useState(false);

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

  if (!admissionDate) {
    return (
      <div className="flex items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl h-full min-h-[200px]">
        <div className="text-center text-slate-400">
          <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Informe a data de admissão<br />para ver as rotinas de avaliação</p>
        </div>
      </div>
    );
  }

  let admission;
  try {
    admission = parseISO(admissionDate);
    if (!isValid(admission)) return null;
  } catch (e) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const submitted = [
    "EM_REVISAO_ADMIN", "APROVADO", "CONVERSA_AGENDADA",
    "CONVERSA_REALIZADA", "PUBLICADO", "ASSINADO_COLABORADOR"
  ];

  // ── 45 Dias (única) ────────────────────────────────────────────
  const due45d = addDays(admission, 45);
  const days45dRemaining = differenceInDays(due45d, today);
  const has45dRecord = feedbackRecords.some(r => r.feedback_type === "experience_45d");
  const is45dDone = has45dRecord || eval45dCompleted;

  // ── 90 Dias (a cada 90 dias) ───────────────────────────────────
  const records90d = feedbackRecords
    .filter(r => r.feedback_type === "experience_90d" && submitted.includes(r.workflow_status))
    .sort((a, b) => new Date(b.feedback_date) - new Date(a.feedback_date));
  const last90d = records90d[0];
  const next90dBase = last90d ? parseISO(last90d.feedback_date) : admission;
  const next90dDue = addDays(next90dBase, 90);
  const days90dRemaining = differenceInDays(next90dDue, today);

  // ── Trimestral (a cada 3 meses) ────────────────────────────────
  const recordsTrimestral = feedbackRecords
    .filter(r => r.feedback_type === "evaluation" && submitted.includes(r.workflow_status))
    .sort((a, b) => new Date(b.feedback_date) - new Date(a.feedback_date));
  const lastTrimestral = recordsTrimestral[0];
  const nextTrimestralBase = lastTrimestral ? parseISO(lastTrimestral.feedback_date) : admission;
  const nextTrimestralDue = addMonths(nextTrimestralBase, 3);
  const daysTrimestralRemaining = differenceInDays(nextTrimestralDue, today);

  const fmt = (date) => format(date, "dd/MM/yyyy");

  const getDaysLabel = (days) => {
    if (days < 0) return `${Math.abs(days)}d em atraso`;
    if (days === 0) return "Vence hoje";
    return `Em ${days} dias`;
  };

  const getCardClass = (days, done) => {
    if (done) return "border-emerald-200 bg-emerald-50";
    if (days < 0) return "border-red-200 bg-red-50";
    if (days <= 14) return "border-orange-200 bg-orange-50";
    return "border-slate-200 bg-slate-50";
  };

  const getBadgeClass = (days, done) => {
    if (done) return "bg-emerald-100 text-emerald-700";
    if (days < 0) return "bg-red-100 text-red-700";
    if (days <= 14) return "bg-orange-100 text-orange-700";
    return "bg-blue-100 text-blue-700";
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-xl border-2 border-slate-100 bg-slate-50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* ── 45 Dias ── */}
      <div className={`p-4 rounded-xl border-2 transition-colors ${getCardClass(days45dRemaining, is45dDone)}`}>
        <div className="flex items-center gap-2 mb-1">
          {is45dDone
            ? <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            : days45dRemaining < 0
            ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            : <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          }
          <p className="text-sm font-bold text-slate-900 flex-1">Avaliação 45 Dias</p>
          <Badge className={`text-xs flex-shrink-0 ${getBadgeClass(days45dRemaining, is45dDone)}`}>
            {is45dDone ? "Concluída" : getDaysLabel(days45dRemaining)}
          </Badge>
        </div>
        <p className="text-xs text-slate-500">Única obrigatória · Prazo: {fmt(due45d)}</p>
        {is45dDone && !has45dRecord && (
          <p className="text-xs text-emerald-600 mt-0.5">✓ Marcada manualmente como concluída</p>
        )}
        {is45dDone && has45dRecord && (
          <p className="text-xs text-emerald-600 mt-0.5">✓ Avaliação registrada no sistema</p>
        )}
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
      <div className={`p-4 rounded-xl border-2 transition-colors ${getCardClass(days90dRemaining, false)}`}>
        <div className="flex items-center gap-2 mb-1">
          {days90dRemaining < 0
            ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            : <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          }
          <p className="text-sm font-bold text-slate-900 flex-1">Período Inicial 90 Dias</p>
          <Badge className={`text-xs flex-shrink-0 ${getBadgeClass(days90dRemaining, false)}`}>
            {getDaysLabel(days90dRemaining)}
          </Badge>
        </div>
        <p className="text-xs text-slate-500">
          A cada 90 dias ·{" "}
          {last90d ? `Próxima: ${fmt(next90dDue)}` : `1ª avaliação: ${fmt(next90dDue)}`}
        </p>
        {last90d && (
          <p className="text-xs text-slate-400 mt-0.5">
            Última: {fmt(parseISO(last90d.feedback_date))} · {records90d.length} realizada(s)
          </p>
        )}
      </div>

      {/* ── Trimestral ── */}
      <div className={`p-4 rounded-xl border-2 transition-colors ${getCardClass(daysTrimestralRemaining, false)}`}>
        <div className="flex items-center gap-2 mb-1">
          {daysTrimestralRemaining < 0
            ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            : <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          }
          <p className="text-sm font-bold text-slate-900 flex-1">Avaliação Trimestral</p>
          <Badge className={`text-xs flex-shrink-0 ${getBadgeClass(daysTrimestralRemaining, false)}`}>
            {getDaysLabel(daysTrimestralRemaining)}
          </Badge>
        </div>
        <p className="text-xs text-slate-500">
          A cada 3 meses ·{" "}
          {lastTrimestral ? `Próxima: ${fmt(nextTrimestralDue)}` : `1ª avaliação: ${fmt(nextTrimestralDue)}`}
        </p>
        {lastTrimestral && (
          <p className="text-xs text-slate-400 mt-0.5">
            Última: {fmt(parseISO(lastTrimestral.feedback_date))} · {recordsTrimestral.length} realizada(s)
          </p>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center pt-1">
        Ciclos calculados a partir da admissão: {fmt(admission)}
      </p>
    </div>
  );
}