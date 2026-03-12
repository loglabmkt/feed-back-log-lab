import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Search, CheckCircle2, Circle, Loader2, X, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TeamModal({ manager, allColaboradores, onClose, onSaved, ritualType }) {
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // IDs dos colaboradores já vinculados a este gestor
  const initialTeam = useMemo(
    () => new Set(allColaboradores.filter(c => c.manager_id === manager.id).map(c => c.id)),
    [allColaboradores, manager.id]
  );

  const [selected, setSelected] = useState(new Set(initialTeam));

  // Verifica se colaborador está bloqueado para o ritual selecionado
  const isBlocked = (colab) => {
    if (!ritualType) return false;
    
    if (ritualType === 'experience_45d') {
      return colab.ritual_45d_completed_manual === true;
    }
    
    if (ritualType === 'experience_90d') {
      return colab.ritual_90d_completed_manual === true;
    }
    
    return false;
  };

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return allColaboradores.filter(c =>
      c.full_name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.department?.toLowerCase().includes(term)
    );
  }, [allColaboradores, search]);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const handleSave = async () => {
    setSaving(true);
    try {
      const toAdd = [...selected].filter(id => !initialTeam.has(id));
      const toRemove = [...initialTeam].filter(id => !selected.has(id));

      await Promise.all([
        ...toAdd.map(id => base44.entities.Colaborador.update(id, { manager_id: manager.id })),
        ...toRemove.map(id => base44.entities.Colaborador.update(id, { manager_id: null })),
      ]);

      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const addedCount = [...selected].filter(id => !initialTeam.has(id)).length;
  const removedCount = [...initialTeam].filter(id => !selected.has(id)).length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: "#F8B137" }} />
            Prestadores de {manager.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-slate-500 -mt-2 mb-2">
          {selected.size} prestador{selected.size !== 1 ? "es" : ""} selecionado{selected.size !== 1 ? "s" : ""}
          {(addedCount > 0 || removedCount > 0) && (
            <span className="ml-2 text-amber-600 font-medium">
              ({addedCount > 0 && `+${addedCount}`}{addedCount > 0 && removedCount > 0 && " / "}{removedCount > 0 && `-${removedCount}`})
            </span>
          )}
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar prestador..."
            className="pl-9"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 divide-y border rounded-xl">
          {filtered.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">Nenhum prestador encontrado.</p>
          )}
          {filtered.map(colab => {
            const isSelected = selected.has(colab.id);
            const isMine = initialTeam.has(colab.id);
            const isOthers = colab.manager_id && colab.manager_id !== manager.id;
            const blocked = isBlocked(colab);
            return (
              <TooltipProvider key={colab.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => !blocked && toggle(colab.id)}
                      disabled={blocked}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        blocked ? "bg-gray-100 cursor-not-allowed" :
                        isSelected ? "bg-amber-50 hover:bg-amber-100" : "bg-white hover:bg-slate-50"
                      }`}
                    >
                <div className={`w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected ? "border-amber-500 bg-amber-500" : "border-slate-300"
                }`}>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-white fill-white" />}
                </div>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback
                    className="text-xs font-bold"
                    style={{ 
                      background: blocked ? "#d1d5db" : isSelected ? "#F8B137" : "#e2e8f0", 
                      color: blocked ? "#9ca3af" : isSelected ? "#14141E" : "#64748b" 
                    }}
                  >
                    {getInitials(colab.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold text-sm truncate ${blocked ? "text-gray-400" : "text-slate-900"}`}>
                    {colab.full_name}
                  </p>
                  <p className={`text-xs truncate ${blocked ? "text-gray-400" : "text-slate-500"}`}>
                    {colab.position || colab.department || colab.email}
                  </p>
                </div>
                {blocked ? (
                  <Badge className="text-xs bg-gray-200 text-gray-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Avaliação já realizada
                  </Badge>
                ) : (
                  <>
                    {isMine && !isSelected && (
                      <Badge className="text-xs bg-slate-100 text-slate-500">Remover</Badge>
                    )}
                    {isOthers && !isMine && (
                      <Badge className="text-xs bg-blue-50 text-blue-600">Outro time</Badge>
                    )}
                  </>
                )}
                    </button>
                  </TooltipTrigger>
                  {blocked && (
                    <TooltipContent>
                      <p className="text-xs">Este prestador já realizou esta avaliação</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={saving || (addedCount === 0 && removedCount === 0)}
            style={{ background: "#14141E", color: "#F8B137" }}
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Salvar Time"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}