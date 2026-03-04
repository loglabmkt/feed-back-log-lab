/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AcessoPublicoFeedback from './pages/AcessoPublicoFeedback';
import AvaliacaoTrimestral from './pages/AvaliacaoTrimestral';
import Colaborador from './pages/Colaborador';
import ColaboradorCadastro from './pages/ColaboradorCadastro';
import ColaboradorLogin from './pages/ColaboradorLogin';
import Colaboradores from './pages/Colaboradores';
import CriarFeedback from './pages/CriarFeedback';
import EditarFeedback from './pages/EditarFeedback';
import Empresas from './pages/Empresas';
import Feedbacks from './pages/Feedbacks';
import GerenciarFeedback from './pages/GerenciarFeedback';
import GestorCadastro from './pages/GestorCadastro';
import GestorFeedbacks from './pages/GestorFeedbacks';
import GestorLogin from './pages/GestorLogin';
import Gestores from './pages/Gestores';
import MinhaEquipe from './pages/MinhaEquipe';
import Painel from './pages/Painel';
import PainelGestor from './pages/PainelGestor';
import PreencherFeedback from './pages/PreencherFeedback';
import Relatorios from './pages/Relatorios';
import Respostas from './pages/Respostas';
import RevisarFeedback from './pages/RevisarFeedback';
import Usuarios from './pages/Usuarios';
import ValidarFeedback from './pages/ValidarFeedback';
import VisualizarFeedback from './pages/VisualizarFeedback';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcessoPublicoFeedback": AcessoPublicoFeedback,
    "AvaliacaoTrimestral": AvaliacaoTrimestral,
    "Colaborador": Colaborador,
    "ColaboradorCadastro": ColaboradorCadastro,
    "ColaboradorLogin": ColaboradorLogin,
    "Colaboradores": Colaboradores,
    "CriarFeedback": CriarFeedback,
    "EditarFeedback": EditarFeedback,
    "Empresas": Empresas,
    "Feedbacks": Feedbacks,
    "GerenciarFeedback": GerenciarFeedback,
    "GestorCadastro": GestorCadastro,
    "GestorFeedbacks": GestorFeedbacks,
    "GestorLogin": GestorLogin,
    "Gestores": Gestores,
    "MinhaEquipe": MinhaEquipe,
    "Painel": Painel,
    "PainelGestor": PainelGestor,
    "PreencherFeedback": PreencherFeedback,
    "Relatorios": Relatorios,
    "Respostas": Respostas,
    "RevisarFeedback": RevisarFeedback,
    "Usuarios": Usuarios,
    "ValidarFeedback": ValidarFeedback,
    "VisualizarFeedback": VisualizarFeedback,
}

export const pagesConfig = {
    mainPage: "Painel",
    Pages: PAGES,
    Layout: __Layout,
};