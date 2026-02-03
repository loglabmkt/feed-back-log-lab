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
import CriarFeedback from './pages/CriarFeedback';
import EditarFeedback from './pages/EditarFeedback';
import Feedbacks from './pages/Feedbacks';
import MinhaEquipe from './pages/MinhaEquipe';
import Painel from './pages/Painel';
import PreencherFeedback from './pages/PreencherFeedback';
import Relatorios from './pages/Relatorios';
import RevisarFeedback from './pages/RevisarFeedback';
import Usuarios from './pages/Usuarios';
import ValidarFeedback from './pages/ValidarFeedback';
import VisualizarFeedback from './pages/VisualizarFeedback';
import Empresas from './pages/Empresas';
import Gestores from './pages/Gestores';
import Colaboradores from './pages/Colaboradores';
import GestorCadastro from './pages/GestorCadastro';
import GestorLogin from './pages/GestorLogin';
import PainelGestor from './pages/PainelGestor';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcessoPublicoFeedback": AcessoPublicoFeedback,
    "CriarFeedback": CriarFeedback,
    "EditarFeedback": EditarFeedback,
    "Feedbacks": Feedbacks,
    "MinhaEquipe": MinhaEquipe,
    "Painel": Painel,
    "PreencherFeedback": PreencherFeedback,
    "Relatorios": Relatorios,
    "RevisarFeedback": RevisarFeedback,
    "Usuarios": Usuarios,
    "ValidarFeedback": ValidarFeedback,
    "VisualizarFeedback": VisualizarFeedback,
    "Empresas": Empresas,
    "Gestores": Gestores,
    "Colaboradores": Colaboradores,
    "GestorCadastro": GestorCadastro,
    "GestorLogin": GestorLogin,
    "PainelGestor": PainelGestor,
}

export const pagesConfig = {
    mainPage: "Painel",
    Pages: PAGES,
    Layout: __Layout,
};