import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, FileText, User, AlertCircle } from "lucide-react";
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

export default function ProcessCreate() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    process_number: "",
    process_type: "Aprovação",
    open_date: new Date().toISOString().split('T')[0],
    status: "Rascunho",
    responsible_name: "",
    responsible_position: "",
    responsible_mobile: "",
    responsible_email: "",
    requesting_area: "",
    justification: "",
    priority: "Normal"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        addToast("Processo criado com sucesso!", "success");
        navigate(`/processes/${data.id}`);
      } else {
        addToast("Erro ao criar processo.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setLoading(false);
  };

  const statusOptions = [
    { value: 'Rascunho', label: 'Rascunho' },
    { value: 'Em análise', label: 'Em análise' },
    { value: 'Submetido', label: 'Submetido' },
    { value: 'Em aprovação', label: 'Em aprovação' },
    { value: 'Aprovado', label: 'Aprovado' },
    { value: 'Reprovado', label: 'Reprovado' },
    { value: 'Pendente de informação', label: 'Pendente de informação' },
    { value: 'Encerrado', label: 'Encerrado' }
  ];

  const processTypeOptions = [
    { value: 'Aprovação', label: 'Aprovação' },
    { value: 'Avaliação', label: 'Avaliação' },
    { value: 'Reavaliação', label: 'Reavaliação' }
  ];

  const priorityOptions = [
    { value: 'Normal', label: 'Normal' },
    { value: 'Alta', label: 'Alta' },
    { value: 'Crítica', label: 'Crítica' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/processes")} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Novo Processo</h2>
            <p className="text-sm text-gray-500 mt-1">Crie um novo processo de aprovação ou avaliação.</p>
          </div>
        </div>
        <button
          type="submit"
          form="process-form"
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-200 disabled:opacity-50"
        >
          <Save size={20} /> {loading ? 'Criando...' : 'Criar Processo'}
        </button>
      </div>

      <form id="process-form" onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
        {/* Cabeçalho do Processo */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <FileText size={22} className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Cabeçalho do Processo</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField 
              label="Nº do Processo / Referência" 
              name="process_number" 
              value={formData.process_number} 
              onChange={handleChange} 
              placeholder="Ex: PROC-2024-001" 
            />
            <FormField 
              label="Tipo de Processo" 
              name="process_type" 
              value={formData.process_type} 
              onChange={handleChange} 
              options={processTypeOptions} 
            />
            <FormField 
              label="Data de Abertura" 
              name="open_date" 
              value={formData.open_date} 
              onChange={handleChange} 
              type="date" 
            />
            <FormField 
              label="Estado do Processo" 
              name="status" 
              value={formData.status} 
              onChange={handleChange} 
              options={statusOptions} 
            />
            <FormField 
              label="Prioridade" 
              name="priority" 
              value={formData.priority} 
              onChange={handleChange} 
              options={priorityOptions} 
            />
            <FormField 
              label="Área Requisitante" 
              name="requesting_area" 
              value={formData.requesting_area} 
              onChange={handleChange} 
              placeholder="Ex: Compras, Engenharia..." 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Justificativa do Processo</label>
              <textarea 
                name="justification" 
                value={formData.justification} 
                onChange={handleChange} 
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Descreva a justificativa para a criação deste processo..."
              />
            </div>
          </div>
        </div>

        {/* Responsável do Processo */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <User size={22} className="text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">Responsável do Processo</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormField 
              label="Nome do Responsável" 
              name="responsible_name" 
              value={formData.responsible_name} 
              onChange={handleChange} 
              placeholder="Nome completo" 
            />
            <FormField 
              label="Cargo" 
              name="responsible_position" 
              value={formData.responsible_position} 
              onChange={handleChange} 
              placeholder="Ex: Gestor de Compras" 
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

        {/* Info */}
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <AlertCircle size={20} className="text-blue-600" />
          <p className="text-sm text-blue-700">Após criar o processo, podrá selecionar o fornecedor/cliente e adicionar os critérios de avaliação.</p>
        </div>
      </form>
    </div>
  );
}