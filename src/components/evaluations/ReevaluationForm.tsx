import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, FileText, User, Package, RotateCcw, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
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

export default function ReevaluationForm() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showSupplierSelect, setShowSupplierSelect] = useState(false);

  const [formData, setFormData] = useState({
    reevaluation_number: "",
    previous_process_reference: "",
    reevaluation_reason: "",
    reevaluation_date: new Date().toISOString().split('T')[0],
    responsible_name: "",
    previous_result: "",
    current_result: "",
    score_difference: 0,
    final_decision: "",
    observations: ""
  });

  const reasonOptions = [
    { value: 'Vencimento da aprovação', label: 'Vencimento da aprovação' },
    { value: 'Baixo desempenho', label: 'Baixo desempenho' },
    { value: 'Ocorrência crítica', label: 'Ocorrência crítica' },
    { value: 'Alteração de escopo', label: 'Alteração de escopo' },
    { value: 'Risco reputacional', label: 'Risco reputacional' },
    { value: 'Mudança de dados legais ou fiscais', label: 'Mudança de dados legais ou fiscais' }
  ];

  const decisionOptions = [
    { value: 'Mantido', label: 'Mantido' },
    { value: 'Mantido com condição', label: 'Mantido com condição' },
    { value: 'Suspenso', label: 'Suspenso' },
    { value: 'Excluído', label: 'Excluído' }
  ];

  const criteriaOptions = [
    { value: 'Regularidade legal', label: 'Regularidade legal' },
    { value: 'Regularidade fiscal', label: 'Regularidade fiscal' },
    { value: 'Capacidade técnica', label: 'Capacidade técnica' },
    { value: 'Capacidade financeira', label: 'Capacidade financeira' },
    { value: 'Qualidade do fornecimento', label: 'Qualidade do fornecimento' },
    { value: 'Cumprimento de prazos', label: 'Cumprimento de prazos' },
    { value: 'Conformidade documental', label: 'Conformidade documental' },
    { value: 'Segurança e conformidade', label: 'Segurança e conformidade' }
  ];

  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);

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

  const toggleCriteria = (criteria) => {
    setSelectedCriteria(prev => {
      if (prev.includes(criteria)) {
        return prev.filter(c => c !== criteria);
      }
      return [...prev, criteria];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) {
      addToast("Selecione um fornecedor.", "error");
      return;
    }
    setLoading(true);

    const responses = (selectedCriteria || []).map(c => ({
      group_name: "Reavaliação",
      criterion_name: c.name,
      score: c.score || 0,
      observation: ""
    }));

    const evalName = formData.name || `Reavaliação - ${selectedSupplier.name}`;

    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          entity_id: selectedSupplier.id,
          type: 'Supplier',
          evaluation_type: 'Reavaliação',
          evaluation_type_detail: 'Reavaliação',
          name: evalName,
          periodicity: "Pontual",
          period: formData.evaluation_date,
          responses: responses
        })
      });

       if (res.ok) {
          addToast("Reavaliação salva com sucesso!", "success");
          navigate("/avaliacoes");
        } else {
          const err = await res.json();
          addToast(err.message || "Erro ao salvar reavaliação.", "error");
        }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setLoading(false);
  };

  const calculateDifference = () => {
    const current = parseFloat(formData.current_result) || 0;
    const previous = parseFloat(formData.previous_result) || 0;
    const diff = current - previous;
    setFormData(prev => ({ ...prev, score_difference: diff }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/avaliacoes")} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reavaliação de Fornecedores</h2>
          </div>
        </div>
        <button
          type="submit"
          form="reevaluation-form"
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-200 disabled:opacity-50"
        >
          <Save size={20} /> {loading ? 'Salvando...' : 'Salvar Reavaliação'}
        </button>
      </div>

      <form id="reevaluation-form" onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
        {/* 11.1 Quando usar - Info */}
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <AlertTriangle size={22} className="text-amber-600" />
          <div>
            <p className="text-sm font-bold text-amber-800">Motivos para Reavaliação</p>
            <p className="text-xs text-amber-700 mt-1">
              Use quando: vencimento da aprovação, baixo desempenho, ocorrência crítica, alteração de escopo, risco reputacional, mudança de dados legais ou fiscais.
            </p>
          </div>
        </div>

        {/* 11.2 Campos da Reavaliação */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <RotateCcw size={22} className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Dados da Reavaliação</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField 
              label="Nº da Reavaliação" 
              name="reevaluation_number" 
              value={formData.reevaluation_number} 
              onChange={handleChange} 
              placeholder="Ex: REAV-2024-001" 
            />
            <FormField 
              label="Referência ao Processo Anterior" 
              name="previous_process_reference" 
              value={formData.previous_process_reference} 
              onChange={handleChange} 
              placeholder="Ex: PROC-2023-001" 
            />
            <FormField 
              label="Motivo da Reavaliação" 
              name="reevaluation_reason" 
              value={formData.reevaluation_reason} 
              onChange={handleChange} 
              options={reasonOptions} 
            />
            <FormField 
              label="Data" 
              name="reevaluation_date" 
              value={formData.reevaluation_date} 
              onChange={handleChange} 
              type="date" 
            />
            <FormField 
              label="Responsável" 
              name="responsible_name" 
              value={formData.responsible_name} 
              onChange={handleChange} 
              placeholder="Nome do responsável" 
            />
          </div>
        </div>

        {/* Selecionar Fornecedor */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Package size={22} className="text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">Fornecedor a Reavaliar</h3>
          </div>

          {selectedSupplier ? (
            <div className="flex items-center justify-between p-6 bg-indigo-50 border border-indigo-200 rounded-2xl">
              <div>
                <p className="text-lg font-bold text-gray-900">{selectedSupplier.name}</p>
                <p className="text-sm text-gray-500">{selectedSupplier.code} • {selectedSupplier.sector}</p>
              </div>
              <button type="button" onClick={() => setSelectedSupplier(null)} className="text-indigo-600 hover:text-indigo-700">
                <Package size={20} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSupplierSelect(!showSupplierSelect)}
              className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-2"
            >
              <Package size={18} />
              {showSupplierSelect ? 'Fechar' : 'Selecionar Fornecedor'}
            </button>
          )}

          {showSupplierSelect && !selectedSupplier && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-100 rounded-xl">
              {suppliers.map(supplier => (
                <button
                  type="button"
                  key={supplier.id}
                  onClick={() => { setSelectedSupplier(supplier); setShowSupplierSelect(false); }}
                  className="p-3 text-left bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-xl transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                  <p className="text-xs text-gray-500">{supplier.code} • {supplier.sector}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Critérios Reavaliados */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <FileText size={22} className="text-amber-600" />
            <h3 className="text-lg font-bold text-gray-900">Critérios Reavaliados</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {criteriaOptions.map(criteria => (
              <button
                type="button"
                key={criteria.value}
                onClick={() => toggleCriteria(criteria.value)}
                className={`p-3 text-left border rounded-xl transition-colors ${
                  selectedCriteria.includes(criteria.value)
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                <span className="text-sm font-medium">{criteria.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Resultados */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <TrendingUp size={22} className="text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Resultados</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormField 
              label="Resultado Anterior (%)" 
              name="previous_result" 
              value={formData.previous_result} 
              onChange={handleChange} 
              type="number" 
              placeholder="0-100" 
            />
            <FormField 
              label="Resultado Atual (%)" 
              name="current_result" 
              value={formData.current_result} 
              onChange={handleChange} 
              type="number" 
              placeholder="0-100" 
            />
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Diferença</p>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${formData.score_difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.score_difference > 0 ? '+' : ''}{formData.score_difference}%
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={calculateDifference}
              className="px-4 py-2 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors"
            >
              Calcular Diferença
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label="Decisão Final" 
              name="final_decision" 
              value={formData.final_decision} 
              onChange={handleChange} 
              options={decisionOptions} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Observações</label>
            <textarea 
              name="observations" 
              value={formData.observations} 
              onChange={handleChange} 
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              placeholder="Observações sobre a reavaliação..."
            />
          </div>
        </div>

        {/* Decisão Final Badge */}
        {formData.final_decision && (
          <div className={`p-6 border rounded-2xl ${
            formData.final_decision === 'Mantido' ? 'bg-green-50 border-green-200' :
            formData.final_decision === 'Mantido com condição' ? 'bg-amber-50 border-amber-200' :
            formData.final_decision === 'Suspenso' ? 'bg-orange-50 border-orange-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {formData.final_decision === 'Mantido' ? <CheckCircle2 size={24} className="text-green-600" /> :
               formData.final_decision === 'Mantido com condição' ? <AlertTriangle size={24} className="text-amber-600" /> :
               formData.final_decision === 'Suspenso' ? <RotateCcw size={24} className="text-orange-600" /> :
               <AlertTriangle size={24} className="text-red-600" />}
              <div>
                <p className="text-sm font-bold text-gray-700">Decisão Final</p>
                <p className={`text-lg font-bold ${
                  formData.final_decision === 'Mantido' ? 'text-green-700' :
                  formData.final_decision === 'Mantido com condição' ? 'text-amber-700' :
                  formData.final_decision === 'Suspenso' ? 'text-orange-700' :
                  'text-red-700'
                }`}>{formData.final_decision}</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}