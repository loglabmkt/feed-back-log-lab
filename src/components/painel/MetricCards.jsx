import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, CheckCircle, AlertCircle, FileCheck } from "lucide-react";

export default function MetricCards({ metrics, loading }) {
  const cards = [
    {
      label: "Feedbacks Recebidos",
      value: metrics?.feedbacksRecebidos ?? 0,
      icon: MessageSquare,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      label: "No Prazo",
      value: metrics?.noPrazo ?? 0,
      icon: CheckCircle,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600"
    },
    {
      label: "Atrasados",
      value: metrics?.atrasados ?? 0,
      icon: AlertCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600"
    },
    {
      label: "Assinados",
      value: metrics?.assinados ?? 0,
      icon: FileCheck,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-28 mb-3" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card key={i} className="border-0 shadow-sm card-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}