import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, FileText, User, Package, Scale, TrendingUp, Star } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const FormField = ({ label, name, value, onChange, type = "text", options = null, placeholder = "", gridSpan = "" }) => (
  <div className={`space-y-2 ${gridSpan}`}>
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    {options ? (
      <select name={name} value={value || ""} onChange={onChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all">
        <option value="">Selecione...</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    ) : (
      <input 
        type={type} 
        name={name} 
        value={value || ""} 
        onChange={onChange} 
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all" 
      />
    )}
  </div>
);

export default function ClientEvaluationForm() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientSelect, setShowClientSelect] = useState(false);

  const [formData, setFormData] = useState({
    evaluation_number: "",
    evaluation_type: "Performance do cliente",
    evaluation_date: new Date().toISOString().split('T')[0],
    period_start: "",
    period_end: "",
    evaluator_name: ""
  });

  const [criteria, setCriteria] = useState([
    { id: 1, name: "Pontualidade no pagamento", weight: 12, score: 0 },
    { id: 2, name: "Volume de compras", weight: 10, score: 0 },
    { id: 3, name: "Frequência de relacionamento", weight: 8, score: 0 },
    { id: 4, name: "Cumprimento contratual", weight: 10, score: 0 },
    { id: 5, name: "Qualidade da comunicação", weight: 8, score: 0 },
    { id: 6, name: "Estabilidade da relação comercial", weight: 10, score: 0 },
    { id: 7, name: "Ocorrência de litígios", weight: 8, score: 0 },
    { id: 8, name: "Rentabilidade do cliente", weight: 10, score: 0 },
    { id: 9, name: "Fidelização", weight: 8, score: 0 },
    { id: 10, name: "Potencial de crescimento", weight: 8, score: 0 }
  ]);

  const [resultData, setResultData] = useState({
    total_score: 0,
    percentage: 0,
    classification: "",
    decision: ""
  });

  const evaluationTypeOptions = [
    { value: 'Performance do cliente', label: 'Performance do cliente' },
    { value: 'Satisfação do cliente', label: 'Satisfação do cliente' }
  ];

  const decisionOptions = [
    { value: 'Manter', label: 'Manter' },
    { value: 'Desenvolver', label: 'Desenvolver' },
    { value: 'Rever condições', label: 'Rever condições' },
    { value: 'Restringir', label: 'Restringir' },
    { value: 'Encerrar relacionamento', label: 'Encerrar relacionamento' }
  ];

  useEffect(() => {
    fetch("/api/entities?type=Client", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(data => setClients(data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCriteriaChange = (id, value) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, score: Number(value) } : c));
  };

  const calculateResults = () => {
    let totalWeight = 0;
    let weightedScore = 0;
    criteria.forEach(c => {
      totalWeight += c.weight;
      weightedScore += (c.score / 5) * c.weight;
    });
    const percentage = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
    
    let classification = "";
    let decision = "";
    
    if (percentage >= 90) {
      classification = "Excelente";
      decision = "Manter";
    } else if (percentage >= 75) {
      classification = "Bom";
      decision = "Desenvolver";
    } else if (percentage >= 60) {
      classification = "Regular";
      decision = "Rever condições";
    } else if (percentage >= 40) {
      classification = "Fraco";
      decision = "Restringir";
    } else {
      classification = "Crítico";
      decision = "Encerrar relacionamento";
    }
    
    setResultData({ total_score: weightedScore.toFixed(1), percentage: percentage.toFixed(1), classification, decision });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClient) {
      addToast("Selecione um cliente.", "error");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/client-evaluations", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...formData, client_id: selectedClient.id, criteria, result: resultData })
      });

      if (res.ok) {
        addToast("Avaliação salva com sucesso!", "success");
        navigate("/evaluations");
      } else {
        addToast("Erro ao salvar avaliação.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/evaluations")} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Avaliação de Clientes</h2>
            <p className="text-sm text-gray-500 mt-1">Avalie a performance ou satisfação dos clientes.</p>
          </div>
        </div>
        <button
          type="submit"
          form="client-evaluation-form"
          disabled={loading}
          className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-purple-700 active:scale-95 transition-all shadow-xl shadow-purple-200 disabled:opacity-50"
        >
          <Save size={20} /> {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <form id="client-evaluation-form" onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
        {/* 13.1 Tipos de Avaliação */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <FileText size={22} className="text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">Dados da Avaliação</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField 
              label="Nº da Avaliação" 
              name="evaluation_number" 
              value={formData.evaluation_number} 
              onChange={handleChange} 
              placeholder="Ex: AVL-CLI-001" 
            />
            <FormField 
              label="Tipo de Avaliação" 
              name="evaluation_type" 
              value={formData.evaluation_type} 
              onChange={handleChange} 
              options={evaluationTypeOptions} 
            />
            <FormField 
              label="Data da Avaliação" 
              name="evaluation_date" 
              value={formData.evaluation_date} 
              onChange={handleChange} 
              type="date" 
            />
            <FormField 
              label="Período Início" 
              name="period_start" 
              value={formData.period_start} 
              onChange={handleChange} 
              type="date" 
            />
            <FormField 
              label="Período Fim" 
              name="period_end" 
              value={formData.period_end} 
              onChange={handleChange} 
              type="date" 
            />
            <FormField 
              label="Responsável" 
              name="evaluator_name" 
              value={formData.evaluator_name} 
              onChange={handleChange} 
              placeholder="Nome do avaliador" 
            />
          </div>
        </div>

        {/* Selecionar Cliente */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Package size={22} className="text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">Selecionar Cliente</h3>
          </div>

          {selectedClient ? (
            <div className="flex items-center justify-between p-6 bg-indigo-50 border border-indigo-200 rounded-2xl">
              <div>
                <p className="text-lg font-bold text-gray-900">{selectedClient.name}</p>
                <p className="text-sm text-gray-500">{selectedClient.code} • {selectedClient.segment}</p>
              </div>
              <button type="button" onClick={() => setSelectedClient(null)} className="text-indigo-600 hover:text-indigo-700">
                <Package size={20} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowClientSelect(!showClientSelect)}
              className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-2"
            >
              <Package size={18} />
              {showClientSelect ? 'Fechar' : 'Selecionar Cliente'}
            </button>
          )}

          {showClientSelect && !selectedClient && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-100 rounded-xl">
              {clients.map(client => (
                <button
                  type="button"
                  key={client.id}
                  onClick={() => { setSelectedClient(client); setShowClientSelect(false); }}
                  className="p-3 text-left bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-xl transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{client.name}</p>
                  <p className="text-xs text-gray-500">{client.code} • {client.segment}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 13.2 Avaliação de Performance */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Scale size={22} className="text-amber-600" />
            <h3 className="text-lg font-bold text-gray-900">Avaliação de Performance do Cliente</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criteria.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">{c.name}</span>
                  <span className="text-xs text-gray-400 ml-2">({c.weight}%)</span>
                </div>
                <select
                  value={c.score}
                  onChange={(e) => handleCriteriaChange(c.id, e.target.value)}
                  className="w-24 px-3 py-1.5 text-center text-sm font-bold bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value={0}>—</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={calculateResults}
            className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-amber-600 transition-colors"
          >
            <TrendingUp size={20} />
            Calcular Resultado
          </button>
        </div>

        {/* Resultado */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Star size={22} className="text-yellow-500" />
            <h3 className="text-lg font-bold text-gray-900">Resultado</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl text-center">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Pontuação Total</p>
              <p className="text-3xl font-bold text-blue-700">{resultData.total_score}</p>
            </div>
            <div className="p-6 bg-green-50 border border-green-100 rounded-2xl text-center">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Percentual</p>
              <p className="text-3xl font-bold text-green-700">{resultData.percentage}%</p>
            </div>
            <div className={`p-6 border rounded-2xl text-center ${
              resultData.classification === 'Excelente' || resultData.classification === 'Bom' ? 'bg-green-50 border-green-100' :
              resultData.classification === 'Regular' ? 'bg-amber-50 border-amber-100' :
              'bg-red-50 border-red-100'
            }`}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Classificação</p>
              <p className={`text-lg font-bold ${
                resultData.classification === 'Excelente' || resultData.classification === 'Bom' ? 'text-green-700' :
                resultData.classification === 'Regular' ? 'text-amber-700' : 'text-red-700'
              }`}>{resultData.classification || "—"}</p>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Decisão</p>
            <p className={`text-xl font-bold ${
              resultData.decision === 'Manter' || resultData.decision === 'Desenvolver' ? 'text-green-700' :
              resultData.decision === 'Rever condições' ? 'text-amber-700' :
              resultData.decision === 'Restringir' ? 'text-orange-700' :
              resultData.decision === 'Encerrar relacionamento' ? 'text-red-700' : 'text-gray-500'
            }`}>{resultData.decision || "—"}</p>
          </div>
        </div>
      </form>
    </div>
  );
}