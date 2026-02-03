import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import "./globals.css";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Páginas públicas que não devem mostrar o layout administrativo
  const publicPages = [
    '/gestorlogin',
    '/gestorcadastro', 
    '/colaborador',
    '/painelgestor',
    '/gestorfeedbacks'
  ];
  
  // Usar correspondência exata ou inicial para evitar conflitos (ex: /colaborador vs /colaboradores)
  const isPublicPage = publicPages.some(page => {
    const pathname = location.pathname.toLowerCase();
    const pageLower = page.toLowerCase();
    // Verifica se é exatamente a página ou se começa com a página + querystring
    return pathname === pageLower || pathname.startsWith(pageLower + '?');
  });

  // Páginas que requerem autenticação Base44 (Admin)
  const adminPages = [
    '/painel',
    '/empresas',
    '/gestores',
    '/colaboradores',
    '/feedbacks',
    '/relatorios',
    '/usuarios',
    '/minhaequipe',
    '/criarfeedback',
    '/editarfeedback',
    '/preencherfeedback',
    '/revisarfeedback',
    '/visualizarfeedback'
  ];

  const isAdminPage = adminPages.some(page => {
    const pathname = location.pathname.toLowerCase();
    const pageLower = page.toLowerCase();
    // Verifica se é exatamente a página ou se começa com a página + querystring
    return pathname === pageLower || pathname.startsWith(pageLower + '?');
  });

  useEffect(() => {
    if (!isPublicPage) {
      loadUser();
    }
  }, [isPublicPage]);

  useEffect(() => {
    // Se for página admin e não estiver autenticado, redirecionar para login Base44
    const checkAdminAuth = async () => {
      if (isAdminPage && !user) {
        try {
          const userData = await base44.auth.me();
          if (!userData) {
            base44.auth.redirectToLogin(window.location.pathname);
          } else {
            setUser(userData);
          }
        } catch (e) {
          base44.auth.redirectToLogin(window.location.pathname);
        }
      }
    };
    
    if (!isPublicPage) {
      checkAdminAuth();
    }
  }, [isAdminPage, user, isPublicPage]);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isAdmin = user?.role === 'admin';

  const isManager = user?.role !== 'admin' && user?.manager_id !== user?.id;

  const navigation = [
    { 
      name: "Painel", 
      href: createPageUrl("Painel"), 
      icon: LayoutDashboard,
      show: true 
    },
    { 
      name: "Empresas", 
      href: createPageUrl("Empresas"), 
      icon: Shield,
      show: isAdmin 
    },
    { 
      name: "Gestores", 
      href: createPageUrl("Gestores"), 
      icon: Shield,
      show: isAdmin 
    },
    { 
      name: "Colaboradores", 
      href: createPageUrl("Colaboradores"), 
      icon: Users,
      show: isAdmin 
    },
    { 
      name: "Minha Equipe", 
      href: createPageUrl("MinhaEquipe"), 
      icon: Users,
      show: isManager 
    },
    { 
      name: "Feedbacks", 
      href: createPageUrl("Feedbacks"), 
      icon: MessageSquare,
      show: true 
    },
    { 
      name: "Respostas", 
      href: createPageUrl("Respostas"), 
      icon: MessageSquare,
      show: isAdmin 
    },
    { 
      name: "Relatórios", 
      href: createPageUrl("Relatorios"), 
      icon: BarChart3,
      show: isAdmin 
    },
  ];

  const filteredNav = navigation.filter(item => item.show);

  // Se for página pública, renderiza apenas o conteúdo sem layout
  if (isPublicPage) {
    return <>{children}</>;
  }

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
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{background: '#F8B137', boxShadow: '0 4px 14px rgba(248, 177, 55, 0.3)'}}>
                <Shield className="w-5 h-5" style={{color: '#14141E'}} />
              </div>
              <div>
                <h1 className="font-bold tracking-tight" style={{color: '#14141E'}}>Compliance RH</h1>
                <p className="text-[10px] uppercase tracking-wider" style={{color: '#F8B137'}}>Gestão de Pessoas</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => {
              const isActive = location.pathname.includes(item.href.split('?')[0]);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                    transition-all duration-200 relative
                    ${isActive 
                      ? 'text-slate-900' 
                      : 'text-slate-600 hover:text-slate-900'
                    }
                  `}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, rgba(248, 177, 55, 0.15) 0%, rgba(248, 177, 55, 0.05) 100%)',
                    borderLeft: '3px solid #F8B137'
                  } : {}}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-[#F8B137]' : 'text-slate-400'}`} />
                  {item.name}
                  {item.badge && (
                    <Badge className="ml-auto text-white text-xs px-2" style={{background: '#F8B137'}}>
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{background: 'linear-gradient(135deg, rgba(248, 177, 55, 0.1) 0%, rgba(248, 177, 55, 0.05) 100%)'}}>
              <Avatar className="h-10 w-10 border-2 shadow-sm" style={{borderColor: '#F8B137'}}>
                <AvatarFallback className="text-white text-sm font-bold" style={{background: '#F8B137'}}>
                  {getInitials(user?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user?.full_name || 'Usuário'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {isAdmin ? 'Administrador' : 'Colaborador'}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="text-slate-400 hover:bg-red-50"
                style={{color: '#14141E'}}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#14141E'}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-lg border-b" style={{borderColor: 'rgba(248, 177, 55, 0.1)'}}>
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>

            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold text-slate-900">
                {currentPageName === 'Painel' && 'Visão Geral'}
                {currentPageName === 'Empresas' && 'Empresas'}
                {currentPageName === 'Gestores' && 'Gestores'}
                {currentPageName === 'Colaboradores' && 'Colaboradores'}
                {currentPageName === 'MinhaEquipe' && 'Minha Equipe'}
                {currentPageName === 'Usuarios' && 'Gestão de Usuários'}
                {currentPageName === 'Feedbacks' && 'Feedbacks & Rituais'}
                {currentPageName === 'Respostas' && 'Respostas dos Gestores'}
                {currentPageName === 'Relatorios' && 'Relatórios & BI'}
                {currentPageName === 'CriarFeedback' && 'Criar Feedback'}
                {currentPageName === 'PreencherFeedback' && 'Preencher Feedback'}
                {currentPageName === 'RevisarFeedback' && 'Revisar Feedback'}
                {currentPageName === 'VisualizarFeedback' && 'Visualizar Feedback'}
                {currentPageName === 'ValidarFeedback' && 'Validar Feedback'}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-white text-xs font-bold" style={{background: '#F8B137'}}>
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium text-slate-700">
                      {user?.full_name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user?.full_name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}