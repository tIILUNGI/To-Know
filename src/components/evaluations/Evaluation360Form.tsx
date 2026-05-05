import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  ExternalLink,
  Eye,
  Mail,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

type Section = {
  key: string;
  title: string;
  description: string;
};

type ScaleOption = {
  value: number;
  label: string;
};

type Question = {
  id: number;
  question_text: string;
  section_key: string;
  display_order: number;
  max_score: number;
};

type TemplateData = {
  form: { id: number; title: string; description: string };
  sections: Section[];
  scale: ScaleOption[];
  questions: Question[];
};

type LinkRecord = {
  id: number;
  token: string;
  recipient_email: string;
  expires_at: string;
  is_used: number;
  submitted_at?: string | null;
  employee_name: string;
  employee_email?: string | null;
  position?: string | null;
  department?: string | null;
  percentage?: number | null;
  classification?: string | null;
};

type SubmissionDetail = {
  submission: {
    token: string;
    employee_name: string;
    employee_email?: string | null;
    recipient_email?: string | null;
    percentage: number;
    classification: string;
    used_at?: string | null;
  };
  sections: Section[];
  scale: ScaleOption[];
  responses: Array<{
    question_id: number;
    question_text: string;
    score: number;
    section_key: string;
    peer_name?: string | null;
    responder_email?: string | null;
  }>;
};

export default function Evaluation360Form() {
  const navigate = useNavigate();
  const { id: routeEmployeeId } = useParams<{ id: string }>();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [detailByToken, setDetailByToken] = useState<Record<string, SubmissionDetail>>({});
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const [generatedInvite, setGeneratedInvite] = useState<any | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employee_id: routeEmployeeId || "",
    recipient_email: "",
    expires_days: 30,
  });

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesRes, templateRes, linksRes, submissionsRes] = await Promise.all([
        fetch("/api/employees", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
        fetch("/api/collaboration/360/template", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
        fetch("/api/collaboration/360/links", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
        fetch("/api/collaboration/360/submissions", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
      ]);

      if (!employeesRes.ok || !templateRes.ok || !linksRes.ok || !submissionsRes.ok) {
        throw new Error("Falha ao carregar a avaliação 360.");
      }

      const [employeesData, templateData, linksData, submissionsData] = await Promise.all([
        employeesRes.json(),
        templateRes.json(),
        linksRes.json(),
        submissionsRes.json(),
      ]);

      setEmployees(employeesData);
      setTemplate(templateData);
      setLinks(linksData);
      setSubmissions(submissionsData);

      if (routeEmployeeId) {
        const employee = employeesData.find((item: any) => item.id.toString() === routeEmployeeId);
        if (employee) {
          setFormData((prev) => ({
            ...prev,
            employee_id: employee.id.toString(),
            recipient_email: employee.email || prev.recipient_email,
          }));
        }
      }
    } catch (err: any) {
      addToast(err.message || "Erro ao carregar a avaliação 360.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [routeEmployeeId]);

  const selectedEmployee = employees.find((employee: any) => employee.id.toString() === formData.employee_id);

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find((item: any) => item.id.toString() === employeeId);
    setFormData((prev) => ({
      ...prev,
      employee_id: employeeId,
      recipient_email: employee?.email || "",
    }));
  };

  const openMailDraft = (employeeName: string, recipientEmail: string, token: string) => {
    const linkUrl = `${window.location.origin}/avaliacao/${token}`;
    const subject = encodeURIComponent(`Avaliação 360° - ${employeeName}`);
    const body = encodeURIComponent(
      [
        `Olá ${employeeName},`,
        "",
        "Foi iniciada uma nova avaliação 360° no To Know.",
        "Use o link abaixo para preencher o formulário:",
        linkUrl,
        "",
        "Obrigado.",
      ].join("\n")
    );
    window.location.href = `mailto:${recipientEmail || ""}?subject=${subject}&body=${body}`;
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      addToast("Link copiado com sucesso.", "success");
      setTimeout(() => setCopiedValue(null), 2000);
    } catch {
      addToast("Não foi possível copiar o link.", "error");
    }
  };

  const handleCreateInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.employee_id) {
      addToast("Selecione o colaborador.", "error");
      return;
    }
    if (!formData.recipient_email) {
      addToast("Informe o email do colaborador.", "error");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/collaboration/360/links", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          employee_id: Number(formData.employee_id),
          recipient_email: formData.recipient_email,
          expires_days: formData.expires_days,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Erro ao gerar o convite.");
      }

      setGeneratedInvite(payload);
      addToast("Convite 360 criado com sucesso.", "success");
      if (payload.email_draft?.mailto_url) {
        window.location.href = payload.email_draft.mailto_url;
      }
      await fetchData();
    } catch (err: any) {
      addToast(err.message || "Erro ao gerar o convite.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInvite = async (id: number) => {
    if (!confirm("Eliminar este convite?")) return;
    try {
      const response = await fetch(`/api/collaboration/360/links/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Erro ao eliminar convite.");
      }

      addToast("Convite eliminado.", "success");
      setLinks((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      addToast(err.message || "Erro ao eliminar convite.", "error");
    }
  };

  const handleToggleSubmission = async (token: string) => {
    if (expandedToken === token) {
      setExpandedToken(null);
      return;
    }

    if (!detailByToken[token]) {
      try {
        const response = await fetch(`/api/collaboration/360/submissions/${token}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.message || "Erro ao carregar respostas.");
        }

        const payload = await response.json();
        setDetailByToken((prev) => ({ ...prev, [token]: payload }));
      } catch (err: any) {
        addToast(err.message || "Erro ao carregar respostas.", "error");
        return;
      }
    }

    setExpandedToken(token);
  };

  const getSectionQuestions = (sectionKey: string) =>
    template?.questions.filter((question) => question.section_key === sectionKey) || [];

  const isExpired = (date?: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500">Carregando avaliação 360...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(routeEmployeeId ? "/colaboradores" : "/avaliacoes")}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Avaliação 360° por Email</h2>
            <p className="text-sm text-gray-500 mt-1">
              Gere o link, envie ao colaborador e acompanhe todas as respostas guardadas no To Know.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-stone-50 border-amber-100">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-amber-200 flex items-center justify-center text-amber-700">
            <Mail size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">Fluxo único da avaliação 360°</h3>
            <p className="text-sm text-gray-600">
              Selecione o colaborador, confirme o email, gere o link e envie o formulário completo. Quando o colaborador
              preencher, todas as respostas ficam armazenadas por colaborador para consulta posterior.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr,0.85fr] gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Send size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Iniciar Nova Avaliação 360°</h3>
              <p className="text-sm text-gray-500">Nome do colaborador e email de envio.</p>
            </div>
          </div>

          <form onSubmit={handleCreateInvite} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Colaborador *</label>
              <select
                value={formData.employee_id}
                onChange={(event) => handleEmployeeChange(event.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="">Selecione...</option>
                {employees.map((employee: any) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} {employee.position ? `- ${employee.position}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email *</label>
                <input
                  type="email"
                  value={formData.recipient_email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, recipient_email: event.target.value }))}
                  placeholder="colaborador@empresa.com"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Validade</label>
                <select
                  value={formData.expires_days}
                  onChange={(event) => setFormData((prev) => ({ ...prev, expires_days: Number(event.target.value) }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value={7}>7 dias</option>
                  <option value={15}>15 dias</option>
                  <option value={30}>30 dias</option>
                  <option value={60}>60 dias</option>
                </select>
              </div>
            </div>

            {selectedEmployee && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <UserRound size={16} className="text-indigo-600" />
                  {selectedEmployee.name}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedEmployee.position || "Sem cargo"} {selectedEmployee.department ? `• ${selectedEmployee.department}` : ""}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send size={18} />
              {creating ? "Gerando..." : "Gerar Link e Abrir Email"}
            </button>
          </form>

          {generatedInvite && (
            <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <Check size={18} />
                Convite criado para {generatedInvite.employee?.name}
              </div>
              <p className="text-sm text-gray-600 break-all">{generatedInvite.link_url}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedInvite.link_url)}
                  className="px-4 py-2 bg-white border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <Copy size={14} className="inline mr-2" />
                  {copiedValue === generatedInvite.link_url ? "Copiado" : "Copiar Link"}
                </button>
                <button
                  type="button"
                  onClick={() => window.open(generatedInvite.link_url, "_blank", "noopener,noreferrer")}
                  className="px-4 py-2 bg-white border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <ExternalLink size={14} className="inline mr-2" />
                  Abrir Formulário
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openMailDraft(
                      generatedInvite.employee?.name || "Colaborador",
                      generatedInvite.employee?.email || generatedInvite.employee?.recipient_email || formData.recipient_email,
                      generatedInvite.token
                    )
                  }
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                >
                  <Mail size={14} className="inline mr-2" />
                  Abrir Email
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ClipboardList size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Perguntas do Formulário</h3>
              <p className="text-sm text-gray-500">As 3 partes usadas no formulário enviado por email.</p>
            </div>
          </div>

          <div className="space-y-4">
            {template?.sections.map((section) => (
              <div key={section.key} className="p-4 rounded-2xl bg-[#fbf7ef] border border-[#eadfcd]">
                <h4 className="text-sm font-bold text-[#6e4f2f]">{section.title}</h4>
                <p className="text-xs text-[#8a6b49] mt-1">{section.description}</p>
                <ol className="mt-3 space-y-2 text-sm text-gray-700">
                  {getSectionQuestions(section.key).map((question, index) => (
                    <li key={question.id}>
                      {index + 1}. {question.question_text}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Convites Gerados</h3>
          <p className="text-sm text-gray-500 mt-1">Controle os links enviados aos colaboradores.</p>
        </div>

        {links.length === 0 ? (
          <div className="p-10 text-center text-gray-400">Nenhum convite criado ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Colaborador</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 hidden md:table-cell">Validade</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {links.map((link) => {
                  const fullUrl = `${window.location.origin}/avaliacao/${link.token}`;
                  const expired = isExpired(link.expires_at);
                  const used = Number(link.is_used) === 1;

                  return (
                    <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">{link.employee_name}</p>
                        <p className="text-xs text-gray-500">
                          {link.position || "Sem cargo"} {link.department ? `• ${link.department}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{link.recipient_email}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <CalendarDays size={12} />
                          {link.expires_at || "Sem data"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {used ? (
                          <span className="badge badge-success text-xs">Preenchido</span>
                        ) : expired ? (
                          <span className="badge badge-danger text-xs">Expirado</span>
                        ) : (
                          <span className="badge badge-neutral text-xs">Ativo</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => copyToClipboard(fullUrl)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Copiar link"
                          >
                            {copiedValue === fullUrl ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                          </button>
                          <button
                            onClick={() => window.open(fullUrl, "_blank", "noopener,noreferrer")}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Abrir formulário"
                          >
                            <ExternalLink size={15} />
                          </button>
                          <button
                            onClick={() => openMailDraft(link.employee_name, link.recipient_email, link.token)}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Abrir email"
                          >
                            <Mail size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteInvite(link.id)}
                            disabled={used}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                            title="Eliminar convite"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Eye size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Respostas Guardadas</h3>
            <p className="text-sm text-gray-500">Cada submissão fica associada ao colaborador avaliado.</p>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
            Nenhuma resposta recebida ainda.
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => {
              const detail = detailByToken[submission.token];
              return (
                <div key={submission.token} className="border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="p-4 bg-white flex flex-col md:flex-row md:items-center gap-4 justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{submission.employee_name}</p>
                      <p className="text-xs text-gray-500">
                        {submission.position || "Sem cargo"} {submission.department ? `• ${submission.department}` : ""}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Recebido em{" "}
                        {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString("pt-BR") : "—"}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-gray-400">Resultado</p>
                        <p className="text-lg font-bold text-emerald-700">{Math.round(submission.percentage || 0)}%</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-gray-400">Classificação</p>
                        <p className="text-sm font-semibold text-gray-700">{submission.classification}</p>
                      </div>
                      <button
                        onClick={() => handleToggleSubmission(submission.token)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                      >
                        {expandedToken === submission.token ? "Ocultar" : "Ver respostas"}
                      </button>
                    </div>
                  </div>

                  {expandedToken === submission.token && detail && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 rounded-xl bg-white border border-gray-100">
                          <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {detail.submission.recipient_email || detail.submission.employee_email || "—"}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-gray-100">
                          <p className="text-xs text-gray-400 uppercase tracking-wider">Colega Avaliado</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {detail.responses.find((response) => response.peer_name)?.peer_name || "—"}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-gray-100">
                          <p className="text-xs text-gray-400 uppercase tracking-wider">Score Final</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {Math.round(detail.submission.percentage)}% • {detail.submission.classification}
                          </p>
                        </div>
                      </div>

                      {detail.sections.map((section) => {
                        const responses = detail.responses.filter((response) => response.section_key === section.key);
                        const scaleMap = Object.fromEntries(detail.scale.map((option) => [option.value, option.label]));
                        return (
                          <div key={section.key} className="p-4 rounded-2xl bg-[#fbf7ef] border border-[#eadfcd]">
                            <h4 className="text-sm font-bold text-[#6e4f2f]">{section.title}</h4>
                            <p className="text-xs text-[#8a6b49] mt-1">{section.description}</p>
                            <div className="mt-3 space-y-3">
                              {responses.map((response, index) => (
                                <div key={response.question_id} className="p-3 rounded-xl bg-white border border-[#eadfcd]">
                                  <div className="flex justify-between gap-3">
                                    <p className="text-sm text-gray-800">
                                      {index + 1}. {response.question_text}
                                    </p>
                                    <span className="text-sm font-bold text-amber-700 whitespace-nowrap">
                                      {scaleMap[response.score] || response.score}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
