import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users,
  ClipboardList,
  LogOut, 
  Menu, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createPageUrl } from "../utils";

export default function GestorLayout({ children, currentPage = 'dashboard', gestor }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('gestor_session');
    window.location.href = '/gestorlogin';
  };

  const getInitials = (name) => {
    if (!name) return "G";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-200
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{background: '#F8B137'}}>
                <LayoutDashboard className="w-5 h-5" style={{color: '#14141E'}} />
              </div>
              <div>
                <h1 className="font-bold tracking-tight" style={{color: '#14141E'}}>Portal Gestor</h1>
                <p className="text-[10px] uppercase tracking-wider" style={{color: '#F8B137'}}>Compliance RH</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 p-4">
            <nav className="space-y-1">
              <Link
                to={createPageUrl("PainelGestor")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  currentPage === 'dashboard'
                    ? 'text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={currentPage === 'dashboard' ? {
                  background: 'linear-gradient(135deg, rgba(248, 177, 55, 0.15) 0%, rgba(248, 177, 55, 0.05) 100%)',
                  borderLeft: '3px solid #F8B137'
                } : {}}
              >
                <LayoutDashboard className={`w-5 h-5 ${currentPage === 'dashboard' ? 'text-[#F8B137]' : 'text-slate-400'}`} />
                Dashboard
              </Link>
              <Link
                to={createPageUrl("GestorFeedbacks")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  currentPage === 'feedbacks'
                    ? 'text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={currentPage === 'feedbacks' ? {
                  background: 'linear-gradient(135deg, rgba(248, 177, 55, 0.15) 0%, rgba(248, 177, 55, 0.05) 100%)',
                  borderLeft: '3px solid #F8B137'
                } : {}}
              >
                <MessageSquare className={`w-5 h-5 ${currentPage === 'feedbacks' ? 'text-[#F8B137]' : 'text-slate-400'}`} />
                Feedbacks
              </Link>
              <Link
                to="/painelgestor/respostas"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  currentPage === 'respostas'
                    ? 'text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={currentPage === 'respostas' ? {
                  background: 'linear-gradient(135deg, rgba(248, 177, 55, 0.15) 0%, rgba(248, 177, 55, 0.05) 100%)',
                  borderLeft: '3px solid #F8B137'
                } : {}}
              >
                <ClipboardList className={`w-5 h-5 ${currentPage === 'respostas' ? 'text-[#F8B137]' : 'text-slate-400'}`} />
                Respostas
              </Link>
              <Link
                to={createPageUrl("MeuTime")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  currentPage === 'meutime'
                    ? 'text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={currentPage === 'meutime' ? {
                  background: 'linear-gradient(135deg, rgba(248, 177, 55, 0.15) 0%, rgba(248, 177, 55, 0.05) 100%)',
                  borderLeft: '3px solid #F8B137'
                } : {}}
              >
                <Users className={`w-5 h-5 ${currentPage === 'meutime' ? 'text-[#F8B137]' : 'text-slate-400'}`} />
                Meu Time
              </Link>
            </nav>
          </div>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{background: 'linear-gradient(135deg, rgba(248, 177, 55, 0.1) 0%, rgba(248, 177, 55, 0.05) 100%)'}}>
              <Avatar className="h-10 w-10 border-2 shadow-sm" style={{borderColor: '#F8B137'}}>
                <AvatarFallback className="text-white text-sm font-bold" style={{background: '#F8B137'}}>
                  {getInitials(gestor?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {gestor?.full_name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  Gestor
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="text-slate-400 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-lg border-b" style={{borderColor: 'rgba(248, 177, 55, 0.1)'}}>
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900">
              {currentPage === 'dashboard' && 'Dashboard'}
              {currentPage === 'feedbacks' && 'Feedbacks'}
              {currentPage === 'respostas' && 'Respostas'}
              {currentPage === 'meutime' && 'Meu Time'}
            </h2>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}