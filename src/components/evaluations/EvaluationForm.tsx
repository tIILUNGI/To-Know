import { useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, AlertCircle } from "lucide-react";

export default function EvaluationForm() {
  const navigate = useNavigate();
  const [responses, setResponses] = useState({});
  const { id } = useParams();
  const [formData, setFormData] = useState({
    entity_id: id || "",
    entity_type: "Supplier",
    type: "Performance",
    evaluation_type: "Nova",
    periodicity: "Anual",
    period: `${new Date().getFullYear()}`,
    previous_evaluation_id: "",
    product_service: "",
    unit: "",
    action_plan: "",
    action_plan_deadline: "",
    action_plan_responsible: "",
    reevaluation_reason: "",
  });

  const isPerformance = formData.type === "Performance";
  const isSupplier = formData.entity_type === "Supplier";

  const getQuestions = () => {
    // Supplier Performance
    if (isSupplier && isPerformance) return [
      { id: "PER_QLD", label: "Qualidade do Fornecimento", description: "Conformidade com especificações técnicas" },
      { id: "PER_PRA", label: "Cumprimento de Prazos", description: "Entregas dentro do prazo acordado" },
      { id: "PER_DOC", label: "Conformidade Documental", description: "Documentação completa e correta" },
      { id: "PER_CON", label: "Confiabilidade", description: "Consistência no cumprimento de entregas" },
      { id: "PER_RES", label: "Capacidade de Resposta", description: "Agilidade em demandas e alterações" },
      { id: "PER_FLX", label: "Flexibilidade", description: "Adaptação a mudanças solicitadas" },
      { id: "PER_ATD", label: "Atendimento", description: "Qualidade do suporte e comunicação" },
      { id: "PER_PV", label: "Preço vs Valor", description: "Custo-benefício oferecidos" },
      { id: "PER_REC", label: "Gestão de Reclamações", description: "Tratamento de queixas e problemas" },
      { id: "PER_CONT", label: "Continuidade Operacional", description: "Garantia de fornecimento contínuo" },
      { id: "PER_HSE", label: "Segurança/HSE", description: "Compliance de segurança" },
      { id: "PER_INV", label: "Inovação e Melhoria", description: "Melhorias propostas" },
    ];
    // Supplier Satisfaction
    if (isSupplier && !isPerformance) return [
      { id: "SUP_SAT_REQ", label: "Clareza dos Requisitos", description: "Clareza nas especificações e requisitos" },
      { id: "SUP_SAT_COM", label: "Facilidade de Comunicação", description: "Eficácia na comunicação" },
      { id: "SUP_SAT_TEM", label: "Tempo de Resposta", description: "Rapidez no retorno" },
      { id: "SUP_SAT_TRAT", label: "Justiça no Tratamento", description: "Equidade comercial" },
      { id: "SUP_SAT_CONTR", label: "Clareza Contratual", description: "Transparência nos contratos" },
      { id: "SUP_SAT_PAG", label: "Cumprimento de Pagamentos", description: "Pontualidade nos pagamentos" },
      { id: "SUP_SAT_COOP", label: "Cooperação Operacional", description: "Trabalho em equipa" },
      { id: "SUP_SAT_RES", label: "Resolução de Problemas", description: "Capacidade de resolver issues" },
      { id: "SUP_SAT_TRANS", label: "Transparência", description: "Clareza na relação" },
      { id: "SUP_SAT_CONT", label: "Interesse em Continuidade", description: "Parceria de longo prazo" },
    ];
    // Client Performance
    if (!isSupplier && isPerformance) return [
      { id: "CLI_PER_PAG", label: "Pontualidade no Pagamento", description: "Cumprimento de prazos de pagamento" },
      { id: "CLI_PER_VOL", label: "Volume de Compras", description: "Volume de negócio" },
      { id: "CLI_PER_FREQ", label: "Frequência de Relacionamento", description: "Constância" },
      { id: "CLI_PER_CONTR", label: "Cumprimento Contratual", description: "Adesão aos termos" },
      { id: "CLI_PER_COM", label: "Qualidade da Comunicação", description: "Clareza e eficácia" },
      { id: "CLI_PER_EST", label: "Estabilidade da Relação", description: "Consistência" },
      { id: "CLI_PER_LIT", label: "Ocorrência de Litígios", description: "Conflitos" },
      { id: "CLI_PER_RENT", label: "Rentabilidade", description: "Margem de lucro" },
      { id: "CLI_PER_FIDEL", label: "Fidelização", description: "Lealdade" },
      { id: "CLI_PER_POT", label: "Potencial de Crescimento", description: "Crescimento esperado" },
    ];
    // Client Satisfaction (default)
    return [
      { id: "SAT_GER", label: "Satisfação Geral", description: "Avaliação holística geral" },
      { id: "SAT_CAL", label: "Qualidade do Atendimento", description: "Excelência no suporte" },
      { id: "SAT_TEM", label: "Tempo de Resposta", description: "Rapidez no retorno" },
      { id: "SAT_PRO", label: "Qualidade do Produto", description: "Conformidade com esperado" },
      { id: "SAT_PRA", label: "Cumprimento de Prazos", description: "Entregas no prazo" },
      { id: "SAT_VAL", label: "Valor", description: "Custo-benefício" },
      { id: "SAT_COM", label: "Comunicação", description: "Clareza e eficácia" },
      { id: "SAT_REC", label: "Resolução de Reclamações", description: "Tratamento de queixas" },
      { id: "SAT_CON", label: "Confiança", description: "Segurança na parceria" },
      { id: "SAT_NPS", label: "NPS", description: "Net Promoter Score" },
    ];
  };

  const questions = getQuestions();

  const setScore = (id: string | number, score: number) => {
    setResponses(prev => ({ ...prev, [id]: score }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formattedResponses = questions.map(q => ({
      criterion_name: q.id,
      score: responses[q.id] || 0,
      observation: "",
      evidence: "",
    }));

    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...formData, responses: formattedResponses })
      });

      if (res.ok) {
        navigate(-1);
      }
    } catch {
      console.error("Error submitting evaluation");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-10 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-lg border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 sm:p-2 hover:bg-gray-50 rounded-lg text-gray-400">
            <ArrowLeft size={16} sm={18} />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {isSupplier ? "Avaliação Fornecedor" : "Avaliação Cliente"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {formData.evaluation_type === "Reavaliação" ? "Reavaliação" : "Nova avaliação"}
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Save size={14} sm={16} /> Finalizar
        </button>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">Entidade</label>
          <select
            value={formData.entity_type}
            onChange={(e) => setFormData({...formData, entity_type: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
          >
            <option value="Supplier">Fornecedor</option>
            <option value="Client">Cliente</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">ID Entidade</label>
          <input 
            type="number"
            value={formData.entity_id} 
            onChange={(e) => setFormData({...formData, entity_id: e.target.value})} 
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" 
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">Tipo</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
          >
            <option value="Performance">Performance</option>
            <option value="Satisfaction">Satisfação</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">Avaliação</label>
          <select
            value={formData.evaluation_type}
            onChange={(e) => setFormData({...formData, evaluation_type: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
          >
            <option value="Nova">Nova</option>
            <option value="Reavaliação">Reavaliação</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">Periodicidade</label>
          <select
            value={formData.periodicity}
            onChange={(e) => setFormData({...formData, periodicity: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
          >
            <option value="Mensal">Mensal</option>
            <option value="Trimestral">Trimestral</option>
            <option value="Semestral">Semestral</option>
            <option value="Anual">Anual</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">Período</label>
          <input 
            value={formData.period} 
            onChange={(e) => setFormData({...formData, period: e.target.value})} 
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" 
          />
        </div>
      </div>

      {formData.evaluation_type === "Reavaliação" && (
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-amber-200 bg-amber-50">
          <h3 className="text-sm sm:text-base font-semibold text-amber-900 mb-3">Motivo da Reavaliação</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">ID Avaliação Anterior</label>
              <input 
                type="number"
                value={formData.previous_evaluation_id} 
onChange={(e) => setFormData({...formData, previous_evaluation_id: e.target.value})} 
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" 
                placeholder="ID avaliação anterior"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">Motivo</label>
              <select
                value={formData.reevaluation_reason}
                onChange={(e) => setFormData({...formData, reevaluation_reason: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              >
                <option value="">Selecione...</option>
                <option value="Vencimento">Vencimento aprovação</option>
                <option value="Baixo desempenho">Baixo desempenho</option>
                <option value="Ocorrência crítica">Ocorrência crítica</option>
                <option value="Periódica">Avaliação periódica</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {questions.map((q) => {
          const maxScale = !isPerformance ? 5 : 10;
          const scaleLabels = !isPerformance ? ["Muito Insatisfeito", "Insatisfeito", "Neutro", "Satisfeito", "Muito Satisfeito"] : null;
          return (
          <div key={q.id} className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{q.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{q.description}</p>
              {scaleLabels && <p className="text-[10px] text-blue-500 mt-1">{scaleLabels[responses[q.id] ? responses[q.id]-1 : 0] || "Selecione"}</p>}
            </div>
            <div className="flex gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-100">
              {Array.from({length: maxScale}, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setScore(q.id, n)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded font-medium text-xs sm:text-sm transition-all ${
                    responses[q.id] === n 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-400 hover:bg-white hover:text-gray-600"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      </div>

      {/* Action Plan Section */}
      <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Plano de Ação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Plano de Ação</label>
            <textarea 
              value={formData.action_plan} 
              onChange={(e) => setFormData({...formData, action_plan: e.target.value})} 
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" 
              placeholder="Descreva..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Prazo</label>
            <input 
              type="date"
              value={formData.action_plan_deadline} 
              onChange={(e) => setFormData({...formData, action_plan_deadline: e.target.value})} 
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Responsável</label>
            <input 
              value={formData.action_plan_responsible} 
              onChange={(e) => setFormData({...formData, action_plan_responsible: e.target.value})} 
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" 
              placeholder="Nome..."
            />
          </div>
        </div>
      </div>
      
      <div className="bg-amber-50 p-4 sm:p-5 rounded-lg border border-amber-100 flex items-start gap-3">
         <div className="p-2 bg-amber-100 rounded-lg text-amber-600 flex-shrink-0">
            <AlertCircle size={16} />
         </div>
         <div>
             <h4 className="text-sm font-medium text-amber-900">Avaliação</h4>
             <p className="text-xs text-amber-700 mt-0.5">
               1 a 10. Excelente (≥90%), Bom (≥75%), Satisfatório (≥60%), Insatisfatório (≥40%), Crítico (&lt;40%)
            </p>
         </div>
      </div>
    </div>
  );
}
