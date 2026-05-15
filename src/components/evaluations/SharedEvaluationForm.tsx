import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Building2, CheckCircle, Send, Star } from "lucide-react";
import { useToast } from "../../context/ToastContext";

type Criterion = {
  id: number;
  name: string;
  weight: number;
  max_score: number;
};

type Section = {
  key: string;
  title: string;
  description: string;
};

type ScaleOption = {
  value: number;
  label: string;
};

type Evaluation360Question = {
  id: number;
  question_text: string;
  section_key: string;
  max_score: number;
};

type SatisfactionData = {
  kind: "satisfaction";
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
};

type Evaluation360Data = {
  kind: "360";
  form: {
    title: string;
    description: string;
  };
  employee: {
    name: string;
    email?: string | null;
    position?: string | null;
    department?: string | null;
  };
  sections: Section[];
  scale: ScaleOption[];
  questions: Evaluation360Question[];
};

type PublicEvaluationData = SatisfactionData | Evaluation360Data;

export default function SharedEvaluationForm() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PublicEvaluationData | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ percentage?: number; classification?: string; kind?: string } | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [peerName, setPeerName] = useState("");
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!token) {
      setError("Token não fornecido.");
      setLoading(false);
      return;
    }

    fetch(`/api/public/evaluation/${token}`)
      .then((response) => {
        if (!response.ok) throw new Error("Link inválido ou expirado");
        return response.json();
      })
      .then((payload) => setData(payload))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!data) return;

    if (data.kind === "360") {
      if (!peerName.trim()) {
        addToast("Informe o nome do colega avaliado.", "error");
        return;
      }
      const employeeQuestions = data.questions.filter((q) => q.section_key !== "manager_eval");
      const missingQuestions = employeeQuestions.filter((q) => responses[q.id] === undefined);
      if (missingQuestions.length > 0) {
        console.log("Perguntas faltando:", missingQuestions.map(q => q.id));
        addToast(`Responda todas as perguntas. Faltam ${missingQuestions.length} respostas.`, "error");
        return;
      }
    } else if (Object.keys(responses).length === 0) {
      addToast("Preencha pelo menos uma avaliação.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload =
        data.kind === "360"
          ? {
              peer_name: peerName,
              responses: data.questions.map((question) => ({
                question_id: question.id,
                score: responses[question.id] ?? 0,
              })),
            }
          : {
              responses: data.criteria.map((criterion) => ({
                criterion_name: criterion.name,
                score: responses[criterion.id] || 0,
                comment: comments[criterion.id] || "",
              })),
              client_name: clientName,
              client_email: clientEmail,
            };

      console.log("Payload enviado:", JSON.stringify(payload, null, 2));
      console.log("Perguntas esperadas:", data.questions.length);
      console.log("Respostas preenchidas:", Object.keys(responses).length);

      const response = await fetch(`/api/public/evaluation/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseData.message || "Erro ao submeter.");
      }

      setSubmitted(true);
      setResult(responseData);
      addToast("Avaliação enviada com sucesso!", "success");
    } catch (err: any) {
      addToast(err.message || "Erro de conexão.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderLoading = (is360: boolean) => (
    <div className={`min-h-screen flex items-center justify-center ${is360 ? "bg-[#f5efe3]" : "bg-gradient-to-br from-indigo-50 via-white to-purple-50"}`}>
      <div className="flex flex-col items-center gap-4">
        <div className={`w-12 h-12 border-4 rounded-full animate-spin ${is360 ? "border-amber-200 border-t-amber-700" : "border-indigo-200 border-t-indigo-600"}`}></div>
        <p className={`font-semibold ${is360 ? "text-amber-900" : "text-indigo-700"}`}>Carregando avaliação...</p>
      </div>
    </div>
  );

  if (loading) {
    return renderLoading(false);
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Link inválido ou expirado</h2>
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
    const is360 = result?.kind === "360" || data.kind === "360";
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${is360 ? "bg-[#f5efe3]" : "bg-gradient-to-br from-indigo-50 via-white to-purple-50"}`}>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${is360 ? "bg-amber-100" : "bg-emerald-100"}`}>
            <CheckCircle size={48} className={is360 ? "text-amber-700" : "text-emerald-600"} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Obrigado!</h2>
          <p className="text-gray-600 mb-3">
            {is360 ? "A resposta foi enviada ao gestor. Obrigado pela sua colaboração." : "Sua avaliação de satisfação foi enviada com sucesso."}
          </p>
          {result?.percentage !== undefined && (
            <p className="text-sm text-gray-500 mb-6">
              Resultado registado: <strong>{Math.round(result.percentage)}%</strong> {result.classification ? `• ${result.classification}` : ""}
            </p>
          )}
          {!is360 && (
            <button onClick={() => navigate("/")} className="btn btn-primary w-full">
              Voltar ao Início
            </button>
          )}
        </div>
      </div>
    );
  }

  if (data.kind === "360") {
    const groupedQuestions = data.sections.map((section) => ({
      ...section,
      questions: data.questions.filter((question) => question.section_key === section.key),
    }));

    return (
      <div className="min-h-screen bg-[#f5efe3] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#fdfaf4] border border-[#e6d7c2] rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-7 border-b border-[#eadfcd] text-center bg-[#fbf7ef]">
              <div className="w-16 h-16 rounded-2xl bg-[#efe1ca] text-[#7a5935] flex items-center justify-center mx-auto mb-4">
                <Building2 size={30} />
              </div>
              <h1 className="text-2xl font-bold text-[#5e4428]">{data.form.title}</h1>
              <p className="text-sm text-[#8a6b49] mt-2">{data.form.description}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-[#a17e58] mt-4">
                Colaborador avaliado: {data.employee.name}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="p-5 rounded-2xl bg-white border border-[#eadfcd] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#5e4428]">{data.employee.name}</p>
                  <p className="text-xs text-[#8a6b49] mt-1">
                    {data.employee.position || "Sem cargo"} {data.employee.department ? `• ${data.employee.department}` : ""}
                  </p>
                </div>
                {data.employee.email && (
                  <div className="px-3 py-1 bg-[#efe1ca] text-[#7a5935] rounded-lg text-[10px] font-bold uppercase tracking-wider self-start sm:self-center">
                    {data.employee.email}
                  </div>
                )}
              </div>

              {groupedQuestions.map((section) => (
                <section key={section.key} className="p-5 rounded-2xl bg-[#fbf7ef] border border-[#eadfcd] space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#5e4428]">{section.title}</h2>
                    <p className="text-sm text-[#8a6b49]">{section.description}</p>
                  </div>

                  {section.key === "peer" && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#6e4f2f]">Nome do Colega a Avaliar *</label>
                      <input
                        type="text"
                        value={peerName}
                        onChange={(event) => setPeerName(event.target.value)}
                        placeholder="Digite o nome do colega..."
                        className="w-full px-4 py-2.5 bg-white border border-[#d9c4a8] rounded-xl focus:ring-2 focus:ring-[#b68454] outline-none transition-all"
                      />
                    </div>
                  )}

                  <div className="space-y-5">
                    {section.questions.map((question, index) => (
                      <div key={question.id} className="p-4 bg-white border border-[#eadfcd] rounded-xl">
                        <p className="text-sm font-bold text-[#5e4428] leading-relaxed">
                          {index + 1}. {question.question_text}
                        </p>
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {data.scale.map((option) => (
                              <label 
                                key={option.value} 
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                  responses[question.id] === option.value
                                    ? "bg-white border-[#b68454] shadow-sm shadow-amber-900/5 ring-1 ring-[#b68454]"
                                    : "bg-[#fdfaf4] border-transparent hover:border-[#d9c4a8]"
                                }`}
                              >
                                <div className="relative flex items-center justify-center shrink-0">
                                  <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    checked={responses[question.id] === option.value}
                                    onChange={() => setResponses((prev) => ({ ...prev, [question.id]: option.value }))}
                                    className="appearance-none w-5 h-5 border-2 border-[#d9c4a8] rounded-full checked:border-[#b68454] transition-all cursor-pointer"
                                  />
                                  {responses[question.id] === option.value && (
                                    <div className="absolute w-2.5 h-2.5 bg-[#b68454] rounded-full" />
                                  )}
                                </div>
                                <span className={`text-xs ${responses[question.id] === option.value ? "font-bold text-[#5e4428]" : "text-[#6e4f2f]"}`}>
                                  {option.label}
                                </span>
                              </label>
                            ))}
                          </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#a17e58] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#8a6b49] active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg shadow-amber-900/10"
              >
                <Send size={20} /> {submitting ? "Enviando..." : "Enviar ao Gestor"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-t-3xl shadow-sm border-b border-gray-100 p-6 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} className="text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Avaliação de Satisfação</h1>
          <p className="text-sm text-gray-600">{data.evaluation.name || "Pesquisa de Satisfação"}</p>
          <p className="text-xs text-indigo-600 font-medium mt-1">Avaliando: {data.entity.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-b-3xl shadow-lg border border-t-0 border-gray-100 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Seu Nome *</label>
              <input
                type="text"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
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
                onChange={(event) => setClientEmail(event.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Star size={18} className="text-amber-500" />
              Critérios de Avaliação
            </h3>

            {data.criteria.map((criterion) => (
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
                  onChange={(event) =>
                    setResponses((prev) => ({ ...prev, [criterion.id]: Number(event.target.value) }))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                <input
                  type="text"
                  placeholder="Comentário (opcional)"
                  value={comments[criterion.id] || ""}
                  onChange={(event) =>
                    setComments((prev) => ({ ...prev, [criterion.id]: event.target.value }))
                  }
                  className="mt-3 w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting || Object.keys(responses).length === 0}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg disabled:opacity-50"
          >
            <Send size={20} /> {submitting ? "Enviando..." : "Enviar Avaliação"}
          </button>


        </form>
      </div>
    </div>
  );
}
