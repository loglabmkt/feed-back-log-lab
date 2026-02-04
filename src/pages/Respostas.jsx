import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Eye, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Respostas() {
  const [feedbackRecords, setFeedbackRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Respostas dos Gestores</h1>
        <p className="text-slate-500">Revise e aprove os feedbacks enviados pelos gestores</p>
      </div>

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

      {filteredRecords.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">
              {searchTerm ? "Nenhuma resposta encontrada" : "Nenhuma resposta aguardando revisão"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {record.employee_name}
                      </h3>
                      {record.workflow_status === 'EM_REVISAO_ADMIN' && (
                        <Badge className="bg-amber-100 text-amber-700">
                          Em Revisão
                        </Badge>
                      )}
                      {record.workflow_status === 'APROVADO' && (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          Aprovado
                        </Badge>
                      )}
                      {record.workflow_status === 'CONVERSA_AGENDADA' && (
                        <Badge className="bg-blue-100 text-blue-700">
                          Conversa Agendada
                        </Badge>
                      )}
                      {record.workflow_status === 'CONVERSA_REALIZADA' && (
                        <Badge className="bg-purple-100 text-purple-700">
                          Conversa Realizada
                        </Badge>
                      )}
                      {record.workflow_status === 'PUBLICADO' && (
                        <Badge className="bg-indigo-100 text-indigo-700">
                          Publicado
                        </Badge>
                      )}
                      {record.workflow_status === 'ASSINADO_COLABORADOR' && (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Assinado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mb-1">
                      <span className="font-medium">Template:</span> {record.template_title}
                    </p>
                    <p className="text-sm text-slate-500">
                      <span className="font-medium">Gestor:</span> {record.manager_name}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Enviado em: {new Date(record.created_date).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Link to={createPageUrl("RevisarFeedback") + `?id=${record.id}`}>
                    <Button style={{background: '#F8B137', color: '#14141E'}}>
                      <Eye className="w-4 h-4 mr-2" />
                      {record.workflow_status === 'EM_REVISAO_ADMIN' ? 'Revisar' : 'Ver'}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}