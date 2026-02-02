import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";

export default function ComplianceGauge({ complianceRate }) {
  const gaugeData = [
    { value: complianceRate },
    { value: 100 - complianceRate }
  ];

  const getColor = () => {
    if (complianceRate >= 80) return '#10B981'; // green
    if (complianceRate >= 50) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  const getLabel = () => {
    if (complianceRate >= 80) return 'Excelente';
    if (complianceRate >= 50) return 'Adequado';
    return 'Crítico';
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Índice de Compliance Geral
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative flex flex-col items-center">
          <div className="relative w-64 h-64">
            <PieChart width={256} height={256}>
              <Pie
                data={gaugeData}
                cx={128}
                cy={128}
                startAngle={180}
                endAngle={0}
                innerRadius={80}
                outerRadius={110}
                paddingAngle={0}
                dataKey="value"
              >
                <Cell fill={getColor()} />
                <Cell fill="#E2E8F0" />
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <span className="text-5xl font-bold text-slate-900">{complianceRate}%</span>
              <span className="text-sm font-medium text-slate-500 mt-1">{getLabel()}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6 w-full max-w-md">
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mx-auto mb-1" />
              <p className="text-xs text-slate-600">≥80% Excelente</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <div className="w-3 h-3 bg-amber-500 rounded-full mx-auto mb-1" />
              <p className="text-xs text-slate-600">50-79% Adequado</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1" />
              <p className="text-xs text-slate-600">&lt;50% Crítico</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}