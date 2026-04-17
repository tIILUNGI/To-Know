import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, FileText, User, Package, Scale, TrendingUp, Star, AlertCircle } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const FormField = ({ label, name, value, onChange, type = "text", options = null, placeholder = "", gridSpan = "" }) => (
  <div className={`space-y-2 ${gridSpan}`}>
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    {options ? (
      <select name={name} value={value || ""} onChange={onChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all">
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
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
      />
    )}
  </div>
);

export default function EvaluationFormNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<any[]>([]);
  const [showSupplierSelect, setShowSupplierSelect] = useState(false);
  
  // Parse query params
  const evalType = searchParams.get('type') === 'Satisfaction' ? 'Satisfaction' : 'Performance';
  
  const [formData, setFormData] = useState({
    evaluation_number: "",
    evaluation_type: evalType === 'Satisfaction' ? 'Satisfação do fornecedor' : 'Performance do fornecedor',
    periodicity: "Trimestral",
    evaluation_date: new Date().toISOString().split('T')[0],
    period_start: "",
    period_end: "",
    evaluator_name: "",
    evaluation_type_detail: evalType
  });

  const [criteria, setCriteria] = useState([
    { id: 1, name: "Qualidade do fornecimento", weight: 10, score: 0, observation: "", evidence: "" },
    { id: 2, name: "Cumprimento de prazos", weight: 10, score: 0, observation: "", evidence: "" },
    { id: 3, name: "Conformidade documental", weight: 8, score: 0, observation: "", evidence: "" },
    { id: 4, name: "Confiabilidade", weight: 8, score: 0, observation: "", evidence: "" },
    { id: 5, name: "Capacidade de resposta", weight: 8, score: 0, observation: "", evidence: "" },
    { id: 6, name: "Flexibilidade", weight: 6, score: 0, observation: "", evidence: "" },
    { id: 7, name: "Atendimento", weight: 6, score: 0, observation: "", evidence: "" },
    { id: 8, name: "Preço vs valor entregue", weight: 8, score: 0, observation: "", evidence: "" },
    { id: 9, name: "Gestão de reclamações", weight: 6, score: 0, observation: "", evidence: "" },
    { id: 10, name: "Continuidade operacional", weight: 8, score: 0, observation: "", evidence: "" },
    { id: 11, name: "Segurança / HSE", weight: 6, score: 0, observation: "", evidence: "" },
    { id: 12, name: "Inovação e melhoria", weight: 6, score: 0, observation: "", evidence: "" }
  ]);

  const [resultData, setResultData] = useState({
    total_score: 0,
    percentage: 0,
    classification: "",
    recommended_action: "",
    action_plan: "",
    action_deadline: "",
    follow_up_responsible: ""
  });

  useEffect(() => {
    fetch("/api/entities?type=Supplier", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(data => setSuppliers(data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSupplier = (supplier) => {
    setSelectedSuppliers(prev => {
      const exists = prev.find(s => s.id === supplier.id);
      if (exists) {
        return prev.filter(s => s.id !== supplier.id);
      }
      return [...prev, supplier];
    });
  };

  const handleCriteriaChange = (id, field, value) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
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
    let recommended_action = "";
    
    if (percentage >= 90) {
      classification = "Excelente";
      recommended_action = "Manter";
    } else if (percentage >= 75) {
      classification = "Bom";
      recommended_action = "Manter";
    } else if (percentage >= 60) {
      classification = "Satisfatório";
      recommended_action = "Melhorar";
    } else if (percentage >= 40) {
      classification = "Insatisfatório";
      recommended_action = "Reavaliar";
    } else {
      classification = "Crítico";
      recommended_action = "Suspender";
    }
    
    setResultData(prev => ({
      ...prev,
      total_score: weightedScore.toFixed(1),
      percentage: percentage.toFixed(1),
      classification,
      recommended_action
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSuppliers.length === 0) {
      addToast("Selecione pelo menos um fornecedor.", "error");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...formData, supplier_ids: selectedSuppliers.map(s => s.id), criteria, result: resultData })
      });

      if (res.ok) {
        addToast("Avaliação salva com sucesso!", "success");
        navigate("/avaliacoes");
      } else {
        addToast("Erro ao salvar avaliação.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setLoading(false);
  };

  const evaluationTypeOptions = [
    { value: 'Performance do fornecedor', label: 'Performance do fornecedor' },
    { value: 'Satisfação do fornecedor', label: 'Satisfação do fornecedor' }
  ];

  const periodicityOptions = [
    { value: 'Mensal', label: 'Mensal' },
    { value: 'Trimestral', label: 'Trimestral' },
    { value: 'Semestral', label: 'Semestral' },
    { value: 'Anual', label: 'Anual' }
  ];

  const actionOptions = [
    { value: 'Manter', label: 'Manter' },
    { value: 'Melhorar', label: 'Melhorar' },
    { value: 'Reavaliar', label: 'Reavaliar' },
    { value: 'Suspender', label: 'Suspender' },
    { value: 'Desqualificar', label: 'Desqualificar' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/avaliacoes")} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {evalType === 'Satisfaction' ? 'Nova Pesquisa de Satisfação - Fornecedor' : 'Nova Avaliação de Performance - Fornecedor'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {evalType === 'Satisfaction' 
                ? 'Avalie o nível de satisfação com o desempenho dos fornecedores.' 
                : 'Avalie a performance dos fornecedores conforme critérios estabelecidos.'}
            </p>
          </div>
        </div>
        <button
          type="submit"
          form="evaluation-form"
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-200 disabled:opacity-50"
        >
          <Save size={20} /> {loading ? 'Salvando...' : 'Salvar Avaliação'}
        </button>
      </div>

      <form id="evaluation-form" onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
        {/* 9.1 Nova Avaliação */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <FileText size={22} className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Dados da Avaliação</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField 
              label="Nº da Avaliação" 
              name="evaluation_number" 
              value={formData.evaluation_number} 
              onChange={handleChange} 
              placeholder="Ex: AVL-2024-001" 
            />
            <FormField 
              label="Tipo de Avaliação" 
              name="evaluation_type" 
              value={formData.evaluation_type} 
              onChange={handleChange} 
              options={evaluationTypeOptions} 
            />
            <FormField 
              label="Periodicidade" 
              name="periodicity" 
              value={formData.periodicity} 
              onChange={handleChange} 
              options={periodicityOptions} 
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label="Responsável pela Avaliação" 
              name="evaluator_name" 
              value={formData.evaluator_name} 
              onChange={handleChange} 
              placeholder="Nome do avaliador" 
            />
          </div>
        </div>

        {/* Selecionar Fornecedor(es) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Package size={22} className="text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">Selecionar Fornecedor(es)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedSuppliers.map(supplier => (
              <div key={supplier.id} className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-gray-900">{supplier.name}</p>
                  <p className="text-xs text-gray-500">{supplier.code}</p>
                </div>
                <button type="button" onClick={() => toggleSupplier(supplier)} className="text-indigo-600 hover:text-indigo-700">
                  <Package size={18} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowSupplierSelect(!showSupplierSelect)}
            className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-2"
          >
            <Package size={18} />
            {showSupplierSelect ? 'Fechar' : 'Adicionar Fornecedor'}
          </button>

          {showSupplierSelect && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-100 rounded-xl">
              {suppliers.filter(s => !selectedSuppliers.find(ss => ss.id === s.id)).map(supplier => (
                <button
                  type="button"
                  key={supplier.id}
                  onClick={() => toggleSupplier(supplier)}
                  className="p-3 text-left bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-xl transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                  <p className="text-xs text-gray-500">{supplier.code} • {supplier.sector}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 9.2 Avaliação de Performance */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Scale size={22} className="text-amber-600" />
            <h3 className="text-lg font-bold text-gray-900">Avaliação de Performance do Fornecedor</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Critério</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-20">Peso</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-28">Nota (1-5)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Observação</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Evidência</th>
                </tr>
              </thead>
              <tbody>
                {criteria.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-gray-900">{c.name}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-gray-600">{c.weight}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={c.score}
                        onChange={(e) => handleCriteriaChange(c.id, 'score', Number(e.target.value))}
                        className="w-20 px-3 py-1 text-center text-sm font-bold bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value={0}>—</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={c.observation}
                        onChange={(e) => handleCriteriaChange(c.id, 'observation', e.target.value)}
                        className="w-full px-3 py-1 text-sm bg-gray-50 border border-gray-200 rounded-lg"
                        placeholder="Observação..."
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={c.evidence}
                        onChange={(e) => handleCriteriaChange(c.id, 'evidence', e.target.value)}
                        className="w-full px-3 py-1 text-sm bg-gray-50 border border-gray-200 rounded-lg"
                        placeholder="Evidência..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

        {/* 9.3 Resultado da Avaliação */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Star size={22} className="text-yellow-500" />
            <h3 className="text-lg font-bold text-gray-900">Resultado da Avaliação de Performance</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl text-center">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Pontuação Total</p>
              <p className="text-3xl font-bold text-blue-700">{resultData.total_score}</p>
            </div>
            <div className="p-6 bg-green-50 border border-green-100 rounded-2xl text-center">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Percentual</p>
              <p className="text-3xl font-bold text-green-700">{resultData.percentage}%</p>
            </div>
            <div className={`p-6 border rounded-2xl text-center ${resultData.classification === 'Excelente' || resultData.classification === 'Bom' ? 'bg-green-50 border-green-100' : resultData.classification === 'Satisfatório' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Classificação</p>
              <p className={`text-lg font-bold ${resultData.classification === 'Excelente' || resultData.classification === 'Bom' ? 'text-green-700' : resultData.classification === 'Satisfatório' ? 'text-amber-700' : 'text-red-700'}`}>
                {resultData.classification || "—"}
              </p>
            </div>
            <div className={`p-6 border rounded-2xl text-center ${resultData.recommended_action === 'Manter' ? 'bg-green-50 border-green-100' : resultData.recommended_action === 'Melhorar' || resultData.recommended_action === 'Reavaliar' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ação Recomendada</p>
              <p className={`text-lg font-bold ${resultData.recommended_action === 'Manter' ? 'text-green-700' : resultData.recommended_action === 'Melhorar' || resultData.recommended_action === 'Reavaliar' ? 'text-amber-700' : 'text-red-700'}`}>
                {resultData.recommended_action || "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Plano de Ação</label>
              <textarea 
                name="action_plan" 
                value={resultData.action_plan} 
                onChange={(e) => setResultData(prev => ({ ...prev, action_plan: e.target.value }))} 
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Descreva o plano de ação..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Observações</label>
              <textarea 
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Observações adicionais..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label="Prazo do Plano de Ação" 
              name="action_deadline" 
              value={resultData.action_deadline} 
              onChange={(e) => setResultData(prev => ({ ...prev, action_deadline: e.target.value }))} 
              type="date" 
            />
            <FormField 
              label="Responsável pelo Acompanhamento" 
              name="follow_up_responsible" 
              value={resultData.follow_up_responsible} 
              onChange={(e) => setResultData(prev => ({ ...prev, follow_up_responsible: e.target.value }))} 
              placeholder="Nome do responsável" 
            />
          </div>
        </div>
      </form>
    </div>
  );
}