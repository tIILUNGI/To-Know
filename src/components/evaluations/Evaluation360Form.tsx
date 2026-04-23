import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { ArrowLeft, Save, Users, Building2, TrendingUp, Award, Star, RotateCcw } from "lucide-react";
import { useToast } from "../../context/ToastContext";

type EvaluationMode = "peer" | "self" | "company";

const EVAL_MODES: { value: EvaluationMode; label: string }[] = [
  { value: "self", label: "Auto Avaliação" },
  { value: "peer", label: "Avaliação entre Colegas" },
  { value: "company", label: "Avaliação da Empresa" }
];

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  weight: number;
  max_score: number | null;
}

interface Criterion {
  id: number;
  name: string;
  weight: number;
  max_score: number;
  question_type: string;
}

export default function Evaluation360Form() {
  const navigate = useNavigate();
  const { id: routeEmployeeId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const mode = (searchParams.get("mode") as EvaluationMode) || "peer";
  const employeeId = routeEmployeeId || searchParams.get("employee_id") || "";

  const [employees, setEmployees] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    formType: "360",
    description: "",
    evaluated_employee_id: "",
    evaluator_employee_id: "",
    evaluation_date: new Date().toISOString().split('T')[0]
  });

  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/employees", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).then(r => r.json()).catch(() => []),
      fetch("/api/collaboration/forms?form_type=360", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).then(r => {
        console.log("[DEBUG] Forms response status:", r.status);
        return r.json();
      }).catch((err) => {
        console.error("[DEBUG] Forms fetch error:", err);
        return [];
      })
    ]).then(([employeesData, formsData]) => {
      console.log("[DEBUG] Employees:", employeesData.length, "Forms:", formsData);
      setEmployees(employeesData);
      setForms(formsData);
      if (employeeId) {
        setFormData(prev => ({ ...prev, evaluated_employee_id: employeeId }));
      }
      if (mode === "self" && employeesData.length > 0) {
        const token = localStorage.getItem("token");
        const decoded = JSON.parse(atob(token.split('.')[1] || '{}'));
        const self = employeesData.find((e: any) => e.user_id === decoded?.id) || employeesData[0];
        setFormData(prev => ({ ...prev, evaluated_employee_id: self.id.toString() }));
      }
    });
  }, [employeeId, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectForm = async (formId: number) => {
    console.log("[DEBUG] Selecting form:", formId);
    const form: any = forms.find((f: any) => f.id === formId);
    console.log("[DEBUG] Form found:", form);
    setSelectedForm(form);

    try {
      const questionsResponse = await fetch(`/api/collaboration/forms/${formId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const questionsData: any = await questionsResponse.json();
      console.log("[DEBUG] Questions data raw:", questionsData);
      
      if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
        console.warn("[WARN] No questions array in response");
        setCriteria([]);
        return;
      }
      
      const transformed: Criterion[] = questionsData.questions.map((q: Question) => ({
        id: q.id,
        name: q.question_text,
        weight: q.weight || 1,
        max_score: q.max_score || 5,
        question_type: q.question_type || 'rating'
      }));
      console.log("[DEBUG] Transformed criteria:", transformed);
      setCriteria(transformed);
    } catch (err) {
      console.error("[ERROR] Failed to load questions:", err);
      setCriteria([]);
    }
  };

  const handleResponseChange = (questionId: number, score: number) => {
    setResponses(prev => ({ ...prev, [questionId]: score }));
  };

  const handleCommentChange = (questionId: number, comment: string) => {
    setComments(prev => ({ ...prev, [questionId]: comment }));
  };

  const calculateResults = () => {
    if (criteria.length === 0) return { total: 0, percentage: 0, average: 0, classification: "" };

    let totalWeight = 0;
    let weightedScore = 0;

    criteria.forEach((c) => {
      // Skip text-type questions from scoring
      if (c.question_type === 'text') return;
      const score = responses[c.id] || 0;
      totalWeight += c.weight || 1;
      weightedScore += (score / (c.max_score || 5)) * (c.weight || 1);
    });

    const percentage = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
    const avg = percentage / 100 * 5;

    let classification = "";
    if (percentage >= 90) classification = "Excelente";
    else if (percentage >= 75) classification = "Bom";
    else if (percentage >= 60) classification = "Regular";
    else if (percentage >= 40) classification = "Fraco";
    else classification = "Crítico";

    return { total: weightedScore.toFixed(1), percentage: percentage.toFixed(1), average: avg.toFixed(1), classification };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedForm || !selectedForm.id) {
      addToast("Selecione um formulário de avaliação válido.", "error");
      return;
    }
    if (!formData.evaluated_employee_id) {
      addToast("Selecione o colaborador a ser avaliado.", "error");
      return;
    }
    if (criteria.length === 0) {
      addToast("O formulário não possui questões. Não é possível submeter.", "error");
      return;
    }

    // Check if at least one rating question has a response (text questions don't need response)
    const ratingCriteria = criteria.filter(c => c.question_type !== 'text');
    const hasRatingResponse = ratingCriteria.some(c => responses[c.id] && responses[c.id] > 0);
    if (!hasRatingResponse) {
      addToast("Preencha pelo menos uma questão de avaliação numérica.", "error");
      return;
    }

    setLoading(true);

    try {
      const responsesArray = criteria.map((q) => ({
        question_id: q.id,
        score: q.question_type === 'text' ? null : (responses[q.id] || null),
        comment: comments[q.id] || null
      }));

      console.log("[DEBUG] Submitting 360 eval:", {
        form_id: selectedForm.id,
        form_title: selectedForm.title,
        evaluated_employee_id: formData.evaluated_employee_id,
        criteria_count: criteria.length,
        responses: responsesArray
      });

      const res = await fetch("/api/collaboration/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          form_id: selectedForm.id,
          evaluated_id: null,
          evaluated_employee_id: Number(formData.evaluated_employee_id),
          responses: responsesArray
        })
      });

      const responseData = await res.json().catch(() => ({ message: "Erro ao ler resposta" }));
      console.log("[DEBUG] Server response:", res.status, responseData);

      if (res.ok) {
        addToast("Avaliação 360° submetida com sucesso!", "success");
        setTimeout(() => navigate("/colaboradores"), 1000);
      } else {
        addToast(responseData.message || responseData.error || "Erro ao submeter avaliação.", "error");
      }
    } catch (err: any) {
      console.error("Submit catch:", err);
      addToast("Erro de conexão ou dados inválidos.", "error");
    }

    setLoading(false);
  };

  const selectedEmployee = employees.find((e: any) => e.id.toString() === formData.evaluated_employee_id);
  const results = calculateResults();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/avaliacoes")} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Avaliação 360° - Know You Work</h2>
            <p className="text-xs text-gray-500 mt-1">
              {EVAL_MODES.find(m => m.value === mode)?.label}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Select Form */}
        <div className="card p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star size={22} className="text-indigo-600" />
            Seleccionar Formulário de Avaliação
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {forms.filter(f => f.form_type && f.form_type.toString().toLowerCase() === "360").map((form: any) => (
              <button
                key={form.id}
                type="button"
                onClick={() => handleSelectForm(form.id)}
                className={`p-4 border rounded-xl text-left transition-all ${
                  selectedForm?.id === form.id
                    ? "border-indigo-300 bg-indigo-100 shadow-md"
                    : "border-gray-200 bg-white hover:border-indigo-200"
                }`}
              >
                <p className="font-bold text-gray-900">{form.title}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{form.description}</p>
              </button>
            ))}
          </div>
          {forms.filter(f => f.form_type === "360").length === 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/debug/seed-360", {
                      method: "POST",
                      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                    });
                    if (res.ok) {
                      addToast("Formulário 360° criado! Recarregando...", "success");
                      // Reload forms
                      const r = await fetch("/api/collaboration/forms?form_type=360", {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                      });
                      const data = await r.json();
                      setForms(data);
                    } else {
                      const err = await res.json();
                      addToast(err.message || "Erro ao criar formulário", "error");
                    }
                  } catch (err) {
                    addToast("Erro de conexão", "error");
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
              >
                Criar Formulário 360° Padrão
              </button>
            </div>
          )}
        </div>

        {selectedForm && (
          <>
            {/* 2. Evaluator & Evaluatee */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={22} className="text-blue-600" />
                Quem está a ser avaliado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {mode === "self" ? "Avaliar a mim mesmo" : "Colaborador Avaliado *"}
                  </label>
                  <select
                    name="evaluated_employee_id"
                    value={formData.evaluated_employee_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="">Seleccione...</option>
                    {employees
                      .filter((e: any) => mode === "self" ? e.user_id === JSON.parse(localStorage.getItem("token") || "{}")?.id : true)
                      .map((emp: any) => (
                        <option key={emp.id} value={emp.id}>{emp.name} - {emp.position || "Sem posição"}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data da Avaliação</label>
                  <input
                    type="date"
                    name="evaluation_date"
                    value={formData.evaluation_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 3. Questions & Responses */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 size={22} className="text-amber-600" />
                Critérios de Avaliação
              </h3>

              <div className="space-y-6">
                {criteria.map((q) => {
                  const isText = q.question_type === 'text';
                  const score = responses[q.id] || 0;
                  const comment = comments[q.id] || "";

                  return (
                    <div key={q.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{q.name}</p>
                          <p className="text-xs text-gray-500">
                            {isText ? "Resposta textual" : `Avalie de 0 a ${q.max_score} • Peso: ${q.weight}`}
                          </p>
                        </div>
                        {!isText && (
                          <span className="text-xs font-bold text-amber-600">{score} de {q.max_score}</span>
                        )}
                      </div>

                      {isText ? (
                        <textarea
                          value={comment}
                          onChange={(e) => handleCommentChange(q.id, e.target.value)}
                          placeholder="Digite sua resposta..."
                          rows={3}
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                        />
                      ) : (
                        <>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="0"
                              max={q.max_score || 5}
                              value={score}
                              onChange={(e) => handleResponseChange(q.id, Number(e.target.value))}
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <span className="text-lg font-bold text-amber-600 w-12 text-center">
                              {score}
                            </span>
                          </div>

                          <input
                            type="text"
                            placeholder="Comentário (opcional)"
                            value={comment}
                            onChange={(e) => handleCommentChange(q.id, e.target.value)}
                            className="mt-3 w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* 4. Results */}
        {selectedForm && criteria.length > 0 && (
          <div className="card p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={22} className="text-emerald-600" />
              Resultado da Avaliação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-xl border border-emerald-200 text-center">
                <p className="text-xs font-bold text-emerald-600 uppercase">Pontuação</p>
                <p className="text-2xl font-bold text-emerald-700">{results.total}</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-emerald-200 text-center">
                <p className="text-xs font-bold text-emerald-600 uppercase">Percentual</p>
                <p className="text-2xl font-bold text-emerald-700">{results.percentage}%</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-emerald-200 text-center">
                <p className="text-xs font-bold text-emerald-600 uppercase">Média</p>
                <p className="text-2xl font-bold text-emerald-700">{results.average}</p>
              </div>
              <div className={`p-4 bg-white rounded-xl border text-center ${
                results.classification === "Excelente" || results.classification === "Bom"
                  ? "border-emerald-200"
                  : results.classification === "Regular"
                  ? "border-amber-200"
                  : "border-red-200"
              }`}>
                <p className="text-xs font-bold text-gray-500 uppercase">Classificação</p>
                <p className={`text-lg font-bold ${
                  results.classification === "Excelente" || results.classification === "Bom"
                    ? "text-emerald-700"
                    : results.classification === "Regular"
                    ? "text-amber-700"
                    : "text-red-700"
                }`}>{results.classification}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !selectedForm || !formData.evaluated_employee_id}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50"
          >
            <Save size={20} /> {loading ? "Salvando..." : "Salvar Avaliação"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/avaliacoes")}
            className="px-8 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
