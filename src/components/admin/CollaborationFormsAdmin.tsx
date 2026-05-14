import { useEffect, useMemo, useState } from "react";

// TSX-only admin view (formulários e respostas)
import { Eye, Filter, Search, FileText, Clock } from "lucide-react";
import { useToast } from "../../context/ToastContext";

type CollaborationForm = {
  id: number;
  title: string;
  description?: string;
  form_type?: string;
  entity_type?: string;
  is_active?: number;
};

type SubmissionRow = {
  id: number;
  token: string;
  recipient_name?: string;
  recipient_email?: string;
  employee_id?: number;
  employee_name?: string;
  position?: string;
  department?: string;
  percentage?: number;
  classification?: string;
  submitted_at?: string;
  status?: string;
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
  sections: Array<{ key: string; title: string; description: string }>;
  scale: Array<{ value: number; label: string }>;
  responses: Array<{
    question_id: number;
    question_text: string;
    score: number;
    section_key: string;
    peer_name?: string | null;
    responder_email?: string | null;
  }>;
};

export default function CollaborationFormsAdmin() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [formsLoading, setFormsLoading] = useState(true);

  const [formType, setFormType] = useState<string>("360");
  const [search, setSearch] = useState<string>("");

  const [forms, setForms] = useState<CollaborationForm[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` }),
    []
  );

  const loadForms = async () => {
    setFormsLoading(true);
    try {
      const url = `/api/collaboration/forms${formType ? `?form_type=${encodeURIComponent(formType)}` : ""}`;
      const res = await fetch(url, { headers: authHeaders });
      if (!res.ok) throw new Error("Erro ao carregar formulários.");
      const data = (await res.json()) as CollaborationForm[];
      setForms(data);
    } catch (e: any) {
      addToast(e?.message || "Erro ao carregar formulários.", "error");
    } finally {
      setFormsLoading(false);
    }
  };

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const url = `/api/collaboration/360/submissions`;
      const res = await fetch(url, { headers: authHeaders });
      if (!res.ok) throw new Error("Erro ao carregar respostas recebidas.");
      const data = (await res.json()) as SubmissionRow[];
      setSubmissions(data);
    } catch (e: any) {
      addToast(e?.message || "Erro ao carregar respostas recebidas.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (token: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/collaboration/360/submissions/${token}`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Erro ao carregar detalhes da resposta.");
      const payload = (await res.json()) as SubmissionDetail;
      setDetail(payload);
    } catch (e: any) {
      addToast(e?.message || "Erro ao carregar detalhes.", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadForms();
  }, [formType]);

  useEffect(() => {
    void loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSubmissions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return submissions;

    return submissions.filter((s) => {
      const hay = [
        s.employee_name,
        s.employee_id?.toString(),
        s.recipient_email,
        s.recipient_name,
        s.department,
        s.position,
        s.classification,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [submissions, search]);

  const selectedDetail = useMemo(() => {
    if (!selectedToken) return null;
    return detail;
  }, [detail, selectedToken]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            Formulários & Respostas (Admin)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Listagem de formulários criados e visualização das respostas recebidas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-100 outline-none"
              aria-label="Pesquisar respostas"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
              <Filter size={14} className="text-gray-500" />
            </div>
            <select
              aria-label="Tipo de formulário"
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-100 outline-none"
            >
              <option value="360">360°</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Formulários criados</h2>
              <p className="text-sm text-gray-500">Total: {forms.length}</p>
            </div>
          </div>

          {formsLoading ? (
            <div className="py-10 text-center text-gray-500">Carregando...</div>
          ) : forms.length === 0 ? (
            <div className="py-10 text-center text-gray-500 border-2 border-dashed border-gray-100 rounded-xl">
              Nenhum formulário encontrado.
            </div>
          ) : (
            <div className="space-y-3">
              {forms.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-2xl border border-gray-100 bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{f.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tipo: {f.form_type || "—"} • Entidade: {f.entity_type || "—"}
                      </p>
                    </div>
                    <span className="badge badge-neutral text-xs">ID: {f.id}</span>
                  </div>
                  {f.description ? (
                    <p className="text-xs text-gray-600 mt-2">{f.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Respostas recebidas</h2>
              <p className="text-sm text-gray-500">Visualize detalhes da submissão.</p>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-10 text-center text-gray-500 border-2 border-dashed border-gray-100 rounded-xl">
              Nenhuma resposta encontrada.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedToken(s.token);
                    void loadDetail(s.token);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedToken === s.token
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-100 hover:border-blue-200 bg-white"
                  }`}
                  aria-label={`Ver respostas para ${s.employee_name || s.recipient_name || "colaborador"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {s.employee_name || s.recipient_name || "Colaborador"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {s.employee_email || s.recipient_email || "—"}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {s.department || "—"} {s.position ? `• ${s.position}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="badge badge-neutral text-xs">
                        {s.classification || "Sem classificação"}
                      </span>
                      <span className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                        <Eye size={14} /> Ver
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">
                    Submetido em:{" "}
                    {s.submitted_at
                      ? new Date(s.submitted_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gray-50 text-gray-700 flex items-center justify-center">
            <Eye size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Detalhe da Resposta</h2>
            <p className="text-sm text-gray-500">
              {selectedToken ? "Carregando/Visualizando" : "Selecione uma resposta"}
            </p>
          </div>
        </div>

        {detailLoading ? (
          <div className="py-10 text-center text-gray-500">Carregando detalhes...</div>
        ) : !selectedDetail ? (
          <div className="py-10 text-center text-gray-500 border-2 border-dashed border-gray-100 rounded-xl">
            Nenhuma resposta selecionada.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Colaborador</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {selectedDetail.submission.employee_name}
                </p>
              </div>
              <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Classificação</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {selectedDetail.submission.classification}
                </p>
              </div>
              <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Percentual</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {Math.round(selectedDetail.submission.percentage)}%
                </p>
              </div>
            </div>

            {selectedDetail.sections.map((section) => {
              const sectionResponses = selectedDetail.responses.filter(
                (r) => r.section_key === section.key
              );

              return (
                <div
                  key={section.key}
                  className="p-4 rounded-2xl border border-gray-100 bg-white"
                >
                  <h3 className="text-sm font-bold text-gray-900">{section.title}</h3>
                  {section.description ? (
                    <p className="text-xs text-gray-500 mt-1">{section.description}</p>
                  ) : null}

                  {sectionResponses.length === 0 ? (
                    <p className="text-xs text-gray-500 mt-3">Sem respostas para esta seção.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {sectionResponses.map((r, idx) => (
                        <div
                          key={r.question_id}
                          className="flex items-start justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {idx + 1}. {r.question_text}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] uppercase tracking-wider text-gray-500">Nota</p>
                            <p className="text-sm font-bold text-blue-700">{r.score}</p>
                          </div>
                        </div>
                      ))}
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

