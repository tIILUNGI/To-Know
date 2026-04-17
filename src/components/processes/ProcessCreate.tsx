import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, FileText, User, AlertCircle } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const FormField = ({ label, name, value, onChange, type = "text", options = null, placeholder = "", gridSpan = "", required = false, error }) => (
  <div className={`space-y-2 ${gridSpan}`}>
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {options ? (
      <select name={name} value={value || ""} onChange={onChange} className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${error ? 'border-red-500' : 'border-gray-200'}`}>
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
        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${error ? 'border-red-500' : 'border-gray-200'}`} 
      />
    )}
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

export default function ProcessCreate() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const { addToast } = useToast();
   const [loading, setLoading] = useState(false);
   const [errors, setErrors] = useState<Record<string, string>>({});
   const [processTypes, setProcessTypes] = useState<{value: string, label: string}[]>([]);

   // Get defaults from query params
   const entityType = searchParams.get('entity') === 'Client' ? 'Cliente' : 'Fornecedor';
   const defaultType = searchParams.get('type') === 'approval' ? 'Aprovação' : 'Avaliação';

   const [formData, setFormData] = useState({
     process_number: "",
     process_type: defaultType,
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

   useEffect(() => {
     fetch("/api/process-types", {
       headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
     })
       .then(res => res.json())
       .then(data => {
         const options = data.map((t: any) => ({ value: t.name, label: t.name }));
         setProcessTypes(options);
       })
       .catch(() => addToast("Erro ao carregar tipos de processo.", "error"));
   }, [addToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.process_type?.trim()) newErrors.process_type = "Tipo de processo é obrigatório";
    if (!formData.open_date?.trim()) newErrors.open_date = "Data é obrigatória";
    if (!formData.responsible_name?.trim()) newErrors.responsible_name = "Responsável é obrigatório";
    if (!formData.requesting_area?.trim()) newErrors.requesting_area = "Área requisitante é obrigatória";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast("Preencha todos os campos obrigatórios.", "error");
      return;
    }
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
         navigate(`/processos/${data.id}`);
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
     { value: 'Em análise', label: 'Em Análise' },
     { value: 'Pendente', label: 'Pendente' },
     { value: 'Submetido', label: 'Submetido' },
     { value: 'Em aprovação', label: 'Em Aprovação' },
     { value: 'Aprovado', label: 'Aprovado' },
     { value: 'Aprovado com restrições', label: 'Aprovado c/ Restrições' },
     { value: 'Reprovado', label: 'Reprovar' },
     { value: 'Encerrado', label: 'Encerrado' }
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
           <button onClick={() => navigate("/processos")} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
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
              error={undefined}
            />
             <FormField 
               label="Tipo de Processo" 
               name="process_type" 
               value={formData.process_type} 
               onChange={handleChange} 
               options={processTypes} 
               required={true}
               error={errors.process_type}
             />
            <FormField 
              label="Data de Abertura" 
              name="open_date" 
              value={formData.open_date} 
              onChange={handleChange} 
              type="date" 
              required={true}
              error={errors.open_date}
            />
            <FormField 
              label="Estado do Processo" 
              name="status" 
              value={formData.status} 
              onChange={handleChange} 
              options={statusOptions}
              error={undefined}
            />
            <FormField 
              label="Prioridade" 
              name="priority" 
              value={formData.priority} 
              onChange={handleChange} 
              options={priorityOptions}
              error={undefined}
            />
            <FormField 
              label="Área Requisitante" 
              name="requesting_area" 
              value={formData.requesting_area} 
              onChange={handleChange} 
              placeholder="Ex: Compras, Engenharia..." 
              required={true}
              error={errors.requesting_area}
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
              required={true}
              error={errors.responsible_name}
            />
            <FormField 
              label="Cargo" 
              name="responsible_position" 
              value={formData.responsible_position} 
              onChange={handleChange} 
              placeholder="Ex: Gestor de Compras"
              error={undefined}
            />
            <FormField 
              label="Telemóvel" 
              name="responsible_mobile" 
              value={formData.responsible_mobile} 
              onChange={handleChange} 
              placeholder="+244 XXX XXX XXX"
              required={true}
              error={errors.responsible_mobile}
            />
            <FormField 
              label="Email" 
              name="responsible_email" 
              value={formData.responsible_email} 
              onChange={handleChange} 
              type="email" 
              placeholder="email@empresa.co.ao"
              required={true}
              error={errors.responsible_email}
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