import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/common/Layout";
import Login from "./components/Login";
import Dashboard from "./components/dashboard/Dashboard";
import EntityList from "./components/entities/EntityList";
import EntityForm from "./components/entities/EntityForm";
import ProcessWorkflow from "./components/processes/ProcessWorkflow";
import ProcessDetail from "./components/processes/ProcessDetail";
import EvaluationForm from "./components/evaluations/EvaluationForm";
import EvaluationList from "./components/evaluations/EvaluationList";
import CriteriaSettings from "./components/admin/CriteriaSettings";
import ReportsView from "./components/reports/ReportsView";
import UserProfile from "./components/profile/UserProfile";

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
              <Route path="processes" element={<ProcessWorkflow />} />
              <Route path="processes/:id" element={<ProcessDetail />} />
              <Route path="evaluations" element={<EvaluationList />} />
              <Route path="evaluations/new" element={<EvaluationForm />} />
              <Route path="reports" element={<ReportsView />} />
              <Route path="admin" element={<CriteriaSettings />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}
