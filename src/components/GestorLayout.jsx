import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users,
  ClipboardList,
  LogOut, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createPageUrl } from "../utils";

export default function GestorLayout({ children, currentPage = 'dashboard', gestor }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('gestor_sidebar_collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('gestor_sidebar_collapsed', String(next));
  };

  const handleLogout = () => {
    localStorage.removeItem('gestor_session');
    window.location.href = '/gestorlogin';
  };

  const getInitials = (name) => {
    if (!name) return "G";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: createPageUrl("PainelGestor") },
    { key: 'feedbacks', label: 'Feedbacks', icon: MessageSquare, to: createPageUrl("GestorFeedbacks") },
    { key: 'respostas', label: 'Respostas', icon: ClipboardList, to: '/painelgestor/respostas' },
    { key: 'meutime', label: 'Meu Time', icon: Users, to: createPageUrl("MeuTime") },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full flex flex-col
          border-r border-white/5
          transform transition-all duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'lg:w-20' : 'lg:w-72'}
          w-72
        `}
        style={{ background: '#0a0a0a' }}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F8B137' }}>
              <LayoutDashboard className="w-4 h-4" style={{ color: '#0a0a0a' }} />
            </div>
            {!collapsed && (
              <h1 className="font-bold text-white tracking-tight truncate">Portal Gestor</h1>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Desktop collapse toggle */}
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            {/* Mobile close */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ key, label, icon: Icon, to }) => {
            const isActive = currentPage === key;
            return (
              <Link
                key={key}
                to={to}
                title={collapsed ? label : undefined}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                  transition-all duration-200
                  ${isActive
                    ? 'text-[#F8B137]'
                    : 'text-white hover:text-[#F8B137]'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                style={isActive ? { background: 'rgba(248, 177, 55, 0.12)' } : {}}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer profile */}
        <div className="border-t border-white/10 p-3 flex-shrink-0">
          <div className={`flex items-center gap-3 p-2 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
            <Avatar className="h-9 w-9 flex-shrink-0 border-2" style={{ borderColor: '#F8B137' }}>
              <AvatarFallback className="text-xs font-bold" style={{ background: '#F8B137', color: '#0a0a0a' }}>
                {getInitials(gestor?.full_name)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{gestor?.full_name}</p>
                  <p className="text-xs text-white/40">Gestor</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-lg border-b border-gray-100">
          <div className="flex items-center h-full px-4 lg:px-8 gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {currentPage === 'dashboard' && 'Dashboard'}
                {currentPage === 'feedbacks' && 'Feedbacks'}
                {currentPage === 'respostas' && 'Respostas'}
                {currentPage === 'meutime' && 'Meu Time'}
              </h2>
              <div className="h-0.5 w-full rounded-full mt-0.5" style={{ background: 'rgba(248, 177, 55, 0.4)' }} />
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}