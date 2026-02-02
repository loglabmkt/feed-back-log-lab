import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Trophy, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManagerAdherenceTable({ managerAdherence, loading }) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Matriz de Aderência por Gestor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Matriz de Aderência por Gestor
        </CardTitle>
      </CardHeader>
      <CardContent>
        {managerAdherence.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left p-4 font-medium text-slate-600">Ranking</th>
                  <th className="text-left p-4 font-medium text-slate-600">Gestor</th>
                  <th className="text-center p-4 font-medium text-slate-600">Equipe</th>
                  <th className="text-center p-4 font-medium text-slate-600">Feedbacks</th>
                  <th className="text-center p-4 font-medium text-slate-600">Em Risco</th>
                  <th className="text-left p-4 font-medium text-slate-600">Aderência</th>
                </tr>
              </thead>
              <tbody>
                {managerAdherence
                  .sort((a, b) => b.adherence - a.adherence)
                  .map((manager, index) => (
                    <tr key={index} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4">
                        {index === 0 && (
                          <Trophy className="w-5 h-5 text-amber-500" />
                        )}
                        {index === 1 && (
                          <Trophy className="w-5 h-5 text-slate-400" />
                        )}
                        {index === 2 && (
                          <Trophy className="w-5 h-5 text-orange-600" />
                        )}
                        {index > 2 && (
                          <span className="text-slate-400 font-medium">#{index + 1}</span>
                        )}
                      </td>
                      <td className="p-4 font-medium text-slate-900">{manager.fullName}</td>
                      <td className="p-4 text-center text-slate-600">{manager.team}</td>
                      <td className="p-4 text-center text-slate-600">{manager.feedbacks}</td>
                      <td className="p-4 text-center">
                        {manager.atRisk > 0 ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {manager.atRisk}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            0
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Progress 
                            value={manager.adherence} 
                            className={`h-2 flex-1 ${
                              manager.adherence >= 80 ? '[&>div]:bg-emerald-500' :
                              manager.adherence >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
                            }`}
                          />
                          <span className={`text-sm font-semibold min-w-[45px] ${
                            manager.adherence >= 80 ? 'text-emerald-600' :
                            manager.adherence >= 50 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {manager.adherence}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Nenhum gestor com equipe atribuída</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}