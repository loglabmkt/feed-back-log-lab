import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function RootRedirect() {
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    async function check() {
      // Verificar sessão de gestor primeiro (localStorage)
      const gestorSession = localStorage.getItem("gestor_session");
      if (gestorSession) {
        setDestination("/painelgestor");
        return;
      }

      // Verificar autenticação Base44 (admin)
      try {
        const authed = await base44.auth.isAuthenticated();
        if (authed) {
          setDestination("/painel");
        } else {
          base44.auth.redirectToLogin("/painel");
        }
      } catch {
        base44.auth.redirectToLogin("/painel");
      }
    }
    check();
  }, []);

  if (!destination) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#F8B137] rounded-full animate-spin" />
      </div>
    );
  }

  return <Navigate to={destination} replace />;
}