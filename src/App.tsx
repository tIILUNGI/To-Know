import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/common/Layout";
import Login from "./components/Login";
import Dashboard from "./components/dashboard/Dashboard";
import EntityList from "./components/entities/EntityList";
import EntityForm from "./components/entities/EntityForm";
import EntityHistory from "./components/entities/EntityHistory";
import ProcessWorkflow from "./components/processes/ProcessWorkflow";
import ProcessDetail from "./components/processes/ProcessDetail";
import ProcessCreate from "./components/processes/ProcessCreate";
import EvaluationFormNew from "./components/evaluations/EvaluationFormNew";
import ReevaluationForm from "./components/evaluations/ReevaluationForm";
import ClientEvaluationForm from "./components/evaluations/ClientEvaluationForm";
import EvaluationForm from "./components/evaluations/EvaluationForm";
import EvaluationList from "./components/evaluations/EvaluationList";
import CriteriaSettings from "./components/admin/CriteriaSettings";
import ReportsView from "./components/reports/ReportsView";
import UserProfile from "./components/profile/UserProfile";
import SettingsSelection from "./components/admin/SettingsSelection";
import UserList from "./components/users/UserList";
import UserForm from "./components/users/UserForm";
import RolesInfo from "./components/users/RolesInfo";
import ProcessTypesSettings from "./components/settings/ProcessTypesSettings";
import AlertsPage from "./components/common/AlertsPage";
import DemoDataCreator from "./components/admin/DemoDataCreator";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="h-screen w-screen flex items-center justify-center text-blue-600 font-bold">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm font-black uppercase tracking-widest animate-pulse-soft">Carregando...</span>
        </div>
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  return children;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="entities/suppliers" element={<EntityList type="Supplier" />} />
              <Route path="entities/clients" element={<EntityList type="Client" />} />
              <Route path="entities/new" element={<EntityForm />} />
              <Route path="entities/:id" element={<EntityForm />} />
              <Route path="entities/:id/history" element={<EntityHistory />} />
              
              {/* Processos */}
              <Route path="processos" element={<ProcessWorkflow />} />
              <Route path="processos/novo" element={<ProcessCreate />} />
              <Route path="processos/:id" element={<ProcessDetail />} />
              
              {/* Avaliações */}
              <Route path="avaliacoes" element={<EvaluationList />} />
              <Route path="avaliacoes/nova" element={<EvaluationFormNew />} />
              <Route path="avaliacoes/reevaluation" element={<ReevaluationForm />} />
              <Route path="avaliacoes/cliente" element={<ClientEvaluationForm />} />
              <Route path="avaliacoes/:id" element={<EvaluationForm />} />
              

              
              {/* Relatórios */}
              <Route path="relatorios" element={<ReportsView />} />
              
               {/* Configurações */}
               <Route path="configuracoes" element={<SettingsSelection />} />
               <Route path="admin" element={<CriteriaSettings />} />
               <Route path="configuracoes/utilizadores" element={<UserList />} />
               <Route path="configuracoes/utilizadores/novo" element={<UserForm />} />
               <Route path="configuracoes/utilizadores/:id" element={<UserForm />} />
               <Route path="configuracoes/perfis" element={<RolesInfo />} />
               <Route path="configuracoes/tipos-processo" element={<ProcessTypesSettings />} />
               <Route path="alertas" element={<AlertsPage />} />
               <Route path="demo/criar" element={<DemoDataCreator />} />
              
              <Route path="profile" element={<UserProfile />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}
