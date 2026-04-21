import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Package, FileText, Plus, AlertTriangle, Calendar, CheckCircle } from "lucide-react";
import { useToast } from "../../context/ToastContext";

export default function DemoDataCreator() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const createDemoData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/debug/createdemo");
      const data = await res.json();
      
      if (data.success) {
        addToast("Dados demo criados!", "success");
        setCreated(true);
      } else {
        addToast("Erro: " + (data.error || "?"), "error");
      }
    } catch (err) {
      addToast("Erro: " + err.message, "error");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Criar Dados de Demonstração</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} className="text-blue-600" />
              <span className="font-medium text-gray-900">Fornecedor Demo</span>
            </div>
            <p className="text-xs text-gray-500">SUP-001 - Fornecedor Demo Lda</p>
            <p className="text-xs text-gray-400">Risco: Médio</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} className="text-green-600" />
              <span className="font-medium text-gray-900">Cliente Demo</span>
            </div>
            <p className="text-xs text-gray-500">CLI-001 - Cliente Demo SA</p>
            <p className="text-xs text-gray-400">Risco: Baixo</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={18} className="text-amber-600" />
              <span className="font-medium text-gray-900">3 Processos</span>
            </div>
            <p className="text-xs text-gray-500">Aprovação, Avaliação, Reavaliação</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={18} className="text-purple-600" />
              <span className="font-medium text-gray-900">2 Avaliações</span>
            </div>
            <p className="text-xs text-gray-500">Performance + Satisfaction</p>
          </div>
        </div>

        <button
          onClick={createDemoData}
          disabled={loading}
          className="w-full bg-purple-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            "A criar..."
          ) : (
            <>
              <Plus size={20} /> Criar Dados Demo
            </>
          )}
        </button>
      </div>
    </div>
  );
}