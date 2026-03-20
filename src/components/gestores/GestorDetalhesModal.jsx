import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { X, Mail, Users, ChevronRight, Loader2, CheckCircle2, AlertCircle, ClipboardList } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const RITUAIS = [
  { key: "AVALIACAO_45", label: "Avaliação de Qualidade de Serviço — 45 Dias" },
  { key: "AVALIACAO_90", label: "Avaliação de Qualidade de Serviço — 90 Dias" },
  { key: "TRIMESTRAL",   label: "Instrumento de Nível de Serviço — Trimestral" },
  { key: "ONE_ON_ONE",   label: "Registro de 1:1 (Conversa de Alinhamento)" },
];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function GestorDetalhesModal({ manager, colaboradores, company, onClose }) {
  const navigate = useNavigate();
  const [confirmRitual, setConfirmRitual] = useState(null);
  const [sending, setSending] = useState(false);
  const [sentMap, setSentMap] = useState({});

  const team = colaboradores.filter(c => c.manager_id === manager.id);

  const handleNotify = async (ritual) => {
    setSending(true);
    try {
      await base44.functions.invoke('notifyGestorRitual', {
        gestorId: manager.id,
        ritualType: ritual.key
      });
      setSentMap(prev => ({ ...prev, [ritual.key]: 'success' }));
    } catch {
      setSentMap(prev => ({ ...prev, [ritual.key]: 'error' }));
    } finally {
      setSending(false);
      setConfirmRitual(null);
    }
  };

  const handleGoToTime = () => {
    onClose();
    navigate(`/GestorTime?id=${manager.id}`);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-900">
            Detalhes do Gestor
          </DialogTitle>
        </DialogHeader>

        {/* SEÇÃO 1 — Identificação */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <Avatar className="h-14 w-14 border-2 flex-shrink-0" style={{ borderColor: '#F8B137' }}>
            <AvatarFallback style={{ background: '#14141E', color: '#F8B137' }} className="text-lg font-bold">
              {getInitials(manager.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 truncate text-lg">{manager.full_name}</p>
            <p className="text-sm text-slate-500 truncate">{manager.email}</p>
            {company && <p className="text-xs text-slate-400 truncate mt-0.5">{company.razao_social}</p>}
            <div className="mt-1.5">
              <Badge className={manager.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500'} variant="outline">
                {manager.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2 — Meu Time */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-700 text-sm">
              Meu Time — {team.length} prestador{team.length !== 1 ? 'es' : ''}
            </h3>
          </div>

          {team.length === 0 ? (
            <p className="text-sm text-slate-400 py-3 text-center">Nenhum prestador vinculado.</p>
          ) : (
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
              {team.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs font-bold" style={{ background: '#F8B137', color: '#14141E' }}>
                      {getInitials(c.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{c.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-slate-700"
            onClick={handleGoToTime}
          >
            Gerenciar Time
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <hr className="border-slate-100" />

        {/* SEÇÃO 3 — Notificações */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-700 text-sm">Disparar Notificação de Rotina</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Envie um e-mail para este gestor sobre a disponibilidade de uma rotina específica.
          </p>

          <div className="space-y-2">
            {RITUAIS.map(ritual => {
              const status = sentMap[ritual.key];
              const isConfirming = confirmRitual?.key === ritual.key;

              return (
                <div key={ritual.key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <p className="flex-1 text-sm text-slate-700 leading-tight">{ritual.label}</p>

                  {status === 'success' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  )}
                  {status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}

                  {!status && !isConfirming && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                      onClick={() => setConfirmRitual(ritual)}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Notificar
                    </Button>
                  )}

                  {isConfirming && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 h-7 px-2 text-xs"
                        onClick={() => setConfirmRitual(null)}
                        disabled={sending}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-3 text-xs gap-1"
                        style={{ background: '#14141E', color: '#F8B137' }}
                        onClick={() => handleNotify(ritual)}
                        disabled={sending}
                      >
                        {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Enviar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}