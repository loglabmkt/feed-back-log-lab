import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getInitials(name) {
  if (!name) return "?";
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function GestoresAtraso({ items, loading }) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Gestores com Maior Atraso
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items && items.length > 0 ? (
          <div className="space-y-4">
            {items.map((g, i) => (
              <div key={i} className="flex items-center gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="text-xs font-bold text-white" style={{ background: '#14141E' }}>
                    {getInitials(g.gestorNome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{g.gestorNome}</p>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs flex-shrink-0 ml-2">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {g.atrasados} atrasado{g.atrasados !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={g.adherence}
                      className={`h-1.5 flex-1 ${g.adherence >= 80 ? '[&>div]:bg-emerald-500' : g.adherence >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`}
                    />
                    <span className="text-xs text-slate-500 flex-shrink-0">{g.adherence}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-emerald-600">Todos os gestores estão em dia! ✓</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}