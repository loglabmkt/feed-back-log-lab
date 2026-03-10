import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";

export default function ComplianceGauge({ complianceRate, templateCoverage = [] }) {
  const gaugeData = [
    { value: complianceRate },
    { value: 100 - complianceRate }
  ];

  const getColor = () => {
    if (complianceRate >= 80) return '#10B981';
    if (complianceRate >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getLabel = () => {
    if (complianceRate >= 80) return 'Excelente';
    if (complianceRate >= 50) return 'Adequado';
    return 'Crítico';
  };

  // Sumário dos templates
  const totalExpected = templateCoverage.reduce((s, t) => s + t.total, 0);
  const totalCovered = templateCoverage.reduce((s, t) => s + t.covered, 0);
  const overdueTemplates = templateCoverage.filter(t => t.isOverdue && t.missing > 0);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: '#F8B137' }} />
          Índice Geral
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="relative w-52 h-52">
            <PieChart width={208} height={208}>
              <Pie
                data={gaugeData}
                cx={104} cy={104}
                startAngle={180} endAngle={0}
                innerRadius={65} outerRadius={90}
                paddingAngle={0}
                dataKey="value"
              >
                <Cell fill={getColor()} />
                <Cell fill="#E2E8F0" />
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
              <span className="text-4xl font-bold text-slate-900">{complianceRate}%</span>
              <span className="text-sm font-medium text-slate-500">{getLabel()}</span>
            </div>
          </div>

          {/* Sumário debaixo do gauge */}
          {templateCoverage.length > 0 ? (
            <div className="w-full mt-2 space-y-1">
              <div className="flex justify-between text-xs text-slate-600 px-1">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  {totalCovered} concluídos
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  {totalExpected - totalCovered} pendentes
                </span>
              </div>
              {overdueTemplates.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-700 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {overdueTemplates.length} formulário(s) com prazo vencido
                  </p>
                  {overdueTemplates.slice(0, 2).map(t => (
                    <p key={t.template.id} className="text-xs text-red-600 mt-1 truncate">
                      • {t.template.title}: {t.missing} pendente(s)
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 mt-4 w-full text-center">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mx-auto mb-1" />
                <p className="text-xs text-slate-600">≥80%</p>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full mx-auto mb-1" />
                <p className="text-xs text-slate-600">50–79%</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mb-1" />
                <p className="text-xs text-slate-600">&lt;50%</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}