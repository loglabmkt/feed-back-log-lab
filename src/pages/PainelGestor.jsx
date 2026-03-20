import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  CheckCircle2, 
  Clock, 
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GestorLayout from "@/components/GestorLayout";

export default function PainelGestor() {
  const [gestor, setGestor] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [teamCount, setTeamCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
      const [allFeedbacks, team] = await Promise.all([
        base44.entities.FeedbackRecord.filter({ manager_id: gestorData.id }),
        base44.entities.Colaborador.filter({ manager_id: gestorData.id, status: "active" })
      ]);
      
      setFeedbacks(allFeedbacks);
      setTeamCount(team.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const doneStatuses = ['APROVADO', 'CONVERSA_AGENDADA', 'CONVERSA_REALIZADA', 'PUBLICADO', 'ASSINADO_COLABORADOR', 'EM_REVISAO_ADMIN'];
  const stats = {
    meuTime: teamCount,
    feedbacksRealizados: feedbacks.filter(f => doneStatuses.includes(f.workflow_status)).length,
    emRevisao: feedbacks.filter(f => f.workflow_status === 'EM_REVISAO_ADMIN').length,
    assinados: feedbacks.filter(f => f.workflow_status === 'ASSINADO_COLABORADOR').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8B137]" />
      </div>
    );
  }

  return (
    <GestorLayout currentPage="dashboard" gestor={gestor}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Bem-vindo, <span className="font-bold">{gestor?.full_name?.split(' ')[0]}</span>!
        </h1>
        <p className="text-slate-500">Aqui está um resumo dos seus feedbacks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Meu Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{background: 'rgba(248, 177, 55, 0.12)'}}>
                <FileText className="w-6 h-6" style={{color: '#F8B137'}} />
              </div>
              <div>
                <p className="text-3xl font-bold" style={{color: '#14141E'}}>{stats.meuTime}</p>
                <p className="text-xs text-slate-500">colaboradores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Feedbacks Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{background: 'rgba(248, 177, 55, 0.12)'}}>
                <Clock className="w-6 h-6" style={{color: '#F8B137'}} />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{stats.feedbacksRealizados}</p>
                <p className="text-xs text-slate-500">avaliações concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Em Revisão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{background: 'rgba(248, 177, 55, 0.12)'}}>
                <CheckCircle2 className="w-6 h-6" style={{color: '#F8B137'}} />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{stats.emRevisao}</p>
                <p className="text-xs text-slate-500">com o admin</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Assinados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{background: 'rgba(248, 177, 55, 0.12)'}}>
                <CheckCircle2 className="w-6 h-6" style={{color: '#F8B137'}} />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{stats.assinados}</p>
                <p className="text-xs text-slate-500">concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle>Feedbacks Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {feedbacks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nenhum feedback encontrado
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {feedbacks.slice(0, 5).map((feedback) => {
                const initials = feedback.employee_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                return (
                  <div key={feedback.id} className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors cursor-default">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{background: '#F8B137', color: '#0a0a0a'}}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{feedback.employee_name}</p>
                      <p className="text-sm text-slate-500 truncate">{feedback.template_title}</p>
                    </div>
                    <Badge
                      className={
                        feedback.workflow_status === 'DISPONIVEL_PARA_GESTOR' ? 'bg-blue-100 text-blue-700' :
                        feedback.workflow_status === 'EM_REVISAO_ADMIN' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }
                    >
                      {feedback.workflow_status === 'DISPONIVEL_PARA_GESTOR' ? 'Disponível' :
                       feedback.workflow_status === 'EM_REVISAO_ADMIN' ? 'Em Revisão' : 'Assinado'}
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