import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function RiskRadar({ usersAtRisk, loading }) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Radar de Risco - Colaboradores Críticos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 bg-red-50 rounded-xl">
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          Radar de Risco - Colaboradores Críticos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {usersAtRisk.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-red-100">
                  <th className="text-left p-3 font-medium text-slate-600">Colaborador</th>
                  <th className="text-left p-3 font-medium text-slate-600">Cargo</th>
                  <th className="text-left p-3 font-medium text-slate-600">Departamento</th>
                  <th className="text-left p-3 font-medium text-slate-600">Último Feedback</th>
                  <th className="text-left p-3 font-medium text-slate-600">Situação</th>
                </tr>
              </thead>
              <tbody>
                {usersAtRisk.slice(0, 10).map((user) => {
                  const daysSince = user.last_feedback_date
                    ? differenceInDays(new Date(), new Date(user.last_feedback_date))
                    : null;
                  
                  return (
                    <tr key={user.id} className="border-b border-red-50 hover:bg-red-50/50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-slate-900">{user.full_name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-slate-600">{user.position || '-'}</td>
                      <td className="p-3 text-sm text-slate-600">{user.department || '-'}</td>
                      <td className="p-3 text-sm text-slate-600">
                        {user.last_feedback_date 
                          ? format(new Date(user.last_feedback_date), "dd/MM/yyyy")
                          : 'Nunca'
                        }
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant="outline" 
                          className={`${
                            daysSince === null || daysSince > 180
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : daysSince > 120
                              ? 'bg-orange-100 text-orange-800 border-orange-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {daysSince !== null ? `${daysSince} dias` : 'Nunca'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {usersAtRisk.length > 10 && (
              <p className="text-center text-sm text-slate-500 mt-4 pt-4 border-t border-red-100">
                Mostrando 10 de {usersAtRisk.length} colaboradores em risco
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <AlertTriangle className="w-12 h-12 mx-auto text-emerald-300 mb-3" />
            <p className="text-emerald-600 font-medium">Nenhum colaborador em risco!</p>
            <p className="text-sm text-slate-500 mt-1">Todos estão em compliance</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}