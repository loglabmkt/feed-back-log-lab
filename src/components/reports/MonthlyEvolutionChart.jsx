import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function MonthlyEvolutionChart({ data, loading }) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" style={{ color: '#F8B137' }} />
            Evolução Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = data && data.length > 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" style={{ color: '#F8B137' }} />
          Evolução Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} barGap={2}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  tickFormatter={v => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(value, name) => {
                    if (name === 'Aderência (%)') return [`${value}%`, name];
                    return [value, name];
                  }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="onTime" name="No Prazo" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="late" name="Com Atraso" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="adherence"
                  name="Aderência (%)"
                  stroke="#F8B137"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#F8B137' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <BarChart3 className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-medium">Nenhuma avaliação concluída no período selecionado</p>
            <p className="text-sm text-slate-400 mt-1">Avaliações aparecem aqui quando atingem o status "Assinado pelo Colaborador"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}