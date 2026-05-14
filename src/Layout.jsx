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
  Shield,
  AlertCircle
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Páginas públicas que não devem mostrar o layout administrativo
  const publicPages = [
    '/gestorlogin',
    '/gestorcadastro',
    '/colaboradorlogin',
    '/colaboradorcadastro',
    '/colaborador',
    '/painelgestor',
    '/gestorfeedbacks',
    '/gerenciarfeedback',
    '/avaliacaotrimestral',
    '/avaliacaoexperiencia45',
    '/avaliacaoqualidadeservico90',
    '/registro11',
    '/confirmarfeedback'
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
    if (isAdminPage) {
      // Para páginas admin, verificar autenticação antes de mostrar qualquer coisa
      const checkAuth = async () => {
        const isAuthenticated = await base44.auth.isAuthenticated();
        if (!isAuthenticated) {
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }
        const userData = await base44.auth.me();
        if (!userData) {
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }
        setUser(userData);
      };
      checkAuth();
    } else if (!isPublicPage) {
      loadUser();
    }
  }, [isAdminPage, isPublicPage]);

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
      name: "Prestadores", 
      href: "/Prestadores", 
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
      name: "Atrasados", 
      href: "/Atrasados", 
      icon: AlertCircle,
      iconColor: "text-red-400",
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
        fixed top-0 left-0 z-50 h-full border-r border-slate-700
        transform transition-all duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'w-20' : 'w-72'}
      `} style={{background: '#14141E'}}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-center px-4 border-b border-slate-700">
            {!sidebarCollapsed ? (
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6980e7673597ded54b61feca/68c8706a7_LOG-LAB-TECNOLOGIA-QUE-TRANSFORMA-NOVA-BRANCO-LARANJA.png"
                alt="LogLab"
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: '#F9B136'}}>
                <Shield className="w-5 h-5" style={{color: '#14141E'}} />
              </div>
            )}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute right-4 p-2 hover:bg-slate-700 rounded-lg"
            >
              <X className="w-5 h-5 text-white" />
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
                      ? 'text-[#F9B136]' 
                      : 'text-white hover:text-[#F9B136]'
                    }
                  `}
                  style={isActive ? {
                    background: 'rgba(249, 177, 54, 0.1)',
                    borderLeft: '3px solid #F9B136'
                  } : {}}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#F9B136]' : (item.iconColor || '')}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <Badge className="text-white text-xs px-2" style={{background: '#F9B136'}}>
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section and collapse button */}
          <div className="border-t border-slate-700">
            {/* Collapse Toggle */}
            <div className="p-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-full flex items-center justify-center p-3 rounded-xl text-white hover:text-[#F9B136] transition-colors"
                style={{background: 'rgba(249, 177, 54, 0.1)'}}
              >
                {sidebarCollapsed ? (
                  <Menu className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
              </button>
            </div>
            
            {/* User Info */}
            <div className="p-4">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{background: 'rgba(249, 177, 54, 0.1)'}}>
                <Avatar className="h-10 w-10 border-2 shadow-sm flex-shrink-0" style={{borderColor: '#F9B136'}}>
                  <AvatarFallback className="text-white text-sm font-bold" style={{background: '#F9B136'}}>
                    {getInitials(user?.full_name)}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {user?.full_name || 'Usuário'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {isAdmin ? 'Administrador' : 'Colaborador'}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleLogout}
                      className="text-white hover:text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-lg border-b" style={{borderColor: 'rgba(248, 177, 55, 0.1)'}}>
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>

            <h2 className="text-lg font-semibold text-slate-900">
              {currentPageName === 'Painel' && 'Visão Geral'}
              {currentPageName === 'Empresas' && 'Empresas'}
              {currentPageName === 'Gestores' && 'Gestores'}
              {currentPageName === 'Colaboradores' && 'Colaboradores'}
              {currentPageName === 'Prestadores' && 'Prestadores'}
              {currentPageName === 'DetalhesPrestador' && 'Detalhes do Prestador'}
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
              {currentPageName === 'AvaliacaoQualidadeServico90' && 'Avaliação de Qualidade de Serviço 90 Dias'}
              {currentPageName === 'Registro11' && 'Registro de 1:1'}
              {currentPageName === 'Atrasados' && 'Rituais Atrasados'}
            </h2>
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