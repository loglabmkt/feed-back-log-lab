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
import Companies from './pages/Companies';
import Employees from './pages/Employees';
import Feedbacks from './pages/Feedbacks';
import Managers from './pages/Managers';
import MinhaEquipe from './pages/MinhaEquipe';
import Painel from './pages/Painel';
import Relatorios from './pages/Relatorios';
import Usuarios from './pages/Usuarios';
import CriarFeedback from './pages/CriarFeedback';
import PreencherFeedback from './pages/PreencherFeedback';
import RevisarFeedback from './pages/RevisarFeedback';
import VisualizarFeedback from './pages/VisualizarFeedback';
import ValidarFeedback from './pages/ValidarFeedback';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcessoPublicoFeedback": AcessoPublicoFeedback,
    "Companies": Companies,
    "Employees": Employees,
    "Feedbacks": Feedbacks,
    "Managers": Managers,
    "MinhaEquipe": MinhaEquipe,
    "Painel": Painel,
    "Relatorios": Relatorios,
    "Usuarios": Usuarios,
    "CriarFeedback": CriarFeedback,
    "PreencherFeedback": PreencherFeedback,
    "RevisarFeedback": RevisarFeedback,
    "VisualizarFeedback": VisualizarFeedback,
    "ValidarFeedback": ValidarFeedback,
}

export const pagesConfig = {
    mainPage: "Feedbacks",
    Pages: PAGES,
    Layout: __Layout,
};