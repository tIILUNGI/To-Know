import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, CheckCircle, AlertCircle, Send } from "lucide-react";

interface Question {
  id: number;
  text: string;
  type: 'rating' | 'text' | 'yesno';
  required: boolean;
  max_score?: number;
}

interface FormData {
  id: number;
  title: string;
  description: string;
  client_name: string;
}

export default function ClientSatisfactionResponse() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<number, any>>({});

  useEffect(() => {
    if (!token) {
      setError("Token inválido.");
      setLoading(false);
      return;
    }

    fetch(`/api/public/client-satisfaction/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setError(data.message);
        } else {
          setFormData(data.form);
          setQuestions(data.questions);
        }
      })
      .catch(() => {
        setError("Erro ao carregar o formulário.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleRatingChange = (questionId: number, rating: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { response_rating: rating }
    }));
  };

  const handleTextChange = (questionId: number, text: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { response_text: text }
    }));
  };

  const handleYesNoChange = (questionId: number, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { response_text: value }
    }));
  };

  const validateForm = () => {
    for (const question of questions) {
      if (question.required) {
        const response = responses[question.id];
        if (!response || (!response.response_text && !response.response_rating)) {
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("Por favor, responda todas as perguntas obrigatórias.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const responseData = Object.entries(responses).map(([questionId, response]) => ({
        question_id: Number(questionId),
        ...(response as Record<string, any>)
      }));

      const response = await fetch(`/api/public/client-satisfaction/${token}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ responses: responseData })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erro ao enviar respostas.");
      }

      setSubmitted(true);

    } catch (err: any) {
      setError(err.message || "Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderRatingInput = (question: Question) => {
    const currentRating = responses[question.id]?.response_rating || 0;

    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(question.id, star)}
            aria-label={`Dar ${star} estrelas`}
            className="transition-all hover:scale-110"
          >
            <Star
              size={32}
              className={`${
                star <= currentRating
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300"
              } transition-colors`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-500">
          {currentRating > 0 && `${currentRating} de ${question.max_score || 5} estrelas`}
        </span>
      </div>
    );
  };

  const renderTextInput = (question: Question) => {
    const currentText = responses[question.id]?.response_text || "";

    return (
      <textarea
        value={currentText}
        onChange={(e) => handleTextChange(question.id, e.target.value)}
        placeholder="Digite sua resposta aqui..."
        rows={4}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
      />
    );
  };

  const renderYesNoInput = (question: Question) => {
    const currentValue = responses[question.id]?.response_text;

    return (
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`yesno-${question.id}`}
            value="Sim"
            checked={currentValue === "Sim"}
            onChange={(e) => handleYesNoChange(question.id, e.target.value)}
            className="w-4 h-4 text-green-600 focus:ring-green-500"
          />
          <span className="text-gray-700 font-medium">Sim</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`yesno-${question.id}`}
            value="Não"
            checked={currentValue === "Não"}
            onChange={(e) => handleYesNoChange(question.id, e.target.value)}
            className="w-4 h-4 text-red-600 focus:ring-red-500"
          />
          <span className="text-gray-700 font-medium">Não</span>
        </label>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando pesquisa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Obrigado!</h2>
          <p className="text-gray-600 mb-6">
            Suas respostas foram enviadas com sucesso. Agradecemos sua participação!
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  if (!formData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{formData.title}</h1>
            {formData.description && (
              <p className="text-gray-600 mb-4">{formData.description}</p>
            )}
            <p className="text-sm text-gray-500">
              Pesquisa para: <span className="font-semibold text-purple-600">{formData.client_name}</span>
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-3xl shadow-lg p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{question.text}</h3>
                    {question.required && (
                      <span className="text-red-500 text-sm font-medium">*</span>
                    )}
                  </div>

                  <div className="ml-4">
                    {question.type === 'rating' && renderRatingInput(question)}
                    {question.type === 'text' && renderTextInput(question)}
                    {question.type === 'yesno' && renderYesNoInput(question)}
                  </div>

                  {question.required && (
                    <p className="text-xs text-red-500 mt-2 ml-4">Esta pergunta é obrigatória</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Submit Button */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="px-12 py-4 bg-purple-600 text-white rounded-2xl font-bold text-lg flex items-center gap-3 hover:bg-purple-700 active:scale-95 transition-all shadow-xl shadow-purple-200 disabled:opacity-50 mx-auto"
              >
                <Send size={24} />
                {submitting ? 'Enviando...' : 'Enviar Respostas'}
              </button>

              <p className="text-xs text-gray-500 mt-4">
                Suas respostas são confidenciais e serão usadas apenas para melhorar nossos serviços.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}