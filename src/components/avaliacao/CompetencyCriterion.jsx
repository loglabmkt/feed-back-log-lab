import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

const SCALE_OPTIONS = [
  { value: 1, shortLabel: "1", description: "Abaixo do Esperado", selected: "border-red-500 bg-red-50 text-red-700", indicator: "bg-red-500" },
  { value: 2, shortLabel: "2", description: "Em Desenvolvimento", selected: "border-amber-500 bg-amber-50 text-amber-700", indicator: "bg-amber-500" },
  { value: 3, shortLabel: "3", description: "Atende ao Esperado", selected: "border-blue-500 bg-blue-50 text-blue-700", indicator: "bg-blue-500" },
  { value: 4, shortLabel: "4", description: "Supera o Esperado", selected: "border-emerald-500 bg-emerald-50 text-emerald-700", indicator: "bg-emerald-500" },
];

export default function CompetencyCriterion({ criterion, score, evidence, onScoreChange, onEvidenceChange, hasError }) {
  const evidenceRequired = score && score !== 3;
  const evidenceMissing = hasError && evidenceRequired && !evidence?.trim();

  return (
    <div className={`rounded-xl border-2 transition-all overflow-hidden ${evidenceMissing ? "border-red-300" : score ? "border-slate-200" : "border-slate-100"}`}>
      {/* Header row */}
      <div className={`px-5 py-4 ${evidenceMissing ? "bg-red-50" : "bg-white"}`}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900">{criterion.label}</h4>
            <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{criterion.description}</p>
          </div>

          {/* Score buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {SCALE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onScoreChange(opt.value)}
                title={opt.description}
                className={`w-14 py-3 rounded-xl border-2 text-center transition-all font-bold text-lg focus:outline-none ${
                  score === opt.value
                    ? opt.selected + " shadow-sm"
                    : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 bg-white"
                }`}
              >
                {opt.shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Scale legend (shown only when no score selected) */}
        {!score && (
          <div className="flex gap-3 mt-3 flex-wrap">
            {SCALE_OPTIONS.map((opt) => (
              <span key={opt.value} className="flex items-center gap-1 text-xs text-slate-400">
                <span className={`w-2 h-2 rounded-full ${opt.indicator}`} />
                {opt.shortLabel} – {opt.description}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Evidence area */}
      {score && (
        <div className={`px-5 py-4 border-t ${evidenceMissing ? "bg-red-50/50 border-red-200" : "bg-slate-50/50 border-slate-100"}`}>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1 mb-2">
            Evidência
            {evidenceRequired ? (
              <span className="text-red-500 font-bold normal-case ml-1">
                * obrigatória para nota {score}
              </span>
            ) : (
              <span className="text-slate-400 font-normal normal-case ml-1">(opcional — nota 3)</span>
            )}
          </label>
          <Textarea
            value={evidence || ""}
            onChange={(e) => onEvidenceChange(e.target.value)}
            placeholder={
              evidenceRequired
                ? "Descreva exemplos concretos que justificam esta nota..."
                : "Registre observações adicionais se desejar..."
            }
            className={`text-sm min-h-[80px] resize-none bg-white ${
              evidenceMissing ? "border-red-400 focus-visible:ring-red-400" : ""
            }`}
          />
          {evidenceMissing && (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              Evidência obrigatória para notas 1, 2 e 4. Descreva um exemplo concreto.
            </p>
          )}
        </div>
      )}
    </div>
  );
}