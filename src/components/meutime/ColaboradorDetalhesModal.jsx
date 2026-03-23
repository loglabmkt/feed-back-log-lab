import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, User, Calendar, Mail, Briefcase, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function ColaboradorDetalhesModal({ colaborador, gestorId, onClose }) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistorico();
  }, []);

  const loadHistorico = async () => {
    try {
      const feedbacks = await base44.entities.FeedbackRecord.filter({
        employee_id: colaborador.id
      }, '-created_date');

      setHistorico(feedbacks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const formatarData = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getTipoLabel = (tipo) => {
    const map = {
      'experience_45d': '45 Dias',
      'experience_90d': '90 Dias',
      'evaluation': 'Trimestral',
      'one_on_one': '1:1',
      'feedback': 'Feedback'
    };
    return map[tipo] || tipo;
  };

  const getTipoColor = (tipo) => {
    const map = {
      'experience_45d': 'bg-blue-100 text-blue-700',
      'experience_90d': 'bg-indigo-100 text-indigo-700',
      'evaluation': 'bg-purple-100 text-purple-700',
      'one_on_one': 'bg-teal-100 text-teal-700',
      'feedback': 'bg-slate-100 text-slate-700'
    };
    return map[tipo] || 'bg-slate-100 text-slate-700';
  };

  const getStatusLabel = (status) => {
    const map = {
      'DISPONIVEL_PARA_GESTOR': 'Aguardando preenchimento',
      'EM_REVISAO_ADMIN': 'Em revisão pelo RH',
      'APROVADO': 'Aprovado — aguardando envio',
      'CONVERSA_AGENDADA': 'Conversa agendada',
      'CONVERSA_REALIZADA': 'Conversa realizada',
      'PUBLICADO': 'Publicado',
      'ASSINADO_COLABORADOR': 'Concluído e assinado'
    };
    return map[status] || status;
  };

  const getStatusColor = (status) => {
    const map = {
      'DISPONIVEL_PARA_GESTOR': 'bg-slate-100 text-slate-600',
      'EM_REVISAO_ADMIN': 'bg-amber-100 text-amber-700',
      'APROVADO': 'bg-blue-100 text-blue-700',
      'CONVERSA_AGENDADA': 'bg-purple-100 text-purple-700',
      'CONVERSA_REALIZADA': 'bg-indigo-100 text-indigo-700',
      'PUBLICADO': 'bg-emerald-100 text-emerald-700',
      'ASSINADO_COLABORADOR': 'bg-green-100 text-green-700'
    };
    return map[status] || 'bg-slate-100 text-slate-600';
  };

  const getResultado = (feedback) => {
    if (feedback.feedback_type === 'experience_45d' && feedback.exp45_average) {
      return `Média: ${feedback.exp45_average.toFixed(2)}`;
    }
    if (feedback.feedback_type === 'experience_90d' && feedback.qs90_average) {
      return `Média: ${feedback.qs90_average.toFixed(2)}`;
    }
    if (feedback.feedback_type === 'evaluation' && feedback.total_score) {
      const faixaLabel = {
        'immediate_action': 'Ação Imediata',
        'attention': 'Atenção',
        'adequate': 'Adequado',
        'reference': 'Referência'
      };
      return `${feedback.total_score} pts — ${faixaLabel[feedback.performance_band] || feedback.performance_band}`;
    }
    if (feedback.feedback_type === 'one_on_one') {
      return 'Realizado';
    }
    return '-';
  };

  const renderRitualCard = (titulo, ritual, tipo) => {
    const getStatus = () => {
      if (tipo === 'unico') {
        if (ritual.status === 'CONCLUIDO') return { label: 'Concluído', color: 'bg-green-100 text-green-700' };
        if (ritual.status === 'VENCIDO') return { label: 'Vencido', color: 'bg-red-100 text-red-700' };
        return { label: 'Pendente', color: 'bg-slate-100 text-slate-600' };
      }
      if (ritual.status === 'VENCIDO') return { label: 'Vencido', color: 'bg-red-100 text-red-700' };
      if (ritual.status === 'PROXIMO_VENCIMENTO') return { label: 'Próximo ao vencimento', color: 'bg-amber-100 text-amber-700' };
      return { label: 'Em dia', color: 'bg-green-100 text-green-700' };
    };

    const status = getStatus();

    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">{titulo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge className={status.color}>{status.label}</Badge>
          {tipo === 'unico' ? (
            <>
              {ritual.dataConclusao && (
                <p className="text-sm text-slate-600">Concluído: {formatarData(ritual.dataConclusao)}</p>
              )}
              {ritual.dataPrevista && !ritual.dataConclusao && (
                <p className="text-sm text-slate-600">Previsto: {formatarData(ritual.dataPrevista)}</p>
              )}
            </>
          ) : (
            <>
              {ritual.proximaData && (
                <p className="text-sm text-slate-600">Próxima: {formatarData(ritual.proximaData)}</p>
              )}
              {ritual.ultimaConclusao && (
                <p className="text-xs text-slate-500">Última: {formatarData(ritual.ultimaConclusao)}</p>
              )}
              {ritual.diasRestantes !== null && (
                <p className="text-xs text-slate-500">
                  {ritual.diasRestantes >= 0 
                    ? `${ritual.diasRestantes} dias restantes` 
                    : `Vencido há ${Math.abs(ritual.diasRestantes)} dias`}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="w-5 h-5" style={{ color: "#F8B137" }} />
            Detalhes do Prestador
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seção 1 — Identificação */}
          <Card className="border-0 bg-slate-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-white text-lg font-bold" style={{ background: "#F8B137" }}>
                    {getInitials(colaborador.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{colaborador.full_name}</h3>
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{colaborador.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>{colaborador.position || 'Cargo não informado'}</span>
                    </div>
                    {colaborador.admission_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Admissão: {formatarData(colaborador.admission_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 2 — Status dos Rituais */}
          <div>
            <h4 className="text-lg font-bold text-slate-900 mb-4">Status dos Rituais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderRitualCard('Avaliação 45 Dias', colaborador.rituais.avaliacao45, 'unico')}
              {renderRitualCard('Avaliação 90 Dias', colaborador.rituais.avaliacao90, 'unico')}
              {renderRitualCard('Avaliação Trimestral', colaborador.rituais.trimestral, 'recorrente')}
              {renderRitualCard('1:1 Bimestral', colaborador.rituais.oneOnOne, 'recorrente')}
            </div>
          </div>

          {/* Seção 3 — Histórico de Avaliações */}
          <div>
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: "#F8B137" }} />
              Histórico de Avaliações
            </h4>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: "#F8B137" }} />
              </div>
            ) : historico.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-8 text-center text-slate-500">
                  Nenhuma avaliação registrada ainda.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {historico.map((feedback) => (
                  <Card key={feedback.id} className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={getTipoColor(feedback.feedback_type)}>
                              {getTipoLabel(feedback.feedback_type)}
                            </Badge>
                            <Badge className={getStatusColor(feedback.workflow_status)}>
                              {getStatusLabel(feedback.workflow_status)}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p>Criado em: {formatarData(feedback.created_date)}</p>
                            {feedback.employee_validation_date && (
                              <p>Concluído em: {formatarData(feedback.employee_validation_date)}</p>
                            )}
                            <p>Gestor: {feedback.manager_name}</p>
                            <p className="font-semibold">Resultado: {getResultado(feedback)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}