import { useState, useEffect } from "react";
import { X, Plus, Save, Mail, Copy, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";

interface Question {
  id: number;
  text: string;
  type: 'rating' | 'text' | 'yesno';
  required: boolean;
}

export default function ClientSatisfactionForm() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClients, setSelectedClients] = useState<any[]>([]);
  const [showClientSelect, setShowClientSelect] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    expires_days: 30
  });

  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, text: "Qual é o seu nível de satisfação geral com nossos serviços?", type: 'rating', required: true }
  ]);

  const [generatedLinks, setGeneratedLinks] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/entities?type=Client", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(data => setClients(data))
      .catch(() => {});
  }, []);

  const addQuestion = () => {
    const newId = Math.max(...questions.map(q => q.id), 0) + 1;
    setQuestions([...questions, {
      id: newId,
      text: "",
      type: 'rating',
      required: false
    }]);
  };

  const updateQuestion = (id: number, field: keyof Question, value: any) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const toggleClient = (client: any) => {
    setSelectedClients(prev => {
      const exists = prev.find(c => c.id === client.id);
      if (exists) {
        return prev.filter(c => c.id !== client.id);
      }
      return [...prev, client];
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast("Link copiado para a área de transferência!", "success");
    } catch {
      addToast("Não foi possível copiar o link.", "error");
    }
  };

  const openEmailClient = (linkUrl: string, clientEmail: string) => {
    const subject = encodeURIComponent(`Pesquisa de Satisfação - ${formData.title}`);
    const body = encodeURIComponent(`Olá,

Gostaríamos de conhecer sua opinião sobre nossos serviços. Por favor, responda esta breve pesquisa:

${linkUrl}

Agradecemos sua participação!

Atenciosamente,
${localStorage.getItem("user_name") || "Equipe"}`);
    window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      addToast("Digite um título para a pesquisa.", "error");
      return;
    }

    if (selectedClients.length === 0) {
      addToast("Selecione pelo menos um cliente.", "error");
      return;
    }

    if (questions.length === 0 || questions.some(q => !q.text.trim())) {
      addToast("Adicione pelo menos uma pergunta válida.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/client-satisfaction/forms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          questions: questions.map(q => ({
            question_text: q.text,
            question_type: q.type,
            is_required: q.required,
            display_order: q.id
          })),
          client_ids: selectedClients.map(c => c.id),
          expires_days: formData.expires_days
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar pesquisa.");
      }

      const result = await response.json();
      setGeneratedLinks(result.links);
      addToast("Pesquisa criada com sucesso!", "success");

    } catch (error: any) {
      addToast(error.message || "Erro de conexão.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/avaliacoes")}
            aria-label="Voltar para avaliações"
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Criar Pesquisa de Satisfação</h2>
          </div>
        </div>
        <button
          type="submit"
          form="satisfaction-form"
          disabled={loading}
          className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-purple-700 active:scale-95 transition-all shadow-xl shadow-purple-200 disabled:opacity-50"
        >
          <Save size={20} /> {loading ? 'Criando...' : 'Criar Pesquisa'}
        </button>
      </div>

      <form id="satisfaction-form" onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">

        {/* Informações da Pesquisa */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Mail size={22} className="text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">Informações da Pesquisa</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Título da Pesquisa *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Pesquisa de Satisfação 2024"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="expires-days" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Validade (dias)</label>
              <select
                id="expires-days"
                value={formData.expires_days}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_days: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              >
                <option value={7}>7 dias</option>
                <option value={15}>15 dias</option>
                <option value={30}>30 dias</option>
                <option value={60}>60 dias</option>
                <option value={90}>90 dias</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição (opcional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o objetivo da pesquisa..."
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Selecionar Clientes */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Send size={22} className="text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">Selecionar Clientes</h3>
          </div>

          {selectedClients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedClients.map(client => (
                <div key={client.id} className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <span className="text-sm font-medium text-indigo-900">{client.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleClient(client)}
                    aria-label={`Remover ${client.name}`}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowClientSelect(!showClientSelect)}
            className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            {showClientSelect ? 'Fechar' : `Selecionar Clientes (${selectedClients.length} selecionados)`}
          </button>

          {showClientSelect && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-100 rounded-xl">
              {clients.filter(c => !selectedClients.find(sc => sc.id === c.id)).map(client => (
                <button
                  type="button"
                  key={client.id}
                  onClick={() => toggleClient(client)}
                  className="p-3 text-left bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-xl transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{client.name}</p>
                  <p className="text-xs text-gray-500">{client.code} • {client.email || 'Sem email'}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Perguntas Customizadas */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Plus size={22} className="text-amber-600" />
              <h3 className="text-lg font-bold text-gray-900">Perguntas da Pesquisa</h3>
            </div>
            <button
              type="button"
              onClick={addQuestion}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              Adicionar Pergunta
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-500">Pergunta {index + 1}</span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(question.id)}
                          aria-label="Remover pergunta"
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    <textarea
                      value={question.text}
                      onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                      placeholder="Digite sua pergunta aqui..."
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
                      required
                    />

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label htmlFor={`question-type-${question.id}`} className="text-sm text-gray-600">Tipo:</label>
                        <select
                          id={`question-type-${question.id}`}
                          value={question.type}
                          onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                          className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                          <option value="rating">Avaliação (1-5 estrelas)</option>
                          <option value="text">Texto livre</option>
                          <option value="yesno">Sim/Não</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        Obrigatória
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>

      {/* Links Gerados */}
      {generatedLinks.length > 0 && (
        <div className="space-y-4 p-6 bg-emerald-50 border border-emerald-100 rounded-3xl">
          <div className="flex items-center gap-3">
            <Mail size={20} className="text-emerald-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Links Gerados</h3>
              <p className="text-sm text-gray-500">Envie estes links para os clientes responderem a pesquisa.</p>
            </div>
          </div>

          <div className="space-y-3">
            {generatedLinks.map((link: any) => (
              <div key={link.id} className="p-4 bg-white border border-gray-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{link.client_name}</p>
                    <p className="text-sm text-gray-500">{link.client_email}</p>
                    <p className="text-xs text-gray-400 mt-1">Válido até: {link.expires_at}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(link.link_url)}
                      aria-label={`Copiar link para ${link.client_name}`}
                      className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-all flex items-center gap-1"
                    >
                      <Copy size={14} />
                      Copiar
                    </button>
                    <button
                      type="button"
                      onClick={() => openEmailClient(link.link_url, link.client_email)}
                      aria-label={`Enviar email para ${link.client_name}`}
                      className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-all flex items-center gap-1"
                    >
                      <Send size={14} />
                      Email
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}