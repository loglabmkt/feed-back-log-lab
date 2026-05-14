import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Eye, Search, Clock, ThumbsUp, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Respostas() {
  const [feedbackRecords, setFeedbackRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();
  const filtroPreSelecionado = location.state?.filtroPreSelecionado ?? null;
  const colRefs = { revisao: useRef(null), aprovado: useRef(null), concluido: useRef(null) };

  useEffect(() => {
    loadData();
  }, []);

  // Scroll para a coluna destacada quando vier com filtro pré-selecionado
  useEffect(() => {
    if (!filtroPreSelecionado || loading) return;
    const keyMap = { no_prazo: "concluido", assinados: "concluido" };
    const target = keyMap[filtroPreSelecionado] || filtroPreSelecionado;
    const el = colRefs[target]?.current;
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }), 300);
    }
  }, [filtroPreSelecionado, loading]);

  const loadData = async () => {
    try {
      const allRecords = await base44.entities.FeedbackRecord.list('-created_date');
      // Filtrar apenas feedbacks que estão em revisão ou já foram aprovados
      const relevantRecords = allRecords.filter(r => 
        r.workflow_status === 'EM_REVISAO_ADMIN' || 
        r.workflow_status === 'APROVADO' ||
        r.workflow_status === 'CONVERSA_AGENDADA' ||
        r.workflow_status === 'CONVERSA_REALIZADA' ||
        r.workflow_status === 'PUBLICADO' ||
        r.workflow_status === 'ASSINADO_COLABORADOR'
      );
      setFeedbackRecords(relevantRecords);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = feedbackRecords.filter(record =>
    record.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.manager_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.template_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8B137]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por colaborador, gestor ou template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Kanban */}
      {(() => {
        const colDefs = [
          {
            key: "revisao",
            label: "Em Revisão",
            icon: Clock,
            headerBg: "bg-amber-50 border-amber-200",
            iconColor: "text-amber-600",
            countBg: "bg-amber-100 text-amber-700",
            borderAccent: "border-t-amber-400",
            statuses: ["EM_REVISAO_ADMIN"],
          },
          {
            key: "aprovado",
            label: "Aprovado / Em Andamento",
            icon: ThumbsUp,
            headerBg: "bg-blue-50 border-blue-200",
            iconColor: "text-blue-600",
            countBg: "bg-blue-100 text-blue-700",
            borderAccent: "border-t-blue-400",
            statuses: ["APROVADO", "CONVERSA_AGENDADA", "CONVERSA_REALIZADA", "PUBLICADO"],
          },
          {
            key: "concluido",
            label: "Assinado / Concluído",
            icon: BadgeCheck,
            headerBg: "bg-emerald-50 border-emerald-200",
            iconColor: "text-emerald-600",
            countBg: "bg-emerald-100 text-emerald-700",
            borderAccent: "border-t-emerald-400",
            statuses: ["ASSINADO_COLABORADOR"],
          },
        ];

        const STATUS_BADGE = {
          EM_REVISAO_ADMIN:     <Badge className="bg-amber-100 text-amber-700 text-xs">Em Revisão</Badge>,
          APROVADO:             <Badge className="bg-emerald-100 text-emerald-700 text-xs">Aprovado</Badge>,
          CONVERSA_AGENDADA:    <Badge className="bg-blue-100 text-blue-700 text-xs">Conversa Agendada</Badge>,
          CONVERSA_REALIZADA:   <Badge className="bg-purple-100 text-purple-700 text-xs">Conversa Realizada</Badge>,
          PUBLICADO:            <Badge className="bg-indigo-100 text-indigo-700 text-xs">Publicado</Badge>,
          ASSINADO_COLABORADOR: <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Assinado</Badge>,
        };

        const allEmpty = filteredRecords.length === 0;

        return allEmpty ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">
                {searchTerm ? "Nenhuma resposta encontrada" : "Nenhuma resposta aguardando revisão"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {colDefs.map((col) => {
              const ColIcon = col.icon;
              const colRecords = filteredRecords.filter(r => col.statuses.includes(r.workflow_status));
              // Destacar coluna quando vier de navegação com filtro
              const isHighlighted = filtroPreSelecionado && (
                (filtroPreSelecionado === "assinados" && col.key === "concluido") ||
                (filtroPreSelecionado === "no_prazo" && col.key === "concluido")
              );
              return (
                <div
                  key={col.key}
                  ref={colRefs[col.key]}
                  className={`rounded-xl border-2 border-t-4 ${col.borderAccent} bg-slate-50 flex flex-col transition-all duration-300 ${isHighlighted ? "border-emerald-400 ring-2 ring-emerald-300 ring-offset-1 shadow-lg" : "border-slate-200"}`}
                >
                  {/* Column header */}
                  <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl border-b ${col.headerBg}`}>
                    <div className="flex items-center gap-2">
                      <ColIcon className={`w-4 h-4 ${col.iconColor}`} />
                      <span className="font-semibold text-slate-700 text-sm">{col.label}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.countBg}`}>
                      {colRecords.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="p-3 space-y-3 min-h-[120px]">
                    {colRecords.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                        <ColIcon className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-xs">Nenhum registro</p>
                      </div>
                    ) : (
                      colRecords.map((record) => (
                        <div
                          key={record.id}
                          className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                              {record.employee_name}
                            </h3>
                            {STATUS_BADGE[record.workflow_status]}
                          </div>
                          <p className="text-xs text-slate-500 mb-0.5">
                            <span className="font-medium">Template:</span> {record.template_title}
                          </p>
                          <p className="text-xs text-slate-500 mb-2">
                            <span className="font-medium">Gestor:</span> {record.manager_name}
                          </p>
                          <p className="text-xs text-slate-400 mb-3">
                            {new Date(record.created_date).toLocaleDateString('pt-BR', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                          <Link to={createPageUrl("RevisarFeedback") + `?id=${record.id}`}>
                            <Button size="sm" className="w-full text-xs" style={{background: '#F8B137', color: '#14141E'}}>
                              <Eye className="w-3 h-3 mr-1" />
                              {record.workflow_status === 'EM_REVISAO_ADMIN' ? 'Revisar' : 'Ver'}
                            </Button>
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}