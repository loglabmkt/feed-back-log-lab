import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Calendar,
  User,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Send
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Feedbacks() {
  const [currentUser, setCurrentUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const allFeedbacks = await base44.entities.FeedbackRecord.list('-created_date', 100);

      if (user.role === 'admin') {
        setFeedbacks(allFeedbacks);
      } else {
        const myFeedbacks = allFeedbacks.filter(f => f.manager_id === user.id);
        setFeedbacks(myFeedbacks);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      DISPONIVEL_PARA_GESTOR: {
        label: "Disponível para Gestor",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Clock
      },
      EM_REVISAO_ADMIN: {
        label: "Em Revisão (Admin)",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Shield
      },
      CONCLUIDO_PARA_ENVIO: {
        label: "Concluído - Pronto para Envio",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: CheckCircle
      },
      AGUARDANDO_VALIDACAO_COLABORADOR: {
        label: "Aguardando Colaborador",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Send
      },
      ASSINADO_COLABORADOR: {
        label: "Assinado pelo Colaborador",
        color: "bg-slate-100 text-slate-700 border-slate-300",
        icon: CheckCircle
      }
    };
    return statusMap[status] || statusMap.DISPONIVEL_PARA_GESTOR;
  };

  const getTypeBadge = (type) => {
    const styles = {
      feedback: "bg-blue-50 text-blue-700 border-blue-200",
      one_on_one: "bg-purple-50 text-purple-700 border-purple-200",
      evaluation: "bg-indigo-50 text-indigo-700 border-indigo-200"
    };
    const labels = {
      feedback: "Feedback Trimestral",
      one_on_one: "1:1",
      evaluation: "Avaliação de Experiência"
    };
    return (
      <Badge variant="outline" className={styles[type]}>
        {labels[type]}
      </Badge>
    );
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = feedback.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.manager_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || feedback.workflow_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const isAdmin = currentUser?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Feedbacks</h1>
          <p className="text-slate-500">
            {isAdmin ? "Gerencie o ciclo completo de feedbacks" : "Preencha os feedbacks disponíveis"}
          </p>
        </div>
        {isAdmin && (
          <Link to={createPageUrl("CriarFeedback")}>
            <Button style={{background: '#F8B137', color: '#14141E'}} className="font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Feedback
            </Button>
          </Link>
        )}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por colaborador ou gestor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="DISPONIVEL_PARA_GESTOR">Disponível para Gestor</SelectItem>
                <SelectItem value="EM_REVISAO_ADMIN">Em Revisão (Admin)</SelectItem>
                <SelectItem value="CONCLUIDO_PARA_ENVIO">Concluído para Envio</SelectItem>
                <SelectItem value="AGUARDANDO_VALIDACAO_COLABORADOR">Aguardando Colaborador</SelectItem>
                <SelectItem value="ASSINADO_COLABORADOR">Assinado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredFeedbacks.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Nenhum feedback encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredFeedbacks.map((feedback) => {
            const statusInfo = getStatusInfo(feedback.workflow_status);
            const StatusIcon = statusInfo.icon;

            return (
              <Card 
                key={feedback.id} 
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                          {getInitials(feedback.employee_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900">{feedback.employee_name}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <User className="w-3 h-3" />
                          <span>Gestor: {feedback.manager_name}</span>
                          {feedback.created_date && (
                            <>
                              <span className="text-slate-300">•</span>
                              <Calendar className="w-3 h-3" />
                              <span>{format(new Date(feedback.created_date), "dd/MM/yyyy")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeBadge(feedback.feedback_type)}
                      <Badge variant="outline" className={statusInfo.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                      <Link 
                        to={createPageUrl(
                          isAdmin && feedback.workflow_status === 'EM_REVISAO_ADMIN'
                            ? "RevisarFeedback"
                            : !isAdmin && feedback.workflow_status === 'DISPONIVEL_PARA_GESTOR'
                            ? "PreencherFeedback"
                            : "VisualizarFeedback"
                        ) + `?id=${feedback.id}`}
                      >
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          {isAdmin && feedback.workflow_status === 'EM_REVISAO_ADMIN' ? 'Revisar' : 
                           !isAdmin && feedback.workflow_status === 'DISPONIVEL_PARA_GESTOR' ? 'Preencher' : 
                           'Visualizar'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}