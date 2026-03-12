import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Eye, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import GestorLayout from "@/components/GestorLayout";
import ColaboradorDetalhesModal from "@/components/meutime/ColaboradorDetalhesModal";

export default function MeuTime() {
  const [gestor, setGestor] = useState(null);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    checkAuth();
    loadTeam();
  }, []);

  const checkAuth = () => {
    const session = localStorage.getItem('gestor_session');
    if (!session) {
      window.location.href = '/gestorlogin';
      return;
    }
    setGestor(JSON.parse(session));
  };

  const loadTeam = async () => {
    try {
      const session = localStorage.getItem('gestor_session');
      if (!session) return;

      const gestorData = JSON.parse(session);

      // Buscar colaboradores do time
      const team = await base44.entities.Colaborador.filter({
        manager_id: gestorData.id,
        status: 'active'
      });

      // Buscar feedbacks para calcular status dos rituais
      const feedbacks = await base44.entities.FeedbackRecord.filter({
        manager_id: gestorData.id
      });

      // Processar status de cada colaborador
      const teamWithStatus = team.map(colab => {
        const colabFeedbacks = feedbacks.filter(f => f.employee_id === colab.id);
        
        return {
          ...colab,
          rituais: {
            avaliacao45: calcularStatusRitual45(colab, colabFeedbacks),
            avaliacao90: calcularStatusRitual90(colab, colabFeedbacks),
            trimestral: calcularStatusRitualRecorrente(colab, colabFeedbacks, 'evaluation', 90),
            oneOnOne: calcularStatusRitualRecorrente(colab, colabFeedbacks, 'one_on_one', 60)
          }
        };
      });

      setColaboradores(teamWithStatus);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calcularStatusRitual45 = (colab, feedbacks) => {
    const concluido = colab.ritual_45d_completed_manual === true;
    const feedback45 = feedbacks.find(f => 
      f.feedback_type === 'experience_45d' && 
      f.workflow_status === 'ASSINADO_COLABORADOR'
    );

    if (concluido || feedback45) {
      return {
        status: 'CONCLUIDO',
        dataConclusao: colab.ritual_45d_completion_date || feedback45?.employee_validation_date,
        dataPrevista: null
      };
    }

    const dataBase = colab.ritual_45d_use_admission !== false 
      ? colab.admission_date 
      : colab.ritual_45d_custom_start;

    if (!dataBase) return { status: 'PENDENTE', dataPrevista: null, dataConclusao: null };

    const dataPrevista = new Date(dataBase);
    dataPrevista.setDate(dataPrevista.getDate() + 45);

    const hoje = new Date();
    const status = hoje > dataPrevista ? 'VENCIDO' : 'PENDENTE';

    return { status, dataPrevista: dataPrevista.toISOString(), dataConclusao: null };
  };

  const calcularStatusRitual90 = (colab, feedbacks) => {
    const concluido = colab.ritual_90d_completed_manual === true;
    const feedback90 = feedbacks.find(f => 
      f.feedback_type === 'experience_90d' && 
      f.workflow_status === 'ASSINADO_COLABORADOR'
    );

    if (concluido || feedback90) {
      return {
        status: 'CONCLUIDO',
        dataConclusao: colab.ritual_90d_completion_date || feedback90?.employee_validation_date,
        dataPrevista: null
      };
    }

    const dataBase = colab.ritual_90d_use_admission !== false 
      ? colab.admission_date 
      : colab.ritual_90d_custom_start;

    if (!dataBase) return { status: 'PENDENTE', dataPrevista: null, dataConclusao: null };

    const dataPrevista = new Date(dataBase);
    dataPrevista.setDate(dataPrevista.getDate() + 90);

    const hoje = new Date();
    const status = hoje > dataPrevista ? 'VENCIDO' : 'PENDENTE';

    return { status, dataPrevista: dataPrevista.toISOString(), dataConclusao: null };
  };

  const calcularStatusRitualRecorrente = (colab, feedbacks, tipo, intervalo) => {
    const feedbacksTipo = feedbacks.filter(f => 
      f.feedback_type === tipo && 
      f.workflow_status === 'ASSINADO_COLABORADOR'
    ).sort((a, b) => new Date(b.employee_validation_date) - new Date(a.employee_validation_date));

    const ultimaConclusao = feedbacksTipo[0]?.employee_validation_date;

    let dataBase;
    if (tipo === 'evaluation') {
      dataBase = colab.ritual_trimestral_use_admission !== false 
        ? colab.admission_date 
        : colab.ritual_trimestral_custom_start;
    } else {
      dataBase = colab.ritual_1on1_use_admission !== false 
        ? colab.admission_date 
        : colab.ritual_1on1_custom_start;
    }

    if (!dataBase) return { status: 'EM_DIA', proximaData: null, ultimaConclusao, diasRestantes: null };

    const dataInicio = new Date(ultimaConclusao || dataBase);
    const proximaData = new Date(dataInicio);
    proximaData.setDate(proximaData.getDate() + intervalo);

    const hoje = new Date();
    const diasRestantes = Math.ceil((proximaData - hoje) / (1000 * 60 * 60 * 24));

    let status = 'EM_DIA';
    if (diasRestantes < 0) status = 'VENCIDO';
    else if (diasRestantes <= 10) status = 'PROXIMO_VENCIMENTO';

    return { status, proximaData: proximaData.toISOString(), ultimaConclusao, diasRestantes };
  };

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const formatarData = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const renderStatusBadge = (ritual, tipo) => {
    if (tipo === '45' || tipo === '90') {
      if (ritual.status === 'CONCLUIDO') {
        return (
          <div className="text-center">
            <Badge className="bg-green-100 text-green-700 mb-1">Concluído</Badge>
            <p className="text-xs text-slate-500">{formatarData(ritual.dataConclusao)}</p>
          </div>
        );
      }
      if (ritual.status === 'VENCIDO') {
        return (
          <div className="text-center">
            <Badge className="bg-red-100 text-red-700 mb-1">Vencido</Badge>
            <p className="text-xs text-slate-500">{formatarData(ritual.dataPrevista)}</p>
          </div>
        );
      }
      return <p className="text-sm text-slate-600 text-center">{formatarData(ritual.dataPrevista)}</p>;
    }

    // Rituais recorrentes
    if (!ritual.proximaData) return <p className="text-sm text-slate-400 text-center">Não configurado</p>;

    if (ritual.status === 'VENCIDO') {
      return (
        <div className="text-center">
          <Badge className="bg-red-100 text-red-700 mb-1">
            Vencido há {Math.abs(ritual.diasRestantes)} dias
          </Badge>
          <p className="text-xs text-slate-500">Próxima: {formatarData(ritual.proximaData)}</p>
        </div>
      );
    }
    if (ritual.status === 'PROXIMO_VENCIMENTO') {
      return (
        <div className="text-center">
          <Badge className="bg-amber-100 text-amber-700 mb-1">
            Vence em {ritual.diasRestantes} dias
          </Badge>
          <p className="text-xs text-slate-500">Próxima: {formatarData(ritual.proximaData)}</p>
        </div>
      );
    }
    return (
      <div className="text-center">
        <p className="text-sm text-slate-600">Próxima: {formatarData(ritual.proximaData)}</p>
        {ritual.ultimaConclusao && (
          <p className="text-xs text-slate-400">Última: {formatarData(ritual.ultimaConclusao)}</p>
        )}
      </div>
    );
  };

  const handleViewDetails = (colab) => {
    setSelectedColaborador(colab);
    setShowModal(true);
  };

  if (loading) {
    return (
      <GestorLayout currentPage="meutime" gestor={gestor}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8B137]" />
        </div>
      </GestorLayout>
    );
  }

  return (
    <GestorLayout currentPage="meutime" gestor={gestor}>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-7 h-7" style={{ color: "#F8B137" }} />
          <h1 className="text-2xl font-bold text-slate-900">Meu Time</h1>
        </div>
        <p className="text-slate-500">Visão geral dos rituais de avaliação da sua equipe</p>
      </div>

      {colaboradores.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum colaborador vinculado ao seu time ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Colaborador</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-slate-600 uppercase">45 Dias</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-slate-600 uppercase">90 Dias</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-slate-600 uppercase">Trimestral</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-slate-600 uppercase">1:1 Bimestral</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-slate-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {colaboradores.map((colab) => (
                      <tr key={colab.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="text-white font-bold" style={{ background: "#F8B137" }}>
                                {getInitials(colab.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-slate-900">{colab.full_name}</p>
                              <p className="text-sm text-slate-500">{colab.position || 'Sem cargo'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">{renderStatusBadge(colab.rituais.avaliacao45, '45')}</td>
                        <td className="px-4 py-4">{renderStatusBadge(colab.rituais.avaliacao90, '90')}</td>
                        <td className="px-4 py-4">{renderStatusBadge(colab.rituais.trimestral, 'recorrente')}</td>
                        <td className="px-4 py-4">{renderStatusBadge(colab.rituais.oneOnOne, 'recorrente')}</td>
                        <td className="px-4 py-4 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(colab)}
                            className="text-slate-600 hover:text-[#F8B137]"
                          >
                            <Eye className="w-5 h-5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {colaboradores.map((colab) => (
              <Card key={colab.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-white font-bold" style={{ background: "#F8B137" }}>
                          {getInitials(colab.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900">{colab.full_name}</p>
                        <p className="text-sm text-slate-500">{colab.position || 'Sem cargo'}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(colab)}
                      className="text-slate-600 hover:text-[#F8B137]"
                    >
                      <Eye className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">45 Dias</p>
                      {renderStatusBadge(colab.rituais.avaliacao45, '45')}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">90 Dias</p>
                      {renderStatusBadge(colab.rituais.avaliacao90, '90')}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Trimestral</p>
                      {renderStatusBadge(colab.rituais.trimestral, 'recorrente')}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">1:1 Bimestral</p>
                      {renderStatusBadge(colab.rituais.oneOnOne, 'recorrente')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {showModal && selectedColaborador && (
        <ColaboradorDetalhesModal
          colaborador={selectedColaborador}
          gestorId={gestor?.id}
          onClose={() => {
            setShowModal(false);
            setSelectedColaborador(null);
          }}
        />
      )}
    </GestorLayout>
  );
}