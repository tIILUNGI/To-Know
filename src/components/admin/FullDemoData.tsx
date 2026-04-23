import { useState } from "react";
import { Users, Package, FileText, Plus, AlertTriangle, Calendar, CheckCircle, Star, TrendingUp } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const formFieldStyle = "text-xs font-bold uppercase tracking-wider text-gray-500 mb-1";
const inputStyle = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm";

export default function FullDemoData() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const createFullDemo = async () => {
    setLoading(true);
    try {
      const res = await fetch("/debug/fulldemo", { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        setStats(data);
        addToast("Dados demo completos criados!", "success");
      } else {
        addToast("Erro: " + (data.error || "?"), "error");
      }
    } catch (err: any) {
      addToast("Erro: " + err.message, "error");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center">
            <Plus size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Dados de Demonstração</h2>
            <p className="text-sm text-gray-500">Criar dados de teste para o sistema</p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
              <Users size={24} className="mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-blue-700">{stats.suppliers}</p>
              <p className="text-xs text-blue-600">Fornecedores</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
              <Users size={24} className="mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold text-green-700">{stats.clients}</p>
              <p className="text-xs text-green-600">Clientes</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-center">
              <FileText size={24} className="mx-auto text-amber-600 mb-2" />
              <p className="text-2xl font-bold text-amber-700">{stats.processes}</p>
              <p className="text-xs text-amber-600">Processos</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
              <Star size={24} className="mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-purple-700">{stats.evaluations}</p>
              <p className="text-xs text-purple-600">Avaliações</p>
            </div>
          </div>
        )}

        {!stats && (
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Package size={18} className="text-blue-600" />
                <span className="font-medium text-gray-900">5 Fornecedores</span>
              </div>
              <p className="text-xs text-gray-500">SUP-001 a SUP-005 - Fornecedores de várias áreas</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-green-600" />
                <span className="font-medium text-gray-900">5 Clientes</span>
              </div>
              <p className="text-xs text-gray-500">CLI-001 a CLI-005 - Clientes de vários setores</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={18} className="text-amber-600" />
                <span className="font-medium text-gray-900">10 Processos</span>
              </div>
              <p className="text-xs text-gray-500">Mistura de aprovação, avaliação e reavaliação</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-purple-600" />
                <span className="font-medium text-gray-900">20 Avaliações</span>
              </div>
              <p className="text-xs text-gray-500">Performance e Satisfação de fornecedores e clientes</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Star size={18} className="text-amber-500" />
                <span className="font-medium text-gray-900">12 Critérios</span>
              </div>
              <p className="text-xs text-gray-500">Para processos e avaliações</p>
            </div>
          </div>
        )}

        <button
          onClick={createFullDemo}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
        >
          {loading ? (
            "A criar..."
          ) : (
            <>
              <Plus size={20} /> Criar Dados Demo Completos
            </>
          )}
        </button>
      </div>
    </div>
  );
}