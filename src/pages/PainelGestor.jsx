import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  LayoutDashboard, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  FileText,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function PainelGestor() {
  const [gestor, setGestor] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = () => {
    const session = localStorage.getItem('gestor_session');
    if (!session) {
      window.location.href = '/gestor/login';
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
      });
      
      setFeedbacks(allFeedbacks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gestor_session');
    window.location.href = '/gestor/login';
  };

  const getInitials = (name) => {
    if (!name) return "G";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const stats = {
    total: feedbacks.length,
    disponiveis: feedbacks.filter(f => f.workflow_status === 'DISPONIVEL_PARA_GESTOR').length,
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
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-200
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{background: '#F8B137'}}>
                <LayoutDashboard className="w-5 h-5" style={{color: '#14141E'}} />
              </div>
              <div>
                <h1 className="font-bold tracking-tight" style={{color: '#14141E'}}>Portal Gestor</h1>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 p-4">
            <nav className="space-y-1">
              <a
                href="/gestor"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
                style={{
                  background: 'linear-gradient(135deg, rgba(248, 177, 55, 0.15) 0%, rgba(248, 177, 55, 0.05) 100%)',
                  borderLeft: '3px solid #F8B137',
                  color: '#14141E'
                }}
              >
                <LayoutDashboard className="w-5 h-5" style={{color: '#F8B137'}} />
                Dashboard
              </a>
              <a
                href="/gestor/feedbacks"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                <MessageSquare className="w-5 h-5 text-slate-400" />
                Meus Feedbacks
              </a>
            </nav>
          </div>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{background: 'linear-gradient(135deg, rgba(248, 177, 55, 0.1) 0%, rgba(248, 177, 55, 0.05) 100%)'}}>
              <Avatar className="h-10 w-10 border-2 shadow-sm" style={{borderColor: '#F8B137'}}>
                <AvatarFallback className="text-white text-sm font-bold" style={{background: '#F8B137'}}>
                  {getInitials(gestor?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {gestor?.full_name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  Gestor
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="text-slate-400 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-lg border-b" style={{borderColor: 'rgba(248, 177, 55, 0.1)'}}>
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Bem-vindo, {gestor?.full_name?.split(' ')[0]}!
            </h1>
            <p className="text-slate-500">Aqui está um resumo dos seus feedbacks</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">Total de Feedbacks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{background: 'rgba(248, 177, 55, 0.1)'}}>
                    <FileText className="w-6 h-6" style={{color: '#F8B137'}} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold" style={{color: '#14141E'}}>{stats.total}</p>
                    <p className="text-xs text-slate-500">feedbacks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-50">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{stats.disponiveis}</p>
                    <p className="text-xs text-slate-500">para preencher</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">Em Revisão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-amber-50">
                    <MessageSquare className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{stats.emRevisao}</p>
                    <p className="text-xs text-slate-500">com o admin</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">Assinados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-50">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{stats.assinados}</p>
                    <p className="text-xs text-slate-500">concluídos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Feedbacks Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {feedbacks.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Nenhum feedback encontrado
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.slice(0, 5).map((feedback) => (
                    <div key={feedback.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{feedback.employee_name}</p>
                        <p className="text-sm text-slate-500">{feedback.template_title}</p>
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}