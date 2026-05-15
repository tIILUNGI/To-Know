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
  Download,
  FileBarChart,
  ArrowRight,
  Printer,
  Shield,
  XCircle,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import PageHeader from "../common/PageHeader";
import Evaluation360Dashboard from "./Evaluation360Dashboard";

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
  status?: string | null;
  manager_id?: number | null;
  manager_name?: string | null;
  manager_score?: number | null;
  manager_comment?: string | null;
  concluded_at?: string | null;
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
  const [concludingLink, setConcludingLink] = useState<LinkRecord | null>(null);
  const [conclusionData, setConclusionData] = useState<{score: number, comment: string, responses: Record<number, number>}>({ 
    score: 5, 
    comment: "", 
    responses: {} 
  });
  const [isConcluding, setIsConcluding] = useState(false);
  const [showDashboard, setShowDashboard] = useState<string | null>(null); // Token of the submission to show
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
         "Foi iniciada uma nova avaliação 360° no TOKNOW.",
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

  const handleConclude = async (e: FormEvent) => {
    e.preventDefault();
    if (!concludingLink) return;

    setIsConcluding(true);
    try {
      const res = await fetch(`/api/collaboration/360/conclude/${concludingLink.id}`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          score: conclusionData.score,
          comment: conclusionData.comment,
          responses: Object.entries(conclusionData.responses).map(([qid, score]) => ({
            question_id: Number(qid),
            score
          }))
        })
      });

      if (res.ok) {
        addToast("Avaliação concluída com sucesso!", "success");
        setConcludingLink(null);
        setConclusionData({ score: 5, comment: "", responses: {} });
        await fetchData();
      } else {
        const err = await res.json();
        addToast(err.message || "Erro ao concluir avaliação.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    } finally {
      setIsConcluding(false);
    }
  };

  if (showDashboard) {
    const detail = detailByToken[showDashboard];
    if (detail) {
      return (
        <div className="animate-in fade-in zoom-in duration-500">
           <button 
             onClick={() => setShowDashboard(null)}
             className="mb-4 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors font-medium"
           >
             <ArrowLeft size={18} /> Voltar à Lista
           </button>
           <Evaluation360Dashboard detail={detail} />
        </div>
      );
    }
  }

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
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(routeEmployeeId ? "/colaboradores" : "/avaliacoes")}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Avaliação 360° por Email</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Gerencie convites e acompanhe o progresso das submissões.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
              <Send size={18} />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-base font-bold text-slate-900">Novo Convite</h3>
              <p className="text-xs text-slate-400 font-medium">Envie um link único ao colaborador.</p>
            </div>
          </div>

          <form onSubmit={handleCreateInvite} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.05em]">Colaborador Alvo</label>
                <select
                  value={formData.employee_id}
                  onChange={(event) => handleEmployeeChange(event.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all text-sm text-slate-700"
                >
                  <option value="">Selecione o colaborador...</option>
                  {employees.map((employee: any) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} {employee.position ? `— ${employee.position}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr,150px] gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.05em]">Email do Destinatário</label>
                  <input
                    type="email"
                    value={formData.recipient_email}
                    onChange={(event) => setFormData((prev) => ({ ...prev, recipient_email: event.target.value }))}
                    placeholder="colaborador@empresa.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all text-sm text-slate-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.05em]">Expira em</label>
                  <select
                    value={formData.expires_days}
                    onChange={(event) => setFormData((prev) => ({ ...prev, expires_days: Number(event.target.value) }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all text-sm text-slate-700"
                  >
                    <option value={7}>7 Dias</option>
                    <option value={15}>15 Dias</option>
                    <option value={30}>30 Dias</option>
                    <option value={60}>60 Dias</option>
                  </select>
                </div>
              </div>
            </div>

            {selectedEmployee && (
              <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                  <Shield size={20} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-bold text-slate-900">{selectedEmployee.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {selectedEmployee.position || "Sem cargo"} {selectedEmployee.department ? `• ${selectedEmployee.department}` : ""}
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
            >
              <Send size={18} />
              {creating ? "A processar..." : "Gerar Convite de Avaliação"}
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

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-200 shrink-0">
              <ClipboardList size={18} />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-base font-bold text-slate-900">Perguntas do Formulário</h3>
              <p className="text-xs text-slate-400 font-medium">Critérios avaliados em cada submissão.</p>
            </div>
          </div>

          <div className="space-y-3">
            {template?.sections.map((section) => {
              const sectionQuestions = template.questions.filter(q => q.section_key === section.key);
              return (
                <div key={section.key} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700">{section.title}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{sectionQuestions.length} perguntas</span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {sectionQuestions.map((question, index) => (
                      <li key={question.id} className="flex gap-3 px-4 py-3">
                        <span className="flex-shrink-0 w-5 h-5 rounded bg-indigo-50 text-indigo-600 text-[9px] font-bold flex items-center justify-center mt-0.5">
                          {index + 1}
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {question.question_text}
                        </p>
                      </li>
                    ))}
                    {sectionQuestions.length === 0 && (
                      <li className="px-4 py-3 text-xs text-slate-400 italic">Nenhuma pergunta nesta secção.</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm shrink-0">
              <ClipboardList size={22} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <h3 className="text-base font-bold text-slate-900">Avaliações Pendentes</h3>
              <p className="text-xs text-slate-400 font-medium">Aguardando revisão e nota do gestor.</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {links.filter(l => l.status === 'answered').length === 0 ? (
              <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400 font-medium">Nenhuma avaliação pendente.</p>
              </div>
            ) : (
              links.filter(l => l.status === 'answered').map(link => (
                <div key={link.id} className="p-4 rounded-2xl bg-white border border-slate-200 flex justify-between items-center group hover:shadow-sm transition-all hover:border-indigo-300">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                       <UserRound size={18} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{link.employee_name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Aguardando Nota</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setConcludingLink(link)}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm shrink-0"
                  >
                    Avaliar <ArrowRight size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <h3 className="text-base font-bold text-slate-900">Avaliações Concluídas</h3>
              <p className="text-xs text-slate-400 font-medium">Histórico de processos finalizados.</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {links.filter(l => l.status === 'concluded').length === 0 ? (
              <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400 font-medium">Sem avaliações concluídas.</p>
              </div>
            ) : (
              links.filter(l => l.status === 'concluded').map(link => (
                <div key={link.id} className="p-4 rounded-2xl bg-white border border-slate-200 flex justify-between items-center group hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                       <Check size={18} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{link.employee_name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest">Concluído</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        await handleToggleSubmission(link.token);
                        setShowDashboard(link.token);
                      }}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-100 transition-all flex items-center gap-1.5"
                    >
                      Dashboard <FileBarChart size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteInvite(link.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {concludingLink && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-300 border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
                  <FileText size={20} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-lg font-bold text-slate-900 leading-none">Avaliar Colaborador</h3>
                  <p className="text-xs text-slate-400 font-medium">Finalização da Avaliação 360°</p>
                </div>
              </div>
              <button onClick={() => setConcludingLink(null)} className="text-slate-400 hover:bg-slate-50 p-2 rounded-xl transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleConclude} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">


              <div className="space-y-6 py-4 border-y border-gray-100">
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                  <h4 className="text-sm font-bold text-amber-900">Parte 4: Avaliação do Funcionário pelo Gestor</h4>
                  <p className="text-[11px] text-amber-700 mt-1 uppercase tracking-wider font-medium">Por favor, avalie o desempenho e contribuições do seu subordinado direto.</p>
                </div>

                {template?.questions.filter(q => q.section_key === 'manager_eval').map((q, idx) => (
                  <div key={q.id} className="space-y-3">
                    <p className="text-sm font-bold text-[#5e4428]">{idx + 1}. {q.question_text}</p>
                    <div className="space-y-2 ml-2">
                      {template.scale.map(opt => (
                        <label 
                          key={opt.value} 
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            conclusionData.responses[q.id] === opt.value
                              ? "bg-white border-[#a17e58] shadow-sm shadow-amber-900/5 ring-1 ring-[#a17e58]"
                              : "bg-gray-50 border-transparent hover:border-gray-200"
                          }`}
                        >
                          <div className="relative flex items-center justify-center">
                            <input
                              type="radio"
                              name={`conclude-q-${q.id}`}
                              checked={conclusionData.responses[q.id] === opt.value}
                              onChange={() => setConclusionData(prev => ({
                                ...prev,
                                responses: { ...prev.responses, [q.id]: opt.value }
                              }))}
                              className="appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-[#a17e58] transition-all cursor-pointer"
                            />
                            {conclusionData.responses[q.id] === opt.value && (
                              <div className="absolute w-2.5 h-2.5 bg-[#a17e58] rounded-full" />
                            )}
                          </div>
                          <span className={`text-sm ${conclusionData.responses[q.id] === opt.value ? "font-bold text-[#5e4428]" : "text-gray-600"}`}>
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nota Global (1-10)</label>
                  <input 
                    type="number" 
                    min="1" max="10" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    value={conclusionData.score}
                    onChange={e => setConclusionData(prev => ({ ...prev, score: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-end pb-1">
                   <p className="text-[10px] text-gray-400">Esta nota será usada no cálculo médio final do colaborador.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Feedback Final do Gestor</label>
                <textarea 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl h-24 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Observações sobre o desempenho..."
                  value={conclusionData.comment}
                  onChange={e => setConclusionData(prev => ({ ...prev, comment: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                <button 
                  type="submit" 
                  disabled={isConcluding}
                  className="flex-[2] bg-[#a17e58] text-white py-4 rounded-2xl font-bold hover:bg-[#8a6b49] transition-all disabled:opacity-50 shadow-lg shadow-amber-900/10"
                >
                  {isConcluding ? "A Enviar..." : "Enviar Avaliação Final"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setConcludingLink(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Eye size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Respostas Guardadas</h3>
            <p className="text-sm text-gray-500 mt-0.5">Acompanhamento detalhado de cada submissão recebida.</p>
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

                        {submission.status === 'concluded' && (
                          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                            <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                              <Check size={16} /> Avaliação Final do Gestor
                            </h4>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-[100px,1fr] gap-4">
                              <div className="text-center p-2 bg-white rounded-xl border border-amber-100">
                                <p className="text-[10px] text-gray-400 uppercase">Nota</p>
                                <p className="text-xl font-bold text-amber-700">{submission.manager_score}/10</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase">Feedback</p>
                                <p className="text-sm text-gray-700 italic">"{submission.manager_comment || "Sem comentário adicional."}"</p>
                                <p className="text-[10px] text-gray-400 mt-2">Concluído em: {submission.concluded_at ? new Date(submission.concluded_at).toLocaleString() : '—'}</p>
                              </div>
                            </div>
                          </div>
                        )}

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
