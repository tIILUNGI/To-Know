import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Star, MessageSquare, AlertCircle, Heart, Award, Clock, DollarSign, UserCheck } from "lucide-react";

const GroupCard = ({ id, title, questions, scores, setScore, icon: Icon, color }) => (
  <div key={id} className="bg-white p-10 rounded-[32px] shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
    <div className="flex items-center gap-4 mb-8">
       <div className={`p-4 rounded-2xl ${color} text-white shadow-lg`}>
          <Icon size={24} />
       </div>
       <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">{title}</h3>
    </div>
    <div className="space-y-10">
      {questions.map((q) => (
        <div key={q.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{q.label}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{q.description}</p>
          </div>
          <div className="flex gap-3 bg-gray-50 p-1.5 rounded-[20px] border border-gray-100">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setScore(q.id, n)}
                className={`w-12 h-12 rounded-[16px] font-extrabold text-lg transition-all active:scale-90 ${
                  scores[q.id] === n 
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-100 scale-105" 
                    : "text-gray-400 hover:bg-white hover:text-gray-600 hover:shadow-sm"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function EvaluationForm() {
  const navigate = useNavigate();
  const [responses, setResponses] = useState({});
  const [formData, setFormData] = useState({
    entity_id: "",
    type: "Satisfaction",
    period: `${new Date().getFullYear()}.${Math.floor(new Date().getMonth() / 3) + 1}Q`,
    product_service: "",
    unit: ""
  });

  const groups = [
    {
      id: "atendimento",
      title: "Grupo A: Atendimento",
      icon: UserCheck,
      color: "bg-blue-600",
      questions: [
        { id: "A1", label: "Clareza na comunicação", description: "O quão claro é o atendimento prestado?" },
        { id: "A2", label: "Tempo de resposta", description: "Rapidez no retorno de solicitações e dúvidas." },
        { id: "A3", label: "Cordialidade", description: "Educação e tratamento do profissional de atendimento." },
        { id: "A4", label: "Disponibilidade", description: "Facilidade de encontrar o responsável quando necessário." },
        { id: "A5", label: "Facilidade de contacto", description: "Variedade e eficácia dos canais de comunicação." }
      ]
    },
    {
      id: "qualidade",
      title: "Grupo B: Qualidade",
      icon: Award,
      color: "bg-emerald-600",
      questions: [
        { id: "B1", label: "Qualidade percebida", description: "Nível de excelência do produto ou serviço entregue." },
        { id: "B2", label: "Conformidade", description: "Atendimento aos requisitos técnicos e especificações." },
        { id: "B3", label: "Fiabilidade", description: "Consistência no desempenho ao longo do tempo." },
        { id: "B4", label: "Adequação à necessidade", description: "O quanto a solução resolve o problema real." }
      ]
    },
    {
      id: "prazos",
      title: "Grupo C: Prazos e Resolução",
      icon: Clock,
      color: "bg-amber-600",
      questions: [
        { id: "C1", label: "Cumprimento de prazos", description: "Entrega dentro das datas acordadas." },
        { id: "C2", label: "Rapidez de execução", description: "Agilidade no desenvolvimento do trabalho." },
        { id: "C3", label: "Resolução de problemas", description: "Eficácia ao lidar com imprevistos." },
        { id: "C4", label: "Agilidade em reclamações", description: "Tempo para tratar e resolver queixas." }
      ]
    },
    {
      id: "valor",
      title: "Grupo D: Valor Comercial",
      icon: DollarSign,
      color: "bg-indigo-600",
      questions: [
        { id: "D1", label: "Relação qualidade/preço", description: "Percepção de custo-benefício da parceria." },
        { id: "D2", label: "Transparência comercial", description: "Clareza em faturas, orçamentos e condições." },
        { id: "D3", label: "Satisfação geral", description: "Avaliação holística da relação comercial." }
      ]
    },
    {
      id: "lealdade",
      title: "Grupo E: Lealdade e Imagem",
      icon: Heart,
      color: "bg-rose-600",
      questions: [
        { id: "E1", label: "Continuidade", description: "Interesse em manter o contrato/relação." },
        { id: "E2", label: "Recomendação (NPS)", description: "Probabilidade de recomendar a empresa a outros." },
        { id: "E3", label: "Confiança", description: "Nível de segurança transmitido pela marca." },
        { id: "E4", label: "Imagem institucional", description: "Percepção da reputação e valores da empresa." }
      ]
    }
  ];

  const setScore = (id, score) => {
    setResponses(prev => ({ ...prev, [id]: score }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedResponses = Object.entries(responses).map(([id, score]) => ({
      criterion_name: id,
      score: score,
      group_name: groups.find(g => g.questions.some(q => q.id === id))?.title
    }));

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
  };

  return (
    <div className="space-y-12 pb-20 max-w-6xl mx-auto animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-3 hover:bg-gray-50 rounded-2xl text-gray-400 border border-transparent hover:border-gray-100 transition-all">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Avaliação de Satisfação</h2>
            <p className="text-gray-500 font-medium">Questionário completo de 20 indicadores estruturados.</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-10 py-4 rounded-[20px] font-black text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-2xl shadow-blue-200 flex items-center gap-3"
        >
          <Save size={22} /> Finalizar Avaliação
        </button>
      </div>

      <div className="bg-white p-10 rounded-[32px] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">ID da Entidade</label>
          <input 
            value={formData.entity_id} 
            onChange={(e) => setFormData({...formData, entity_id: e.target.value})} 
            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-lg transition-all" 
            placeholder="Ex: 1"
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Período</label>
          <input 
            value={formData.period} 
            onChange={(e) => setFormData({...formData, period: e.target.value})} 
            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-lg transition-all" 
          />
        </div>
        <div className="md:col-span-2 space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Produto ou Serviço Principal</label>
          <input 
            value={formData.product_service} 
            onChange={(e) => setFormData({...formData, product_service: e.target.value})} 
            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-lg transition-all" 
            placeholder="Descreva o escopo avaliado..."
          />
        </div>
      </div>

      <div className="space-y-12">
        {groups.map(group => (
          <GroupCard 
            id={group.id}
            title={group.title} 
            questions={group.questions} 
            scores={responses} 
            setScore={setScore} 
            icon={group.icon}
            color={group.color}
          />
        ))}
      </div>
      
      <div className="bg-amber-50 p-8 rounded-[32px] border border-amber-100 flex items-start gap-6">
         <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
            <AlertCircle size={24} />
         </div>
         <div>
            <h4 className="text-lg font-black text-amber-900">Nota de Conformidade</h4>
            <p className="text-amber-700 font-medium text-sm mt-1">Todas as perguntas são obrigatórias para o cálculo final do índice de satisfação. A pontuação é baseada em uma escala de 1 (Muito Insatisfeito) a 5 (Muito Satisfeito).</p>
         </div>
      </div>
    </div>
  );
}
