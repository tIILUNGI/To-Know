import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, FileText, User, Package, Upload, X, CheckCircle2, Scale, TrendingUp, Check, AlertTriangle } from "lucide-react";
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

export default function ApprovalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<any[]>([]);
  const [showSupplierSelect, setShowSupplierSelect] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [allCriteria, setAllCriteria] = useState<any[]>([]);
  const [selectedCriteriaIds, setSelectedCriteriaIds] = useState<number[]>([]);
  const [showCriteriaSelect, setShowCriteriaSelect] = useState(false);
   const [resultData, setResultData] = useState({
     total_score: 0,
     final_percentage: 0,
     compliance_level: "",
     final_classification: "",
     validity_date: "",
     next_evaluation_date: "",
     conditions: "",
     final_comments: "",
     approver_name: "",
     decision_date: new Date().toISOString().split('T')[0]
   });

   useEffect(() => {
     fetch("/api/entities?type=Supplier", {
       headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
     })
       .then(res => res.json())
       .then(data => setSuppliers(data))
       .catch(() => {});

     fetch("/api/criteria", {
       headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
     })
       .then(res => res.json())
       .then(data => {
         // Filter criteria for approval (default to all or filter by process_type)
         setAllCriteria(data);
       })
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

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('name', file.name);

    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formDataUpload
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(prev => [...prev, { name: file.name, url: data.url }]);
        addToast("Documento anexado com sucesso!", "success");
      }
    } catch {
      addToast("Erro ao enviar documento.", "error");
    }
    setUploading(false);
  };

  const handleCriteriaChange = (id, field, value) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, [field]: field === 'score' ? Number(value) : value } : c));
  };

  const toggleCriteria = (criterion: any) => {
    setSelectedCriteriaIds(prev => {
      const exists = prev.find(id => id === criterion.id);
      if (exists) {
        return prev.filter(id => id !== criterion.id);
      }
      return [...prev, criterion.id];
    });
  };

  // Atualiza criteria baseado nos critérios selecionados
  useEffect(() => {
    const selected = allCriteria
      .filter(c => selectedCriteriaIds.includes(c.id))
      .map(c => ({
        id: c.id,
        name: c.name,
        description: c.description || "",
        weight: c.weight || 10,
        max_score: c.max_score || 100,
        score: 0,
        evidence: ""
      }));
    setCriteria(selected);
  }, [selectedCriteriaIds, allCriteria]);

  const calculateResults = () => {
    let totalWeight = 0;
    let weightedScore = 0;
    criteria.forEach(c => {
      totalWeight += c.weight;
      weightedScore += (c.score / c.max_score) * c.weight;
    });
    const percentage = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
    
    let compliance = "";
    let classification = "";
    if (percentage >= 75) {
      compliance = "Conforme";
      classification = "Aprovado";
    } else if (percentage >= 50) {
      compliance = "Parcialmente conforme";
      classification = "Aprovado com restrições";
    } else {
      compliance = "Não conforme";
      classification = "Reprovado";
    }
    
    setResultData(prev => ({
      ...prev,
      total_score: weightedScore.toFixed(1),
      final_percentage: percentage.toFixed(1),
      compliance_level: compliance,
      final_classification: classification
    }));
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSuppliers.length === 0) {
      addToast("Selecione pelo menos um fornecedor.", "error");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...formData, supplier_ids: selectedSuppliers.map(s => s.id), documents, criteria, result: resultData })
      });

      if (res.ok) {
        addToast("Aprovação salva com sucesso!", "success");
        navigate("/processos");
      } else {
        addToast("Erro ao salvar aprovação.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setLoading(false);
  };

  const approvalTypeOptions = [
    { value: 'Parceria', label: 'Parceria' },
    { value: 'Compra', label: 'Compra' },
    { value: 'Subcontratação', label: 'Subcontratação' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Aprovação de Fornecedores</h2>
          </div>
        </div>
        <button
          type="submit"
          form="approval-form"
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-200 disabled:opacity-50"
        >
          <Save size={20} /> {loading ? 'Salvando...' : 'Salvar Aprovação'}
        </button>
      </div>

      <form id="approval-form" onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
        {/* Dados da Aprovação */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <CheckCircle2 size={22} className="text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Dados da Aprovação</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField 
              label="Referência do Processo" 
              name="process_reference" 
              value={formData.process_reference} 
              onChange={handleChange} 
              placeholder="Ex: PROC-2024-001" 
            />
            <FormField 
              label="Aprovação para" 
              name="approval_type" 
              value={formData.approval_type} 
              onChange={handleChange} 
              options={approvalTypeOptions} 
            />
            <FormField 
              label="Data da Aprovação" 
              name="approval_date" 
              value={formData.approval_date} 
              onChange={handleChange} 
              type="date" 
            />
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

         {/* Selecionar Fornecedor(es) */}
         <div className="space-y-6">
           <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
             <Package size={22} className="text-blue-600" />
             <h3 className="text-lg font-bold text-gray-900">Selecionar Fornecedor(es)</h3>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
             {selectedSuppliers.map(supplier => (
               <div key={supplier.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                 <div>
                   <p className="text-sm font-bold text-gray-900">{supplier.name}</p>
                   <p className="text-xs text-gray-500">{supplier.code}</p>
                 </div>
                 <button type="button" onClick={() => toggleSupplier(supplier)} className="text-green-600 hover:text-green-700">
                   <X size={18} />
                 </button>
               </div>
             ))}
           </div>

           <button
             type="button"
             onClick={() => setShowSupplierSelect(!showSupplierSelect)}
             className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center gap-2"
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
                   className="p-3 text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-colors"
                 >
                   <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                   <p className="text-xs text-gray-500">{supplier.code} • {supplier.sector}</p>
                 </button>
               ))}
               {suppliers.length === 0 && (
                 <p className="col-span-full text-center text-gray-400 py-4">Nenhum fornecedor disponível.</p>
               )}
             </div>
           )}
         </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
             {criteria.map(c => (
               <div key={c.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                 <div>
                   <p className="text-sm font-bold text-gray-900">{c.name}</p>
                   <p className="text-xs text-gray-500">Peso: {c.weight}% • Máx: {c.max_score} pts</p>
                 </div>
                 <button type="button" onClick={() => toggleCriteria(allCriteria.find(ac => ac.id === c.id))} className="text-blue-600 hover:text-blue-700">
                   <X size={18} />
                 </button>
               </div>
             ))}
           </div>

           <button
             type="button"
             onClick={() => setShowCriteriaSelect(!showCriteriaSelect)}
             className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center gap-2"
           >
             <Plus size={18} />
             {showCriteriaSelect ? 'Fechar' : 'Adicionar Critérios'}
           </button>

           {showCriteriaSelect && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-100 rounded-xl">
               {allCriteria.filter(c => !selectedCriteriaIds.includes(c.id)).map(criterion => (
                 <button
                   type="button"
                   key={criterion.id}
                   onClick={() => toggleCriteria(criterion)}
                   className="p-3 text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-colors"
                 >
                   <p className="text-sm font-medium text-gray-900">{criterion.name}</p>
                   <p className="text-xs text-gray-500">Peso: {criterion.weight}% • Máx: {c.max_score} pts</p>
                 </button>
               ))}
             </div>
           )}
         </div>

         {/* Critérios de Aprovação */}
         <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <FileText size={22} className="text-amber-600" />
            <h3 className="text-lg font-bold text-gray-900">Motivo e Justificação</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Motivo da Aprovação</label>
              <textarea 
                name="approval_reason" 
                value={formData.approval_reason} 
                onChange={handleChange} 
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Descreva o motivo da aprovação..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Necessidade Operacional</label>
              <textarea 
                name="operational_necessity" 
                value={formData.operational_necessity} 
                onChange={handleChange} 
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Descreva a necessidade operacional que Justifica a aprovação..."
              />
            </div>
          </div>
        </div>

        {/* Anexar Documentos */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Upload size={22} className="text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">Anexar Documentos de Suporte</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText size={18} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                </div>
                <button type="button" onClick={() => removeDocument(index)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-3 px-6 py-4 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
            <Upload size={22} className="text-gray-400" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">{uploading ? 'Enviando...' : 'Carregar documento'}</span>
              <span className="text-xs text-gray-400">PDF, Word, Excel até 10MB</span>
            </div>
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept=".pdf,.doc,.docx,.xls,.xlsx" />
          </label>
        </div>

        {/* Critérios de Aprovação */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Scale size={22} className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Critérios de Aprovação do Fornecedor</h3>
          </div>

           <div className="overflow-x-auto">
             <table className="w-full min-w-[800px]">
               <thead>
                 <tr className="bg-gray-50 border-b border-gray-200">
                   <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Critério</th>
                   <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Descrição</th>
                   <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-20">Peso</th>
                   <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-24">Max</th>
                   <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-28">Pontuação</th>
                   <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Evidência / Comentário</th>
                 </tr>
               </thead>
               <tbody>
                 {criteria.map((c) => (
                   <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                     <td className="px-4 py-3">
                       <span className="text-sm font-bold text-gray-900">{c.name}</span>
                     </td>
                     <td className="px-4 py-3">
                       <span className="text-xs text-gray-500">{c.description}</span>
                     </td>
                     <td className="px-4 py-3 text-center">
                       <span className="text-sm font-medium text-gray-600">{c.weight}%</span>
                     </td>
                     <td className="px-4 py-3 text-center">
                       <span className="text-sm text-gray-600">/{c.max_score}</span>
                     </td>
                     <td className="px-4 py-3">
                       <input
                         type="number"
                         value={c.score}
                         onChange={(e) => handleCriteriaChange(c.id, 'score', e.target.value)}
                         className="w-24 px-3 py-1 text-center text-sm font-bold bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                         placeholder="0-100"
                         min="0"
                         max={c.max_score}
                       />
                     </td>
                     <td className="px-4 py-3">
                       <input
                         type="text"
                         value={c.evidence}
                         onChange={(e) => handleCriteriaChange(c.id, 'evidence', e.target.value)}
                         className="w-full px-3 py-1 text-sm bg-gray-50 border border-gray-200 rounded-lg"
                         placeholder="Evidência ou comentário..."
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

        {/* Resultado da Aprovação */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <CheckCircle2 size={22} className="text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Resultado da Aprovação</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl text-center">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Pontuação Total</p>
              <p className="text-3xl font-bold text-blue-700">{resultData.total_score}</p>
            </div>
            <div className="p-6 bg-green-50 border border-green-100 rounded-2xl text-center">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Percentagem Final</p>
              <p className="text-3xl font-bold text-green-700">{resultData.final_percentage}%</p>
            </div>
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl text-center">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Nível de Conformidade</p>
              <p className="text-lg font-bold text-amber-700">{resultData.compliance_level || "—"}</p>
            </div>
            <div className={`p-6 border rounded-2xl text-center ${resultData.final_classification === 'Aprovado' ? 'bg-green-50 border-green-100' : resultData.final_classification === 'Aprovado com restrições' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Classificação Final</p>
              <p className={`text-lg font-bold ${resultData.final_classification === 'Aprovado' ? 'text-green-700' : resultData.final_classification === 'Aprovado com restrições' ? 'text-amber-700' : 'text-red-700'}`}>
                {resultData.final_classification || "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label="Validade da Aprovação" 
              name="validity_date" 
              value={resultData.validity_date} 
              onChange={(e) => setResultData(prev => ({ ...prev, validity_date: e.target.value }))} 
              type="date" 
            />
            <FormField 
              label="Data de Próxima Reavaliação" 
              name="next_evaluation_date" 
              value={resultData.next_evaluation_date} 
              onChange={(e) => setResultData(prev => ({ ...prev, next_evaluation_date: e.target.value }))} 
              type="date" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Condições / Restrições</label>
              <textarea 
                name="conditions" 
                value={resultData.conditions} 
                onChange={(e) => setResultData(prev => ({ ...prev, conditions: e.target.value }))} 
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Condições ou restrições da aprovação..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Comentários Finais</label>
              <textarea 
                name="final_comments" 
                value={resultData.final_comments} 
                onChange={(e) => setResultData(prev => ({ ...prev, final_comments: e.target.value }))} 
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Comentários finais..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label="Aprovador Final" 
              name="approver_name" 
              value={resultData.approver_name} 
              onChange={(e) => setResultData(prev => ({ ...prev, approver_name: e.target.value }))} 
              placeholder="Nome do aprovador final" 
            />
            <FormField 
              label="Data de Decisão" 
              name="decision_date" 
              value={resultData.decision_date} 
              onChange={(e) => setResultData(prev => ({ ...prev, decision_date: e.target.value }))} 
              type="date" 
            />
          </div>
        </div>
      </form>
    </div>
  );
}