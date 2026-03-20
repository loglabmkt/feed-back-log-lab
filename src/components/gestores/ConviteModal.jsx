import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

export default function ConviteModal({ manager, onClose, onSent }) {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    setSending(true);
    try {
      await base44.functions.invoke('sendGestorInvite', { gestorId: manager.id });
      toast({ description: `Convite enviado para ${manager.email}` });
      onSent?.();
      onClose();
    } catch {
      toast({ description: "Erro ao enviar convite. Tente novamente.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Gestor cadastrado com sucesso!</h2>
            <p className="text-sm text-slate-500">
              Deseja enviar um convite por e-mail para{' '}
              <strong className="text-slate-700">{manager.full_name}</strong>{' '}
              criar sua conta no sistema?
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={sending}
            >
              Agora não
            </Button>
            <Button
              className="flex-1 gap-2"
              style={{ background: '#14141E', color: '#F8B137' }}
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? "Enviando..." : "Enviar Convite"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}