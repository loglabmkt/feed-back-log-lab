import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertCircle, Bell, X, Filter, User, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

const RITUAL_COLORS = {
  experience_45d: "bg-blue-100 text-blue-700",
  experience_90d: "bg-pink-100 text-pink-700",
  evaluation: "bg-emerald-100 text-emerald-700",
  one_on_one: "bg-indigo-100 text-indigo-700",
};

export default function Atrasados() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroGestor, setFiltroGestor] = useState("todos");
  const [filtroRitual, setFiltroRitual] = useState("todos");
  const [confirmModal, setConfirmModal] = useState(null); // { item }
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await base44.functions.invoke("adminDashboard", { route: "rituais-atrasados" });
      if (res?.data?.success) {
        setData(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const gestores = data
    ? [...new Map(data.atrasados.map((a) => [a.gestor_id, a.gestor_nome])).entries()]
        .map(([id, nome]) => ({ id, nome }))
        .sort((a, b) => a.nome.localeCompare(b.nome))
    : [];

  const filtered = (data?.atrasados || []).filter((item) => {
    const gMatch = filtroGestor === "todos" || item.gestor_id === filtroGestor;
    const rMatch = filtroRitual === "todos" || item.ritual_tipo === filtroRitual;
    return gMatch && rMatch;
  });

  const clearFilters = () => {
    setFiltroGestor("todos");
    setFiltroRitual("todos");
  };

  const handleNotificar = async () => {
    if (!confirmModal) return;
    setSending(true);
    try {
      await base44.functions.invoke("notifyGestorRitual", {
        gestorId: confirmModal.item.gestor_id,
        ritualType: confirmModal.item.ritual_notify_type,
      });
      toast({ title: "Notificação enviada!", description: `Email enviado para ${confirmModal.item.gestor_nome}.` });
      setConfirmModal(null);
    } catch (e) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#F8B137" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
            Rituais Atrasados
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Acompanhamento de prazos vencidos para cobrança aos gestores
          </p>
        </div>
        <Badge className="bg-red-100 text-red-700 text-sm px-3 py-1 self-start sm:self-auto">
          {data?.total ?? 0} rituais atrasados
        </Badge>
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />

            <Select value={filtroGestor} onValueChange={setFiltroGestor}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por gestor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os gestores</SelectItem>
                {gestores.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroRitual} onValueChange={setFiltroRitual}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por ritual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os rituais</SelectItem>
                <SelectItem value="experience_45d">Avaliação 45 Dias</SelectItem>
                <SelectItem value="experience_90d">Avaliação 90 Dias</SelectItem>
                <SelectItem value="evaluation">Trimestral</SelectItem>
                <SelectItem value="one_on_one">1:1 Bimestral</SelectItem>
              </SelectContent>
            </Select>

            {(filtroGestor !== "todos" || filtroRitual !== "todos") && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 gap-1">
                <X className="w-3 h-3" /> Limpar filtros
              </Button>
            )}

            <span className="ml-auto text-xs text-slate-400">
              {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabela / lista */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-slate-200 mb-3" />
            <p className="text-slate-500 font-medium">
              {data?.total === 0
                ? "Nenhum ritual atrasado no momento. Todos os gestores estão em dia. ✓"
                : "Nenhum resultado para os filtros selecionados."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Colaborador</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Gestor</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Ritual</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Data Prevista</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Atraso</th>
                      <th className="text-right px-5 py-3 font-semibold text-slate-600">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, i) => (
                      <tr key={`${item.colaborador_id}-${item.ritual_tipo}`} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{item.colaborador_nome}</p>
                              <p className="text-xs text-slate-400">{item.colaborador_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <Users className="w-3.5 h-3.5 text-amber-600" />
                            </div>
                            <span className="text-slate-700">{item.gestor_nome}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge className={`text-xs ${RITUAL_COLORS[item.ritual_tipo]}`}>
                            {item.ritual_label}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {item.data_prevista
                            ? new Date(item.data_prevista + "T00:00:00").toLocaleDateString("pt-BR")
                            : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-bold text-red-600">
                            {item.dias_atraso} {item.dias_atraso === 1 ? "dia" : "dias"} atrás
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50 gap-1"
                            onClick={() => setConfirmModal({ item })}
                            disabled={!item.gestor_id}
                          >
                            <Bell className="w-3 h-3" />
                            Notificar Gestor
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((item) => (
              <Card key={`${item.colaborador_id}-${item.ritual_tipo}`} className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{item.colaborador_nome}</p>
                      <p className="text-xs text-slate-400">{item.colaborador_email}</p>
                    </div>
                    <Badge className={`text-xs flex-shrink-0 ${RITUAL_COLORS[item.ritual_tipo]}`}>
                      {item.ritual_label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Users className="w-3.5 h-3.5 text-amber-500" />
                    <span>{item.gestor_nome}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Previsto para</p>
                      <p className="text-sm text-slate-600">
                        {item.data_prevista
                          ? new Date(item.data_prevista + "T00:00:00").toLocaleDateString("pt-BR")
                          : "—"}
                      </p>
                    </div>
                    <span className="font-bold text-red-600 text-sm">
                      {item.dias_atraso} {item.dias_atraso === 1 ? "dia" : "dias"} atrás
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs border-amber-300 text-amber-700 hover:bg-amber-50 gap-1"
                    onClick={() => setConfirmModal({ item })}
                    disabled={!item.gestor_id}
                  >
                    <Bell className="w-3 h-3" />
                    Notificar Gestor
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Modal de confirmação */}
      <Dialog open={!!confirmModal} onOpenChange={(open) => !open && setConfirmModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              Confirmar Notificação
            </DialogTitle>
          </DialogHeader>
          {confirmModal && (
            <p className="text-sm text-slate-600 leading-relaxed">
              Enviar notificação ao gestor{" "}
              <strong>{confirmModal.item.gestor_nome}</strong> sobre o ritual{" "}
              <strong>{confirmModal.item.ritual_label}</strong> atrasado de{" "}
              <strong>{confirmModal.item.colaborador_nome}</strong>?
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmModal(null)} disabled={sending}>
              Cancelar
            </Button>
            <Button
              onClick={handleNotificar}
              disabled={sending}
              style={{ background: "#F8B137", color: "#14141E" }}
            >
              {sending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}