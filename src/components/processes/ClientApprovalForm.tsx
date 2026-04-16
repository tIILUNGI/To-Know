import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, FileText, User, Package, Scale, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const FormField = ({ label, name, value, onChange, type = "text", options = null, placeholder = "", gridSpan = "" }) => (
  <div className={`space-y-2 ${gridSpan}`}>
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    {options ? (
      <select name={name} value={value || ""} onChange={onChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
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
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
      />
    )}
  </div>
);

export default function ClientApprovalForm() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientSelect, setShowClientSelect] = useState(false);

  const [formData, setFormData] = useState({
    process_number: "",
    process_type: "Aprovação",
    process_date: new Date().toISOString().split('T')[0],
    responsible_name: "",
    responsible_position: "",
    responsible_mobile: "",
    responsible_email: "",
    approval_reason: "",
    credit_limit: "",
    special_conditions: "",
    validity_date: "",
    reevaluation_date: ""
  });

  const [criteria, setCriteria] = useState([
    { id: 1, name: "Identificação validada", score: 0, max_score: 100 },
    { id: 2, name: "Regularidade legal", score: 0, max_score: 100 },
    { id: 3, name: "Histórico comercial", score: 0, max_score: 100 },
    { id: 4, name: "Capacidade financeira", score: 0, max_score: 100 },
    { id: 5, name: "Risco de crédito", score: 0, max_score: 100 },
    { id: 6, name: "Risco reputacional", score: 0, max_score: 100 },
    { id: 7, name: "Conformidade documental", score: 0, max_score: 100 },
    { id: 8, name: "Potencial de negócio", score: 0, max_score: 100 },
    { id: 9, name: "Aderência ao perfil de cliente desejado", score: 0, max_score: 100 },
    { id: 10, name: "Risco de branqueamento / compliance", score: 0, max_score: 100 }
  ]);

  const [resultData, setResultData] = useState({
    total_score: 0,
    risk_classification: "",
    decision: "",
  });

  const processTypeOptions = [
    { value: 'Aprovação', label: 'Aprovação' },
    { value: 'Avaliação', label: 'Avaliação' },
    { value: 'Reavaliação', label: 'Reavaliação' }
  ];

  const decisionOptions = [
    { value: 'Aprovado', label: 'Aprovado' },
    { value: 'Aprovado com restrições', label: 'Aprovado com restrições' },
    { value: 'Reprovado', label: 'Reprovado' }
  ];

  const riskOptions = [
    { value: 'Baixo', label: 'Baixo' },
    { value: 'Médio', label: 'Médio' },
    { value: 'Alto', label: 'Alto' }
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
    const total = criteria.reduce((sum, c) => sum + c.score, 0);
    const percentage = total / criteria.length;
    
    let risk = "";
    let decision = "";
    
    if (percentage >= 75) {
      risk = "Baixo";
      decision = "Aprovado";
    } else if (percentage >= 50) {
      risk = "Médio";
      decision = "Aprovado com restrições";
    } else {
      risk = "Alto";
      decision = "Reprovado";
    }
    
    setResultData({ total_score: total, risk_classification: risk, decision });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClient) {
      addToast("Selecione um cliente.", "error");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/client-approvals", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...formData, client_id: selectedClient.id, criteria, result: resultData })
      });

      if (res.ok) {
        addToast("Aprovação salva com sucesso!", "success");
        navigate("/processes");
      } else {
        addToast("Erro ao salvar aprovação.", "error");
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
          <button onClick={() => navigate("/processes")} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Aprovação de Clientes</h2>
            <p className="text-sm text-gray-500 mt-1">Processo de aprovação e avaliação de clientes.</p>
          </div>
        </div>
        <button
          type="submit"
          form="client-approval-form"
          disabled={loading}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50"
        >
          <Save size={20} /> {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <form id="client-approval-form" onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
        {/* 12.1 Cabeçalho */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <FileText size={22} className="text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">Cabeçalho do Processo</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField 
              label="Nº do Processo" 
              name="process_number" 
              value={formData.process_number} 
              onChange={handleChange} 
              placeholder="Ex: PROC-CLI-001" 
            />
            <FormField 
              label="Tipo de Processo" 
              name="process_type" 
              value={formData.process_type} 
              onChange={handleChange} 
              options={processTypeOptions} 
            />
            <FormField 
              label="Data" 
              name="process_date" 
              value={formData.process_date} 
              onChange={handleChange} 
              type="date" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormField 
              label="Responsável do Processo" 
              name="responsible_name" 
              value={formData.responsible_name} 
              onChange={handleChange} 
              placeholder="Nome" 
            />
            <FormField 
              label="Cargo" 
              name="responsible_position" 
              value={formData.responsible_position} 
              onChange={handleChange} 
              placeholder="Cargo" 
            />
            <FormField 
              label="Telemóvel" 
              name="responsible_mobile" 
              value={formData.responsible_mobile} 
              onChange={handleChange} 
              placeholder="+244 XXX XXX XXX" 
            />
            <FormField 
              label="Email" 
              name="responsible_email" 
              value={formData.responsible_email} 
              onChange={handleChange} 
              type="email" 
              placeholder="email@empresa.co.ao" 
            />
          </div>
        </div>

        {/* Selecionar Cliente */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Package size={22} className="text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">Selecionar Cliente</h3>
          </div>

          {selectedClient ? (
            <div className="flex items-center justify-between p-6 bg-purple-50 border border-purple-200 rounded-2xl">
              <div>
                <p className="text-lg font-bold text-gray-900">{selectedClient.name}</p>
                <p className="text-sm text-gray-500">{selectedClient.code} • {selectedClient.segment}</p>
              </div>
              <button type="button" onClick={() => setSelectedClient(null)} className="text-purple-600 hover:text-purple-700">
                <Package size={20} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowClientSelect(!showClientSelect)}
              className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center gap-2"
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
                  className="p-3 text-left bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{client.name}</p>
                  <p className="text-xs text-gray-500">{client.code} • {client.segment}</p>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Motivo da Aprovação</label>
            <textarea 
              name="approval_reason" 
              value={formData.approval_reason} 
              onChange={handleChange} 
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder="Descreva o motivo da aprovação..."
            />
          </div>
        </div>

        {/* 12.2 Critérios de Aprovação */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Scale size={22} className="text-amber-600" />
            <h3 className="text-lg font-bold text-gray-900">Critérios de Aprovação do Cliente</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criteria.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <span className="text-sm font-medium text-gray-700 flex-1">{c.name}</span>
                <input
                  type="number"
                  value={c.score}
                  onChange={(e) => handleCriteriaChange(c.id, e.target.value)}
                  className="w-20 px-3 py-1.5 text-center text-sm font-bold bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0-100"
                  min="0"
                  max="100"
                />
                <span className="text-xs text-gray-400 w-8">/100</span>
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

        {/* 12.3 Resultado */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <CheckCircle2 size={22} className="text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Resultado</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl text-center">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Pontuação Total</p>
              <p className="text-3xl font-bold text-blue-700">{resultData.total_score}</p>
            </div>
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl text-center">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Classificação de Risco</p>
              <p className="text-lg font-bold text-amber-700">{resultData.risk_classification || "—"}</p>
            </div>
            <div className={`p-6 border rounded-2xl text-center ${
              resultData.decision === 'Aprovado' ? 'bg-green-50 border-green-100' :
              resultData.decision === 'Aprovado com restrições' ? 'bg-amber-50 border-amber-100' :
              resultData.decision === 'Reprovado' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
            }`}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Decisão</p>
              <p className={`text-lg font-bold ${
                resultData.decision === 'Aprovado' ? 'text-green-700' :
                resultData.decision === 'Aprovado com restrições' ? 'text-amber-700' :
                resultData.decision === 'Reprovado' ? 'text-red-700' : 'text-gray-500'
              }`}>{resultData.decision || "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField 
              label="Limite de Crédito Aprovado" 
              name="credit_limit" 
              value={formData.credit_limit} 
              onChange={handleChange} 
              placeholder="Valor" 
            />
            <FormField 
              label="Validade da Aprovação" 
              name="validity_date" 
              value={formData.validity_date} 
              onChange={handleChange} 
              type="date" 
            />
            <FormField 
              label="Data de Reavaliação" 
              name="reevaluation_date" 
              value={formData.reevaluation_date} 
              onChange={handleChange} 
              type="date" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Condições Especiais</label>
            <textarea 
              name="special_conditions" 
              value={formData.special_conditions} 
              onChange={handleChange} 
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder="Condições especiais..."
            />
          </div>
        </div>
      </form>
    </div>
  );
}