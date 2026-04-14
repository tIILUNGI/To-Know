import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, History, FileText, Globe, MapPin, DollarSign, ShieldAlert, Upload, File, UserCircle } from "lucide-react";

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
      active ? "border-blue-600 text-blue-600 bg-blue-50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

const FormField = ({ label, name, value, onChange, type = "text", options = null, placeholder = "" }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    {options ? (
      <select name={name} value={value || ""} onChange={onChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all">
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
        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
      />
    )}
  </div>
);

export default function EntityForm() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("identificacao");
  const [formData, setFormData] = useState<any>({
    entity_type: location.state?.type || "Supplier",
    status: "In Analysis",
    country: "Angola",
    currency: "AOA"
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id && id !== "new") {
      setLoading(true);
      fetch(`/api/entities/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => {
        setFormData(data);
        setLoading(false);
      });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (checked ? 1 : 0) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = id && id !== "new" ? "PUT" : "POST";
    const url = id && id !== "new" ? `/api/entities/${id}` : "/api/entities";
    
    const res = await fetch(url, {
      method,
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      navigate(-1);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center font-bold text-blue-600">Carregando formulário...</div>;

  const isClient = formData.entity_type === 'Client';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{id && id !== "new" ? `Editar ${formData.name}` : `Novo ${isClient ? 'Cliente' : 'Fornecedor'}`}</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${isClient ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>{formData.entity_type}</span>
               <span className="text-gray-300">•</span>
               <span className="text-xs font-bold text-gray-500">{formData.status}</span>
            </div>
          </div>
        </div>
        <button
          type="submit"
          form="entity-form"
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-200"
        >
          <Save size={20} /> Salvar Cadastro
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
        <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide bg-gray-50/50">
          <TabButton active={activeTab === "identificacao"} onClick={() => setActiveTab("identificacao")} icon={FileText} label="Identificação" />
          <TabButton active={activeTab === "localizacao"} onClick={() => setActiveTab("localizacao")} icon={MapPin} label="Localização" />
          <TabButton active={activeTab === "responsavel"} onClick={() => setActiveTab("responsavel")} icon={UserCircle} label="Responsável" />
          <TabButton active={activeTab === "classificacao"} onClick={() => setActiveTab("classificacao")} icon={Globe} label="Classificação" />
          <TabButton active={activeTab === "financeiro"} onClick={() => setActiveTab("financeiro")} icon={DollarSign} label={isClient ? "Comercial" : "Financeiro"} />
          <TabButton active={activeTab === "compliance"} onClick={() => setActiveTab("compliance")} icon={ShieldAlert} label="Compliance/Risco" />
          {id && id !== "new" && (
            <TabButton active={activeTab === "documentos"} onClick={() => setActiveTab("documentos")} icon={File} label="Documentos" />
          )}
          {id && id !== "new" && (
            <TabButton active={activeTab === "historico"} onClick={() => setActiveTab("historico")} icon={History} label="Histórico" />
          )}
        </div>

        <form id="entity-form" onSubmit={handleSubmit} className="p-10">
          {activeTab === "identificacao" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2">
              <FormField label="Código" name="code" value={formData.code} onChange={handleChange} placeholder="GER-001" />
              <div className="lg:col-span-2">
                <FormField label="Razão Social / Nome Completo" name="name" value={formData.name} onChange={handleChange} />
              </div>
              <FormField label="Nome Comercial" name="trade_name" value={formData.trade_name} onChange={handleChange} />
              <FormField label="Tipo de Entidade" name="sub_type" value={formData.sub_type} onChange={handleChange} options={[
                { value: 'Company', label: 'Empresa' },
                { value: 'Individual', label: 'Individual' },
                { value: 'Public', label: 'Pública/Estado' }
              ]} />
              <FormField label="NIF / Identificação Fiscal" name="tax_id" value={formData.tax_id} onChange={handleChange} />
              <FormField label="Registo Comercial / Alvará" name="registration_number" value={formData.registration_number} onChange={handleChange} />
              <FormField label="Estado" name="status" value={formData.status} onChange={handleChange} options={[
                { value: 'Active', label: 'Ativo' },
                { value: 'In Analysis', label: 'Em Análise' },
                { value: 'Inactive', label: 'Inativo' },
                { value: 'Suspended', label: 'Suspenso' }
              ]} />
            </div>
          )}

          {activeTab === "localizacao" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="lg:col-span-2">
                <FormField label="Endereço Completo" name="address" value={formData.address} onChange={handleChange} />
              </div>
              <FormField label="Província" name="province" value={formData.province} onChange={handleChange} />
              <FormField label="Município" name="municipality" value={formData.municipality} onChange={handleChange} />
              <FormField label="País" name="country" value={formData.country} onChange={handleChange} />
              <FormField label="Telefone Fixo" name="phone" value={formData.phone} onChange={handleChange} />
              <FormField label="Telemóvel" name="mobile" value={formData.mobile} onChange={handleChange} />
              <FormField label="Email Principal" name="email_main" value={formData.email_main} onChange={handleChange} type="email" />
              <FormField label="Website" name="website" value={formData.website} onChange={handleChange} />
            </div>
          )}

          {activeTab === "responsavel" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2">
              <FormField label="Nome do Responsável" name="resp_name" value={formData.resp_name} onChange={handleChange} />
              <FormField label="Cargo" name="resp_position" value={formData.resp_position} onChange={handleChange} />
              <FormField label="Telemóvel" name="resp_mobile" value={formData.resp_mobile} onChange={handleChange} />
              <FormField label="Email" name="resp_email" value={formData.resp_email} onChange={handleChange} type="email" />
            </div>
          )}

          {activeTab === "classificacao" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2">
              <FormField label="Sector de Atividade" name="sector" value={formData.sector} onChange={handleChange} />
              <FormField label="Impacto Operacional" name="operational_impact" value={formData.operational_impact} onChange={handleChange} options={[
                { value: 'Low', label: 'Baixo' },
                { value: 'Medium', label: 'Médio' },
                { value: 'High', label: 'Alto' }
              ]} />
              <FormField label="Criticidade" name="criticality" value={formData.criticality} onChange={handleChange} options={[
                { value: 'Low', label: 'Baixa' },
                { value: 'Medium', label: 'Média' },
                { value: 'High', label: 'Alta' }
              ]} />
              <FormField label="Área Solicitante" name="requesting_area" value={formData.requesting_area} onChange={handleChange} />
              <FormField label="Unidade de Negócio" name="business_unit" value={formData.business_unit} onChange={handleChange} />
              {!isClient && <FormField label="Tipo de Fornecimento" name="supply_type" value={formData.supply_type} onChange={handleChange} options={[
                { value: 'Material', label: 'Material' },
                { value: 'Service', label: 'Serviço' },
                { value: 'Both', label: 'Ambos' }
              ]} />}
            </div>
          )}

          {activeTab === "financeiro" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2">
              <FormField label="Condição de Pagamento" name="payment_condition" value={formData.payment_condition} onChange={handleChange} />
              <FormField label="Moeda" name="currency" value={formData.currency} onChange={handleChange} />
              <FormField label="Banco" name="bank" value={formData.bank} onChange={handleChange} />
              <div className="lg:col-span-2">
                <FormField label="IBAN" name="iban" value={formData.iban} onChange={handleChange} />
              </div>
              <FormField label={isClient ? "Limite de Crédito" : "Limite Contratual"} name={isClient ? "credit_limit" : "contract_limit"} value={isClient ? formData.credit_limit : formData.contract_limit} onChange={handleChange} type="number" />
              <FormField label="Volume Anual Estimado" name="estimated_annual_volume" value={formData.estimated_annual_volume} onChange={handleChange} type="number" />
              {isClient && (
                <>
                  <FormField label="Segmento" name="segment" value={formData.segment} onChange={handleChange} />
                  <FormField label="Canal de Relacionamento" name="relationship_channel" value={formData.relationship_channel} onChange={handleChange} />
                  <FormField label="Frequência de Compras" name="purchase_frequency" value={formData.purchase_frequency} onChange={handleChange} />
                  <FormField label="Ticket Médio" name="average_ticket" value={formData.average_ticket} onChange={handleChange} type="number" />
                </>
              )}
            </div>
          )}

          {activeTab === "compliance" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-6 border rounded-2xl bg-gray-50/50 hover:bg-blue-50 transition-colors group">
                  <input type="checkbox" name="is_pep" checked={formData.is_pep === 1} onChange={handleChange} className="w-6 h-6 rounded-lg text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer" />
                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-700">Pessoa Politicamente Exposta (PEP)</label>
                    <span className="text-xs text-gray-400">Marque se o titular ou sócios exercem cargos públicos.</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-6 border rounded-2xl bg-gray-50/50 hover:bg-blue-50 transition-colors group">
                  <input type="checkbox" name="has_sanctions" checked={formData.has_sanctions === 1} onChange={handleChange} className="w-6 h-6 rounded-lg text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer" />
                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-700">Histórico de Sanções</label>
                    <span className="text-xs text-gray-400">Verificação em listas restritivas nacionais/internacionais.</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <FormField label="Risco Fraude" name="fraud_risk" value={formData.fraud_risk} onChange={handleChange} options={[{value:'Low', label:'Baixo'},{value:'Medium', label:'Médio'},{value:'High', label:'Alto'}]} />
                <FormField label="Risco Financeiro" name="financial_risk" value={formData.financial_risk} onChange={handleChange} options={[{value:'Low', label:'Baixo'},{value:'Medium', label:'Médio'},{value:'High', label:'Alto'}]} />
                <FormField label="Risco Operacional" name="operational_risk" value={formData.operational_risk} onChange={handleChange} options={[{value:'Low', label:'Baixo'},{value:'Medium', label:'Médio'},{value:'High', label:'Alto'}]} />
                <FormField label="Classificação Final" name="final_risk_rating" value={formData.final_risk_rating} onChange={handleChange} options={[{value:'Low', label:'Baixo'},{value:'Medium', label:'Médio'},{value:'High', label:'Alto'}]} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Observações / Due Diligence</label>
                <textarea name="observations" value={formData.observations || ""} onChange={handleChange} rows={5} className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-3xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Relatório resumido da análise reputacional e judicial..." />
              </div>
            </div>
          )}

          {activeTab === "documentos" && id && <DocumentSection entityId={id} />}
          {activeTab === "historico" && id && <HistoryList entityId={id} />}
        </form>
      </div>
    </div>
  );
}

function DocumentSection({ entityId }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchDocs = () => {
    fetch(`/api/entities/${entityId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setDocuments(data.documents || []));
  };

  useEffect(fetchDocs, [entityId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);

    await fetch(`/api/entities/${entityId}/documents`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData
    });
    
    setUploading(false);
    fetchDocs();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between items-center bg-blue-600 p-10 rounded-[32px] text-white shadow-xl shadow-blue-100">
        <div className="space-y-2">
          <h4 className="text-2xl font-bold">Gestão Documental</h4>
          <p className="text-blue-100 max-w-md">Envie certificados de registo, NIF, alvarás e políticas de compliance para auditoria.</p>
        </div>
        <label className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold cursor-pointer hover:bg-blue-50 transition-all flex items-center gap-3 shadow-lg">
          <Upload size={22} /> {uploading ? 'Enviando...' : 'Fazer Upload'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.length === 0 ? (
          <div className="col-span-full py-20 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-gray-400">
             <File size={48} strokeWidth={1} />
             <p className="mt-4 font-medium">Nenhum documento anexado ainda.</p>
          </div>
        ) : documents.map((doc) => (
          <div key={doc.id} className="p-6 bg-white border border-gray-100 rounded-3xl flex items-center gap-5 hover:border-blue-200 transition-all group shadow-sm">
            <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
              <File size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{doc.name}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{new Date(doc.upload_date).toLocaleDateString('pt-BR')}</p>
            </div>
            <a href={doc.url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-blue-100 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
              <Globe size={18} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryList({ entityId }) {
  const [history, setHistory] = useState<any[]>([]);
  
  useEffect(() => {
    fetch(`/api/entities/${entityId}/history`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setHistory(data));
  }, [entityId]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 max-w-3xl">
      {history.length === 0 ? (
        <p className="text-gray-500 font-medium italic">Nenhum histórico disponível para esta entidade.</p>
      ) : history.map((item) => (
        <div key={item.id} className="flex gap-6 items-start border-l-2 border-blue-100 pl-8 pb-8 relative">
          <div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-0 border-4 border-white shadow-sm shadow-blue-200"></div>
          <div className="bg-gray-50 p-6 rounded-2xl flex-1 border border-gray-100">
            <div className="flex justify-between items-start mb-2">
               <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">{item.action}</p>
               <span className="text-[10px] font-bold text-gray-400">{new Date(item.timestamp).toLocaleString('pt-BR')}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{item.details}</p>
            <div className="mt-4 flex items-center gap-2">
               <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[8px] font-bold">
                 {item.user_name?.charAt(0)}
               </div>
               <span className="text-xs font-bold text-gray-500">{item.user_name}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
