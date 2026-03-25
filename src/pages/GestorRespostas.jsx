import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import GestorLayout from "@/components/GestorLayout";
import { createPageUrl } from "@/utils";

export default function GestorRespostas() {
  const navigate = useNavigate();
  const [gestor, setGestor] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filterType, setFilterType] = useState('all');
  const [filterColaborador, setFilterColaborador] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = () => {
    const session = localStorage.getItem('gestor_session');
    if (!session) {
      window.location.href = '/gestorlogin';
      return;
    }
    setGestor(JSON.parse(session));
  };

  const loadData = async () => {
    try {
      const session = localStorage.getItem('gestor_session');
      if (!session) return;

      const gestorData = JSON.parse(session);

      const allFeedbacks = await base44.entities.FeedbackRecord.filter({
        manager_id: gestorData.id
      }, '-created_date');
      setFeedbacks(allFeedbacks);

      const allColaboradores = await base44.entities.Colaborador.filter({
        manager_id: gestorData.id,
        status: 'active'
      });
      setColaboradores(allColaboradores);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statusMap = {
    'DISPONIVEL_PARA_GESTOR': { label: 'Aguardando preenchimento', color: 'bg-blue-100 text-blue-700', clickable: false },
    'EM_REVISAO_ADMIN': { label: 'Em revisão pelo RH', color: 'bg-amber-100 text-amber-700', clickable: false },
    'APROVADO': { label: 'Aprovado — aguardando envio', color: 'bg-green-100 text-green-700', clickable: true },
    'CONVERSA_AGENDADA': { label: 'Conversa Agendada', color: 'bg-purple-100 text-purple-700', clickable: true },
    'CONVERSA_REALIZADA': { label: 'Conversa Realizada', color: 'bg-indigo-100 text-indigo-700', clickable: true },
    'PUBLICADO': { label: 'Publicado', color: 'bg-emerald-100 text-emerald-700', clickable: false },
    'ASSINADO_COLABORADOR': { label: 'Concluído e assinado', color: 'bg-teal-100 text-teal-700', clickable: false }
  };

  const typeLabels = {
    'one_on_one': 'Registro de 1:1 (Conversa de Alinhamento)',
    'evaluation': 'Instrumento de Nível de Serviço — Trimestral',
    'experience_90d': 'Avaliação de Qualidade de Serviço — 90 Dias',
    'experience_45d': 'Avaliação de Qualidade de Serviço — Período Inicial 45 Dias',
    'feedback': 'Feedback'
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const typeMatch = filterType === 'all' || feedback.feedback_type === filterType;
    const colaboradorMatch = filterColaborador === 'all' || feedback.employee_id === filterColaborador;
    const statusMatch = filterStatus === 'all' || feedback.workflow_status === filterStatus;
    return typeMatch && colaboradorMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8B137]" />
      </div>
    );
  }

  return (
    <GestorLayout currentPage="respostas" gestor={gestor}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Respostas</h1>
        <p className="text-slate-500">Acompanhe todas as avaliações iniciadas</p>
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2">Tipo de Feedback</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="one_on_one">Registro de 1:1 (Conversa de Alinhamento)</SelectItem>
                  <SelectItem value="evaluation">Instrumento de Nível de Serviço — Trimestral</SelectItem>
                  <SelectItem value="experience_90d">Avaliação de Qualidade de Serviço — 90 Dias</SelectItem>
                  <SelectItem value="experience_45d">Avaliação de Qualidade de Serviço — Período Inicial 45 Dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2">Prestador</Label>
              <Select value={filterColaborador} onValueChange={setFilterColaborador}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {colaboradores.map(colab => (
                    <SelectItem key={colab.id} value={colab.id}>
                      {colab.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="DISPONIVEL_PARA_GESTOR">Aguardando preenchimento</SelectItem>
                  <SelectItem value="EM_REVISAO_ADMIN">Em revisão pelo RH</SelectItem>
                  <SelectItem value="APROVADO">Aprovado — aguardando envio</SelectItem>
                  <SelectItem value="ASSINADO_COLABORADOR">Concluído e assinado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listagem */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          {filteredFeedbacks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {feedbacks.length === 0 
                ? 'Nenhuma avaliação iniciada ainda' 
                : 'Nenhuma avaliação encontrada com os filtros aplicados'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeedbacks.map((feedback) => {
                const statusDisplay = statusMap[feedback.workflow_status] || { 
                  label: feedback.workflow_status, 
                  color: 'bg-slate-100 text-slate-700', 
                  clickable: false 
                };

                return (
                  <div
                    key={feedback.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                      statusDisplay.clickable 
                        ? 'hover:bg-slate-50 cursor-pointer hover:border-[#F8B137]' 
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      if (statusDisplay.clickable) {
                        navigate(createPageUrl("GerenciarFeedback") + `?id=${feedback.id}`, {
                          state: { from: '/painelgestor/respostas' }
                        });
                      }
                    }}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{feedback.employee_name}</p>
                      <p className="text-sm text-slate-500">
                        {typeLabels[feedback.feedback_type] || feedback.template_title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(feedback.feedback_date || feedback.created_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge className={statusDisplay.color}>
                      {statusDisplay.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </GestorLayout>
  );
}