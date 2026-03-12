import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Trash2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TeamModal from "@/components/gestores/TeamModal";
import { addDays, differenceInDays, parseISO, isValid } from "date-fns";

function parseSafeDate(str) {
  if (!str) return null;
  try {
    const d = parseISO(str);
    return isValid(d) ? d : null;
  } catch { return null; }
}

function getRitualStatus(dueDate, isCompleted) {
  if (isCompleted) return "CONCLUIDO";
  if (!dueDate) return "PENDENTE";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = differenceInDays(dueDate, today);
  
  if (days < 0) return "VENCIDO";
  if (days <= 10) return "PROXIMO_VENCIMENTO";
  return "EM_DIA";
}

function getRitualBadge(status) {
  const config = {
    CONCLUIDO: { label: "✓", color: "bg-emerald-100 text-emerald-700" },
    PENDENTE: { label: "—", color: "bg-slate-100 text-slate-500" },
    EM_DIA: { label: "✓", color: "bg-emerald-100 text-emerald-700" },
    PROXIMO_VENCIMENTO: { label: "!", color: "bg-amber-100 text-amber-700" },
    VENCIDO: { label: "⚠", color: "bg-red-100 text-red-700" }
  };
  const cfg = config[status] || config.PENDENTE;
  return <Badge className={`${cfg.color} text-xs px-2`}>{cfg.label}</Badge>;
}

export default function GestorTime() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gestorId = searchParams.get("id");

  const [gestor, setGestor] = useState(null);
  const [prestadores, setPrestadores] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [allColaboradores, setAllColaboradores] = useState([]);

  useEffect(() => {
    if (gestorId) {
      loadData();
    }
  }, [gestorId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gestorData, colaboradores, allFeedbacks] = await Promise.all([
        base44.entities.Gestor.get(gestorId),
        base44.entities.Colaborador.filter({ manager_id: gestorId }),
        base44.entities.FeedbackRecord.list()
      ]);

      setGestor(gestorData);
      setPrestadores(colaboradores.sort((a, b) => 
        (a.full_name || "").localeCompare(b.full_name || "")
      ));
      setFeedbacks(allFeedbacks);

      // Carregar todos os colaboradores para o modal
      const allColabs = await base44.entities.Colaborador.list();
      setAllColaboradores(allColabs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!removingId) return;
    setRemoving(true);
    try {
      await base44.entities.Colaborador.update(removingId, { manager_id: null });
      await loadData();
      setRemovingId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setRemoving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "PS";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRituaisStatus = (prestador) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 45 Dias
    const cfg45 = prestador.ritual_45d_use_admission !== false;
    const base45 = cfg45 ? parseSafeDate(prestador.admission_date) : parseSafeDate(prestador.ritual_45d_custom_start);
    const due45 = base45 ? addDays(base45, 45) : null;
    const records45 = feedbacks.filter(f => 
      f.employee_id === prestador.id && 
      f.feedback_type === "experience_45d" && 
      f.workflow_status === "ASSINADO_COLABORADOR"
    );
    const is45Completed = prestador.ritual_45d_completed_manual || records45.length > 0;
    const status45 = getRitualStatus(due45, is45Completed);

    // 90 Dias
    const cfg90 = prestador.ritual_90d_use_admission !== false;
    const records90 = feedbacks
      .filter(f => f.employee_id === prestador.id && f.feedback_type === "experience_90d" && f.workflow_status === "ASSINADO_COLABORADOR")
      .sort((a, b) => new Date(b.employee_validation_date || 0) - new Date(a.employee_validation_date || 0));
    const last90Date = records90[0] ? parseSafeDate(records90[0].employee_validation_date) : null;
    const base90 = last90Date || (cfg90 ? parseSafeDate(prestador.admission_date) : parseSafeDate(prestador.ritual_90d_custom_start));
    const due90 = base90 ? addDays(base90, 90) : null;
    const is90Completed = prestador.ritual_90d_completed_manual || records90.length > 0;
    const status90 = getRitualStatus(due90, is90Completed);

    // Trimestral
    const cfgTri = prestador.ritual_trimestral_use_admission !== false;
    const recordsTri = feedbacks
      .filter(f => f.employee_id === prestador.id && f.feedback_type === "evaluation" && f.workflow_status === "ASSINADO_COLABORADOR")
      .sort((a, b) => new Date(b.employee_validation_date || 0) - new Date(a.employee_validation_date || 0));
    const lastTriDate = recordsTri[0] ? parseSafeDate(recordsTri[0].employee_validation_date) : null;
    const baseTri = lastTriDate || (cfgTri ? parseSafeDate(prestador.admission_date) : parseSafeDate(prestador.ritual_trimestral_custom_start));
    const dueTri = baseTri ? addDays(baseTri, 90) : null;
    const statusTri = getRitualStatus(dueTri, false);

    // 1:1
    const cfg1on1 = prestador.ritual_1on1_use_admission !== false;
    const records1on1 = feedbacks
      .filter(f => f.employee_id === prestador.id && f.feedback_type === "one_on_one" && f.workflow_status === "ASSINADO_COLABORADOR")
      .sort((a, b) => new Date(b.employee_validation_date || 0) - new Date(a.employee_validation_date || 0));
    const last1on1Date = records1on1[0] ? parseSafeDate(records1on1[0].employee_validation_date) : null;
    const base1on1 = last1on1Date || (cfg1on1 ? parseSafeDate(prestador.admission_date) : parseSafeDate(prestador.ritual_1on1_custom_start));
    const due1on1 = base1on1 ? addDays(base1on1, 60) : null;
    const status1on1 = getRitualStatus(due1on1, false);

    return { status45, status90, statusTri, status1on1 };
  };

  const removingPrestador = prestadores.find(p => p.id === removingId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!gestor) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500">Gestor não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/Gestores")}
            className="mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Time de {gestor.full_name}
            </h1>
            <p className="text-slate-500 mt-1">
              Gerencie os prestadores vinculados a este gestor
            </p>
            <p className="text-sm text-slate-400 mt-2">
              {prestadores.length} prestador{prestadores.length !== 1 ? 'es' : ''} vinculado{prestadores.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Button 
          onClick={() => setShowTeamModal(true)}
          style={{background: '#F8B137', color: '#14141E'}}
          className="font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Prestador
        </Button>
      </div>

      {/* Listagem */}
      {prestadores.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 mb-4">Nenhum prestador vinculado a este gestor.</p>
            <Button 
              onClick={() => setShowTeamModal(true)}
              style={{background: '#F8B137', color: '#14141E'}}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Prestador
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {prestadores.map((prestador) => {
            const rituais = getRituaisStatus(prestador);
            
            return (
              <Card key={prestador.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 flex-shrink-0 border-2" style={{borderColor: '#F8B137'}}>
                        <AvatarFallback style={{background: '#F8B137', color: '#14141E'}} className="font-bold">
                          {getInitials(prestador.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {prestador.full_name}
                        </h3>
                        <p className="text-sm text-slate-500 truncate">
                          {prestador.email}
                        </p>
                        {prestador.position && (
                          <p className="text-xs text-slate-400 truncate">
                            {prestador.position}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="hidden sm:flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500 font-medium">45D</span>
                          {getRitualBadge(rituais.status45)}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500 font-medium">90D</span>
                          {getRitualBadge(rituais.status90)}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500 font-medium">Trim.</span>
                          {getRitualBadge(rituais.statusTri)}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500 font-medium">1:1</span>
                          {getRitualBadge(rituais.status1on1)}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRemovingId(prestador.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile badges */}
                  <div className="sm:hidden flex items-center gap-1.5 mt-3 overflow-x-auto pb-1">
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-slate-500 font-medium">45D</span>
                      {getRitualBadge(rituais.status45)}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-slate-500 font-medium">90D</span>
                      {getRitualBadge(rituais.status90)}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-slate-500 font-medium">Trim.</span>
                      {getRitualBadge(rituais.statusTri)}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-slate-500 font-medium">1:1</span>
                      {getRitualBadge(rituais.status1on1)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Remove Confirmation */}
      <AlertDialog open={!!removingId} onOpenChange={(open) => !open && setRemovingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Prestador do Time</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{removingPrestador?.full_name}</strong> do time de <strong>{gestor.full_name}</strong>?
              <span className="block mt-2 text-slate-600">
                O prestador permanecerá ativo no sistema, apenas o vínculo com este gestor será removido.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {removing ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Team Modal */}
      {showTeamModal && (
        <TeamModal
          manager={gestor}
          allColaboradores={allColaboradores}
          onClose={() => setShowTeamModal(false)}
          onSaved={async () => { 
            setShowTeamModal(false); 
            await loadData(); 
          }}
        />
      )}
    </div>
  );
}