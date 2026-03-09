import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, Save, AlertCircle, CheckCircle,
  User, Search, Users, Clock, AlertTriangle, MessageSquare, Lock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Registro11() {
  const [gestor, setGestor] = useState(null);
  const [allColaboradores, setAllColaboradores] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showColabModal, setShowColabModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [hasCriticalImpediment, setHasCriticalImpediment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [templateId, setTemplateId] = useState(null);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const session = localStorage.getItem("gestor_session");
    if (!session) { window.location.href = "/gestorlogin"; return; }
    const sessionData = JSON.parse(session);
    setGestor(sessionData);
    try {
      const [myTeam, templates] = await Promise.all([
        base44.entities.Colaborador.filter({ manager_id: sessionData.id, status: "active" }),
        base44.entities.FeedbackTemplate.filter({ feedback_type: "one_on_one", is_active: true }),
      ]);
      setAllColaboradores(myTeam);
      if (templates.length > 0) setTemplateId(templates[0].id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSubmitAttempted(true);
    setError("");
    if (!selectedEmployee) { setError("Selecione o colaborador para o 1:1."); return; }
    if (!notes.trim() || notes.trim().length < 20) {
      setError("O Registro da Conversa é obrigatório (mínimo 20 caracteres).");
      return;
    }

    setSaving(true);
    try {
      await base44.entities.FeedbackRecord.create({
        template_id: templateId || "LOGLAB_1_1_BIMESTRAL",
        template_title: "Registro de 1:1 (Conversa de Alinhamento)",
        feedback_type: "one_on_one",
        workflow_status: "EM_REVISAO_ADMIN",
        manager_id: gestor.id,
        manager_name: gestor.full_name,
        employee_id: selectedEmployee.id,
        employee_name: selectedEmployee.full_name,
        employee_email: selectedEmployee.email,
        feedback_date: format(new Date(), "yyyy-MM-dd"),
        one_on_one_notes: notes,
        has_critical_impediment: hasCriticalImpediment,
      });
      setSaved(true);
      setTimeout(() => { window.location.href = "/gestorfeedbacks"; }, 2500);
    } catch (e) {
      setError("Erro ao salvar o registro. Tente novamente.");
      console.error(e);
    } finally { setSaving(false); }
  };

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  if (saved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="border-0 shadow-xl max-w-sm w-full text-center">
          <CardContent className="py-12 px-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Registro Enviado!</h2>
            <p className="text-slate-500 mb-1">Encaminhado para revisão do Admin.</p>
            <p className="text-sm text-slate-400">Redirecionando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor: "#F8B137"}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-lg border-b-2 shadow-sm" style={{borderColor: "#F8B137"}}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Registro de 1:1 — Conversa de Alinhamento</h1>
            <p className="text-xs text-slate-400">Log Lab Digital · Bimestral · Qualitativo · LGPD Compliant</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">

        {/* Diretriz */}
        <Alert className="bg-blue-50 border-blue-200">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Duração: 15 minutos cronometrados.</strong> O foco é a análise de impedimentos e orientado à execução.
          </AlertDescription>
        </Alert>

        {/* Aviso LGPD */}
        <Alert className="bg-amber-50 border-amber-200">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            <strong>Informação sensível (LGPD):</strong> O conteúdo deste registro é de uso interno e <strong>não será exibido ao colaborador</strong>. O prestador recebe apenas a confirmação de que a conversa foi realizada.
          </AlertDescription>
        </Alert>

        {/* Identificação */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <User className="w-4 h-4" style={{color: "#F8B137"}} />
              Seção 1 – Identificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Gestor */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Gestor (Auto-preenchido)</label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-white text-xs font-bold" style={{background: "#14141E"}}>
                    {getInitials(gestor?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{gestor?.full_name}</p>
                  <p className="text-xs text-slate-500">{gestor?.email}</p>
                </div>
              </div>
            </div>

            {/* Data */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Data do 1:1 (Auto)</label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 text-sm">
                  {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Colaborador */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Prestador / Colaborador *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar pelo nome..."
                    className="pl-9"
                  />
                </div>
                <Button type="button" variant="outline" onClick={() => { setModalSearch(""); setShowColabModal(true); }} className="flex-shrink-0 gap-2">
                  <Users className="w-4 h-4" /> Meu Time
                </Button>
              </div>

              {searchQuery.trim().length > 0 && (() => {
                const results = allColaboradores.filter(e => e.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
                return results.length === 0
                  ? <p className="text-sm text-slate-400 py-1 px-1">Nenhum colaborador encontrado.</p>
                  : (
                    <div className="border rounded-xl overflow-hidden divide-y">
                      {results.map(emp => (
                        <button key={emp.id} type="button"
                          onClick={() => { setSelectedEmployee(emp); setSearchQuery(""); }}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-amber-50 text-left transition-colors"
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="text-xs font-bold text-white bg-slate-400">{getInitials(emp.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 text-sm truncate">{emp.full_name}</p>
                            <p className="text-xs text-slate-500 truncate">{emp.position || emp.department || emp.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
              })()}

              {selectedEmployee && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 bg-amber-50" style={{borderColor: "#F8B137"}}>
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className="text-xs font-bold" style={{background: "#F8B137", color: "#14141E"}}>
                      {getInitials(selectedEmployee.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-sm">{selectedEmployee.full_name}</p>
                    <p className="text-xs text-slate-500">{selectedEmployee.position || selectedEmployee.department || selectedEmployee.email}</p>
                  </div>
                  <CheckCircle className="w-4 h-4 flex-shrink-0" style={{color: "#F8B137"}} />
                  <button type="button" onClick={() => setSelectedEmployee(null)} className="text-xs text-slate-400 hover:text-red-500 ml-1">✕</button>
                </div>
              )}
              {submitAttempted && !selectedEmployee && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Selecione o colaborador.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Registro da Conversa */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <MessageSquare className="w-4 h-4" style={{color: "#F8B137"}} />
              Seção 2 – Registro da Conversa e Pontos Levantados
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <p className="text-xs text-slate-500">Campo obrigatório. Restrito ao Gestor e Admin/RH. <strong>Bloqueado para visualização pelo Prestador de Serviços.</strong></p>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Registre os pontos discutidos na conversa de alinhamento: impedimentos identificados, alinhamentos realizados, encaminhamentos, decisões tomadas e próximos passos..."
              className={`min-h-[220px] resize-none text-sm ${submitAttempted && !notes.trim() ? "border-red-400 focus-visible:ring-red-400" : ""}`}
            />
            <div className="flex items-center justify-between mt-2">
              {submitAttempted && !notes.trim() ? (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Registro da Conversa é obrigatório.
                </p>
              ) : <span />}
              <p className={`text-xs ${notes.length >= 20 ? "text-emerald-500" : "text-slate-400"}`}>
                {notes.length} caracteres (mín. 20)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Impedimento Crítico */}
        <Card className={`border-2 shadow-sm transition-all ${hasCriticalImpediment ? "border-red-400 bg-red-50/50" : "border-slate-100"}`}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Checkbox
                id="impediment"
                checked={hasCriticalImpediment}
                onCheckedChange={(checked) => setHasCriticalImpediment(!!checked)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label htmlFor="impediment" className="text-sm font-bold text-slate-800 cursor-pointer">
                  Sinalizar impedimento crítico à execução
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  Ao marcar, um alerta vermelho será gerado para o Admin/RH ao receber este registro para análise imediata.
                </p>
              </div>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 transition-colors ${hasCriticalImpediment ? "text-red-500" : "text-slate-300"}`} />
            </div>
            {hasCriticalImpediment && (
              <Alert className="mt-4 bg-red-100 border-red-400">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 font-semibold">
                  🚨 Impedimento crítico sinalizado. O Admin/RH será notificado ao receber este registro.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Modal colaboradores */}
        <Dialog open={showColabModal} onOpenChange={setShowColabModal}>
          <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Selecionar Colaborador</DialogTitle>
            </DialogHeader>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} placeholder="Buscar pelo nome..." className="pl-9" autoFocus />
            </div>
            <div className="overflow-y-auto flex-1 divide-y border rounded-xl">
              {allColaboradores.filter(e => e.full_name.toLowerCase().includes(modalSearch.toLowerCase())).map(emp => (
                <button key={emp.id} type="button"
                  onClick={() => { setSelectedEmployee(emp); setShowColabModal(false); setSearchQuery(""); }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-amber-50 text-left transition-colors"
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs font-bold text-white bg-slate-400">{getInitials(emp.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-sm truncate">{emp.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{emp.position || emp.department || emp.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            Após salvar, o registro será encaminhado ao Admin para revisão antes de publicação ao colaborador.
          </p>
          <div className="flex gap-3 flex-shrink-0">
            <Button variant="outline" onClick={() => window.history.back()} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="px-8 font-bold shadow-md" style={{background: "#F8B137", color: "#14141E"}}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar e Enviar para Revisão"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}