import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, FileText, User, Package, Scale, TrendingUp, Star, Mail } from "lucide-react";
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

const normalizeCriterion = (criterion: any) => {
  const normalizedWeight = criterion.weight ?? criterion.peso ?? criterion.presentationOrder ?? criterion.displayOrder ?? 10;
  const normalizedMaxScore = criterion.max_score ?? criterion.maxScore ?? criterion.max_score ?? criterion.min_score ?? 5;

  return {
    ...criterion,
    id: Number(criterion.id ?? criterion.criteria_id ?? 0),
    name: criterion.name ?? criterion.code ?? "Critério",
    weight: Number(normalizedWeight) || 0,
    max_score: Number(normalizedMaxScore) || 5,
    evaluation_type: (criterion.evaluation_type ?? criterion.evaluationType ?? "").toString(),
    entity_type: (criterion.entity_type ?? criterion.entityType ?? "").toString(),
  };
};

const matchesEvaluationType = (evaluationType: string, targetType: string) => {
  const normalized = (evaluationType || "").toLowerCase();
  const target = targetType.toLowerCase();
  return normalized === target || normalized.includes(target);
};

export default function ClientEvaluationForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
   const [clients, setClients] = useState<any[]>([]);
   const [selectedClient, setSelectedClient] = useState<any>(null);
   const [showClientSelect, setShowClientSelect] = useState(false);
   const [allCriteria, setAllCriteria] = useState<any[]>([]);
   const [selectedCriteriaIds, setSelectedCriteriaIds] = useState<number[]>([]);
   const [showCriteriaSelect, setShowCriteriaSelect] = useState(false);
  
  // Parse query params
  const evalType = searchParams.get('type') === 'Satisfaction' ? 'Satisfaction' : 'Performance';
  
  const [formData, setFormData] = useState({
    evaluation_number: "",
    name: "",
    evaluation_type: evalType === 'Satisfaction' ? 'Satisfação do cliente' : 'Performance do cliente',
    evaluation_date: new Date().toISOString().split('T')[0],
    period_start: "",
    period_end: "",
    evaluator_name: "",
    evaluation_type_detail: evalType
  });

  const [criteria, setCriteria] = useState<any[]>([]);
  const [clientEmail, setClientEmail] = useState("");
  const [linkExpiresDays, setLinkExpiresDays] = useState(30);
  const [generatedLink, setGeneratedLink] = useState<any>(null);



   useEffect(() => {
     fetch("/api/entities?type=Client", {
       headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
     })
       .then(res => res.json())
       .then(data => setClients(data))
       .catch(() => {});

     fetch("/api/criteria", {
       headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
     })
       .then(res => res.json())
       .then(data => {
         // Filter criteria for client satisfaction or performance evaluations
            const filtered = data
              .map((c: any) => normalizeCriterion(c))
              .filter((c: any) => {
                const entityType = (c.entity_type || "").toUpperCase();
                const evaluationType = (c.evaluation_type || "").toUpperCase();
                const currentEvalType = evalType.toUpperCase(); // 'PERFORMANCE' or 'SATISFACTION'
                return (entityType === 'CLIENT' || entityType === 'CUSTOMER' || entityType === 'AMBOS') &&
                       matchesEvaluationType(evaluationType, currentEvalType);
              });
          setAllCriteria(filtered);
        })
        .catch(() => {});
   }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCriteriaChange = (id, value) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, score: Number(value) } : c));
  };

  const toggleCriteria = (criterion: any) => {
    if (!criterion) return;
    const criterionId = Number(criterion.id);
    setSelectedCriteriaIds(prev => {
      if (prev.includes(criterionId)) {
        return prev.filter(id => id !== criterionId);
      }
      return [...prev, criterionId];
    });
  };

  // Atualiza criteria baseado nos critérios selecionados
  useEffect(() => {
    const selected = allCriteria
      .filter(c => selectedCriteriaIds.includes(Number(c.id)))
      .map(c => ({
        id: Number(c.id),
        name: c.name,
        weight: Number(c.weight ?? c.presentationOrder ?? 10),
        max_score: Number(c.max_score ?? c.maxScore ?? 5),
        score: 0
      }));
    setCriteria(selected);
  }, [selectedCriteriaIds, allCriteria]);

  const [resultData, setResultData] = useState({
    total_score: "0.0",
    percentage: "0.0",
    classification: "",
    decision: ""
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast("Link copiado para a área de transferência!", "success");
    } catch {
      addToast("Não foi possível copiar o link.", "error");
    }
  };

  const openEmailClient = (linkUrl: string) => {
    const subject = encodeURIComponent("Avaliação de Satisfação do Cliente");
    const body = encodeURIComponent(`Olá,%0D%0APor favor, acesse a avaliação através do link abaixo:%0D%0A${linkUrl}%0D%0A%0D%0AObrigado.`);
    window.location.href = `mailto:${clientEmail || ""}?subject=${subject}&body=${body}`;
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
    if (criteria.length === 0) {
      addToast("Selecione pelo menos um critério para a pesquisa.", "error");
      return;
    }
    setLoading(true);

    const responses = criteria.map(c => ({
      group_name: "Avaliação",
      criterion_name: c.name,
      score: c.score || 0,
      observation: ""
    }));

    const submissionEvalType = evalType === 'Satisfaction' ? 'Satisfaction' : 'Performance';
    const evalName = formData.name || `${submissionEvalType === 'Satisfaction' ? 'Satisfação' : 'Performance'} - ${selectedClient.name}`;

    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          entity_id: selectedClient.id,
          type: 'Client',
          evaluation_type: submissionEvalType === 'Satisfaction' ? 'Satisfaction' : 'Performance',
          evaluation_type_detail: submissionEvalType,
          name: evalName,
          periodicity: "Pontual",
          period_start: formData.period_start || null,
          period_end: formData.period_end || null,
          responses: responses
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao criar avaliação.");
      }

      const evaluation = await res.json();
      
      if (evalType === 'Satisfaction') {
        const linkRes = await fetch(`/api/evaluations/${evaluation.id}/generate-link`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            client_email: clientEmail || selectedClient.email || "",
            expires_days: linkExpiresDays
          })
        });

        if (!linkRes.ok) {
          const err = await linkRes.json();
          throw new Error(err.message || "Avaliação criada, mas não foi possível gerar o link.");
        }

        const payload = await linkRes.json();
        setGeneratedLink(payload);
        addToast("Link de pesquisa gerado com sucesso!", "success");
      } else {
        addToast("Avaliação de performance criada com sucesso!", "success");
      }
    } catch (err: any) {
      addToast(err.message || "Erro de conexão.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/avaliacoes")} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {evalType === 'Satisfaction' ? 'Pesquisa de Satisfação - Cliente' : 'Avaliação de Performance - Cliente'}
            </h2>
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
              label="Nome da Avaliação" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Ex: Avaliação anual de clientes 2024" 
            />
            <FormField 
              label="Tipo de Avaliação" 
              name="evaluation_type" 
              value={formData.evaluation_type} 
              onChange={handleChange} 
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

         {evalType === 'Satisfaction' && (
           <div className="space-y-6">
             <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
               <Mail size={22} className="text-violet-600" />
               <h3 className="text-lg font-bold text-gray-900">Link de Avaliação</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <FormField
                 label="Email do Cliente"
                 name="client_email"
                 value={clientEmail}
                 onChange={(e) => setClientEmail(e.target.value)}
                 type="email"
                 placeholder="cliente@empresa.com"
               />

               <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Validade do Link</label>
                 <select
                   value={linkExpiresDays}
                   onChange={(e) => setLinkExpiresDays(Number(e.target.value))}
                   className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                 >
                   <option value={7}>7 dias</option>
                   <option value={15}>15 dias</option>
                   <option value={30}>30 dias</option>
                   <option value={60}>60 dias</option>
                   <option value={90}>90 dias</option>
                 </select>
               </div>
             </div>
           </div>
         )}

         {/* Selecionar Critérios de Avaliação */}
         <div className="space-y-6">
           <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
             <Scale size={22} className="text-amber-600" />
             <h3 className="text-lg font-bold text-gray-900">Critérios de Avaliação</h3>
           </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {criteria.map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">Peso: {c.weight}% • Máx: {c.max_score} pts</p>
                  </div>
                  <button type="button" onClick={() => toggleCriteria(allCriteria.find(ac => ac.id === c.id))} className="text-amber-600 hover:text-amber-700">
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

           <button
             type="button"
             onClick={() => setShowCriteriaSelect(!showCriteriaSelect)}
             className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-colors flex items-center gap-2"
           >
             <Plus size={18} />
             {showCriteriaSelect ? 'Fechar' : 'Adicionar Critérios'}
           </button>

           {showCriteriaSelect && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-100 rounded-xl">
               {allCriteria.filter(c => !selectedCriteriaIds.includes(Number(c.id))).map(criterion => (
                 <button
                   type="button"
                   key={criterion.id}
                   onClick={() => toggleCriteria(criterion)}
                   className="p-3 text-left bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-xl transition-colors"
                 >
                   <p className="text-sm font-medium text-gray-900">{criterion.name}</p>
                   <p className="text-xs text-gray-500">Peso: {criterion.weight ?? 0}% • Máx: {criterion.max_score ?? criterion.maxScore ?? 5} pts</p>
                 </button>
               ))}
             </div>
           )}
         </div>

         {/* 13.2 Avaliação de Performance */}
         <div className="space-y-6">
           <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
             <Scale size={22} className="text-amber-600" />
             <h3 className="text-lg font-bold text-gray-900">
               {evalType === 'Satisfaction' ? 'Pesquisa de Satisfação' : 'Avaliação de Performance'}
             </h3>
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
                   onChange={(e) => handleCriteriaChange(c.id, Number(e.target.value))}
                   className="w-24 px-3 py-1.5 text-center text-sm font-bold bg-purple-50 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                 >
                   <option value={0}>—</option>
                   {Array.from({length: c.max_score || 5}, (_, i) => i + 1).map(num => (
                     <option key={num} value={num}>{num}</option>
                   ))}
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

        {generatedLink && (
          <div className="space-y-4 p-6 bg-emerald-50 border border-emerald-100 rounded-3xl">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-emerald-600" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">Link Gerado</h3>
                <p className="text-sm text-gray-500">Use este link para enviar a pesquisa ao cliente.</p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                readOnly
                value={generatedLink.link_url}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700"
              />
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedLink.link_url)}
                  className="w-full sm:w-auto bg-emerald-600 text-white px-5 py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition-all"
                >
                  Copiar Link
                </button>
                <button
                  type="button"
                  onClick={() => openEmailClient(generatedLink.link_url)}
                  className="w-full sm:w-auto bg-white text-emerald-700 border border-emerald-200 px-5 py-3 rounded-2xl font-semibold hover:bg-emerald-100 transition-all"
                >
                  Enviar por Email
                </button>
              </div>
              <p className="text-xs text-gray-500">Validade até: {generatedLink.expires_at}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}