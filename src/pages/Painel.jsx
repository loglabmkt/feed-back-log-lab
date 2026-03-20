import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Shield,
  Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import MetricCards from "@/components/painel/MetricCards";
import TaxaConclusaoCard from "@/components/painel/TaxaConclusaoCard";
import ProximosVencimentos from "@/components/painel/ProximosVencimentos";
import GestoresAtraso from "@/components/painel/GestoresAtraso";
import PrestadoresSemAvaliacao from "@/components/painel/PrestadoresSemAvaliacao";
import AtividadeRecente from "@/components/painel/AtividadeRecente";

export default function Painel() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      base44.auth.redirectToLogin('/painel');
      return;
    }

    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) {
        base44.auth.redirectToLogin('/painel');
        return;
      }
      setUser(currentUser);

      const isAdmin = currentUser.role === 'admin';

      if (isAdmin) {
        // Admin: chama o backend para métricas completas
        const res = await base44.functions.invoke('adminDashboard', {});
        if (res?.data?.success) {
          setData(res.data.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#F8B137' }} />
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';
  const firstName = user?.full_name?.split(' ')[0] || 'Admin';

  if (!isAdmin) {
    // Fallback simples para não-admin (mantém comportamento anterior)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bem-vindo, {firstName}! 👋</h1>
          <p className="text-slate-600 mt-1">Acompanhe seus feedbacks e rituais</p>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="py-8 text-center text-slate-500">
            <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Acesse o portal do gestor para ver seus feedbacks.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Bem-vindo, {firstName}! 👋
        </h1>
        <p className="text-slate-600 mt-1">
          Visão geral do sistema de avaliação de rituais
        </p>
      </div>

      {/* Cards de métricas */}
      <MetricCards metrics={data?.metrics} loading={loading} />

      {/* Taxa de conclusão + Ações rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaxaConclusaoCard taxa={data?.metrics?.taxaConclusao} loading={loading} />

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to={createPageUrl("CriarFeedback")}>
              <Button className="w-full justify-start" style={{ background: '#F8B137', color: '#14141E' }}>
                <MessageSquare className="w-4 h-4 mr-3" />
                Criar Novo Feedback
              </Button>
            </Link>
            <Link to={createPageUrl("Feedbacks")}>
              <Button variant="outline" className="w-full justify-start">
                <LayoutDashboard className="w-4 h-4 mr-3" />
                Ver Todos os Feedbacks
              </Button>
            </Link>
            <Link to={createPageUrl("Empresas")}>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="w-4 h-4 mr-3" />
                Gerenciar Empresas
              </Button>
            </Link>
            <Link to={createPageUrl("Colaboradores")}>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-3" />
                Gerenciar Colaboradores
              </Button>
            </Link>
            <Link to={createPageUrl("Relatorios")}>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-3" />
                Relatórios & BI
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Próximos vencimentos + Gestores em atraso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProximosVencimentos items={data?.proximosVencimentos} loading={loading} />
        <GestoresAtraso items={data?.gestoresAtraso} loading={loading} />
      </div>

      {/* Prestadores sem avaliação */}
      <PrestadoresSemAvaliacao items={data?.prestadoresSemAvaliacao} loading={loading} />

      {/* Atividade recente */}
      <AtividadeRecente items={data?.atividadeRecente} loading={loading} />
    </div>
  );
}