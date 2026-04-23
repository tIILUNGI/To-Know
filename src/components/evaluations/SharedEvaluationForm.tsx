import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Star, Building2, BarChart3, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "../../context/ToastContext";

interface Criterion {
  id: number;
  name: string;
  weight: number;
  max_score: number;
}

interface LinkData {
  link: {
    id: number;
    token: string;
    client_email: string;
    expires_at: string;
    is_used: number;
  };
  evaluation: {
    evaluation_type: string;
    name: string;
    periodicity: string;
  };
  entity: {
    name: string;
    entity_type: string;
  };
  criteria: Criterion[];
}

export default function SharedEvaluationForm() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LinkData | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token não fornecido.");
      setLoading(false);
      return;
    }

    fetch(`/api/public/evaluation/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Link inválido ou expirado");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleResponseChange = (criterionId: number, score: number) => {
    setResponses(prev => ({ ...prev, [criterionId]: score }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data) return;

    const criteria = data.criteria;
    if (Object.keys(responses).length === 0) {
      addToast("Preencha pelo menos uma avaliação.", "error");
      return;
    }

    setSubmitting(true);

    try {
      const responsesArray = criteria.map((c) => ({
        criterion_name: c.name,
        score: responses[c.id] || 0,
        comment: comments[c.id] || ""
      }));

      const res = await fetch(`/api/public/evaluation/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: responsesArray,
          client_name: clientName,
          client_email: clientEmail
        })
      });

      if (res.ok) {
        setSubmitted(true);
        addToast("Avaliação enviada com sucesso!", "success");
      } else {
        const err = await res.json();
        addToast(err.message || "Erro ao submeter.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-indigo-700 font-semibold animate-pulse">Carregando avaliação...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Inválido ou Expirado</h2>
          <p className="text-gray-600 mb-6">
            {error || "Não foi possível carregar a avaliação. Verifique o link ou solicite um novo."}
          </p>
          <button onClick={() => navigate("/")} className="btn btn-primary w-full">
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle size={48} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Obrigado!</h2>
          <p className="text-gray-600 mb-2">Sua avaliação de satisfação foi enviada com sucesso.</p>
          <p className="text-sm text-gray-500 mb-6">
            A sua opinião é extremamente valiosa para melhorarmos os nossos serviços.
          </p>
          <div className="flex gap-3">
            <button onClick={() => navigate("/")} className="flex-1 btn btn-primary">
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-3xl shadow-sm border-b border-gray-100 p-6 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} className="text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Avaliação de Satisfação</h1>
          <p className="text-sm text-gray-600">{data.evaluation.name || "Pesquisa de Satisfação"}</p>
          <p className="text-xs text-indigo-600 font-medium mt-1">
            Avaliando: {data.entity.name}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-b-3xl shadow-lg border border-t-0 border-gray-100 p-6 space-y-6">
          {/* Client Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Seu Nome *</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome completo"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Seu Email *</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Criteria */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Star size={18} className="text-amber-500" />
              Critérios de Avaliação
            </h3>

            {data.criteria.map((criterion: Criterion) => (
              <div key={criterion.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{criterion.name}</p>
                    <p className="text-xs text-gray-500">Avalie de 0 a {criterion.max_score}</p>
                  </div>
                  <span className="text-sm font-bold text-amber-600">
                    {responses[criterion.id] !== undefined ? responses[criterion.id] : "—"}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max={criterion.max_score}
                  value={responses[criterion.id] || 0}
                  onChange={(e) => handleResponseChange(criterion.id, Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                <input
                  type="text"
                  placeholder="Comentário (opcional)"
                  value={comments[criterion.id] || ""}
                  onChange={(e) => setComments(prev => ({ ...prev, [criterion.id]: e.target.value }))}
                  className="mt-3 w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || Object.keys(responses).length === 0}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg disabled:opacity-50"
          >
            <Send size={20} /> {submitting ? "Enviando..." : "Enviar Avaliação"}
          </button>

          <p className="text-center text-xs text-gray-400">
            Esta avaliação será registada e enviada para a nossa equipa. Obrigado!
          </p>
        </form>
      </div>
    </div>
  );
}
