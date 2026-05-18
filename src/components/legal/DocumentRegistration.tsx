import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  Calendar,
  FilePlus,
  Save,
  X,
  FileUp,
  CheckCircle,
  Trash2,
  Edit3,
  Download,
  AlertTriangle,
  Search,
  Plus,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import ConfirmModal from "../common/ConfirmModal";
import PageHeader from "../common/PageHeader";

export default function DocumentRegistration() {
  const { t } = useLanguage();
  const { addToast } = useToast();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    version: "",
    publication_date: "",
    validity_date: "",
    service_area: "",
    file_url: ""
  });

  const fetchDocuments = () => {
    setLoading(true);
    fetch("/api/legal-documents", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDocuments(data);
        } else {
          setDocuments([]);
          addToast(data.message || "Erro ao carregar documentos.", "error");
        }
        setLoading(false);
      })
      .catch(() => {
        setDocuments([]);
        addToast("Erro ao carregar documentos.", "error");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingDoc(null);
    setFormData({
      name: "",
      type: "",
      description: "",
      version: "",
      publication_date: new Date().toISOString().split('T')[0],
      validity_date: "",
      service_area: "",
      file_url: ""
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (doc: any) => {
    setEditingDoc(doc);
    setFormData({
      name: doc.name || "",
      type: doc.type || "",
      description: doc.description || "",
      version: doc.versionSeries || doc.version_series || doc.version || "",
      publication_date: doc.publicationDate || doc.publication_date || "",
      validity_date: doc.validityDate || doc.validity_date || doc.expirationDate || doc.expiration_date || "",
      service_area: doc.serviceArea || doc.service_area || "",
      file_url: doc.fileUrl || doc.file_url || ""
    });
    setModalOpen(true);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("name", file.name);
    uploadData.append("type", "Registro");

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: uploadData
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, file_url: data.url }));
        addToast("Ficheiro carregado com sucesso!", "success");
      } else {
        addToast("Erro ao carregar o ficheiro.", "error");
      }
    } catch {
      addToast("Erro de ligação durante o upload.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast("O título é obrigatório.", "error");
      return;
    }

    const url = editingDoc ? `/api/legal-documents/${editingDoc.id}` : "/api/legal-documents";
    const method = editingDoc ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          description: formData.description,
          version_series: formData.version,
          publication_date: formData.publication_date,
          validity_date: formData.validity_date,
          service_area: formData.service_area,
          file_url: formData.file_url
        })
      });

      if (res.ok) {
        addToast(editingDoc ? "Documento atualizado!" : "Documento registado com sucesso!", "success");
        setModalOpen(false);
        fetchDocuments();
      } else {
        const errData = await res.json();
        addToast(errData.message || "Erro ao guardar documento.", "error");
      }
    } catch {
      addToast("Erro de ligação ao servidor.", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/legal-documents/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        addToast("Documento eliminado com sucesso.", "success");
        fetchDocuments();
      } else {
        addToast("Erro ao eliminar documento.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setDeleteTarget(null);
  };

  const getStatus = (expDate: string) => {
    if (!expDate) return { label: "N/A", color: "bg-slate-100 text-slate-600", icon: AlertTriangle };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const validity = new Date(expDate);
    validity.setHours(0, 0, 0, 0);

    const diffTime = validity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "Expirado", color: "bg-red-50 text-red-700 border border-red-200", icon: AlertTriangle };
    } else if (diffDays <= 30) {
      return { label: "Expira em Breve", color: "bg-amber-50 text-amber-700 border border-amber-200", icon: AlertTriangle };
    } else {
      return { label: "Válido", color: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: CheckCircle };
    }
  };

  const totalCount = documents.length;
  const expiredCount = documents.filter(d => {
    if (!d.validity_date && !d.expiration_date) return false;
    const expDate = d.validity_date || d.expiration_date;
    return new Date(expDate).getTime() < new Date().getTime();
  }).length;
  const expiringSoonCount = documents.filter(d => {
    if (!d.validity_date && !d.expiration_date) return false;
    const expDate = d.validity_date || d.expiration_date;
    const diff = new Date(expDate).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;
  const activeCount = totalCount - expiredCount;

  const filteredDocuments = documents.filter(doc => {
    const term = searchTerm.toLowerCase();
    return (
      doc.name?.toLowerCase().includes(term) ||
      doc.type?.toLowerCase().includes(term) ||
      doc.description?.toLowerCase().includes(term) ||
      doc.version_series?.toLowerCase().includes(term) ||
      doc.version?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar Documento"
        message={`Tem certeza que deseja eliminar o documento "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <PageHeader
        title="Cadastramento de Documentação"
        actions={
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            <Plus size={16} strokeWidth={2} />
            Novo Documento
          </button>
        }
      />

      {/* KPI Section */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="metric-label">Total de Registos</p>
              <p className="metric-value">{totalCount}</p>
              <p className="metric-note">Documentos registados no sistema</p>
            </div>
            <div className="module-icon shrink-0 bg-slate-50 text-slate-700">
              <FilePlus size={19} />
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="metric-label">Válidos</p>
              <p className="metric-value">{activeCount}</p>
              <p className="metric-note">Dentro da validade</p>
            </div>
            <div className="module-icon shrink-0 text-emerald-600 bg-emerald-50">
              <CheckCircle size={19} />
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="metric-label">A Expirar em Breve</p>
              <p className="metric-value">{expiringSoonCount}</p>
              <p className="metric-note">Vence nos próximos 30 dias</p>
            </div>
            <div className="module-icon shrink-0 text-amber-600 bg-amber-50">
              <AlertTriangle size={19} />
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="metric-label">Expirados</p>
              <p className="metric-value text-red-600">{expiredCount}</p>
              <p className="metric-note">Requerem renovação urgente</p>
            </div>
            <div className="module-icon shrink-0 text-red-600 bg-red-50">
              <AlertTriangle size={19} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="toolbar-card">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div>
            <h2 className="text-[1.35rem] font-semibold text-slate-900">Arquivo de Documentação</h2>
            <p className="mt-1 text-[1rem] text-slate-500">Registo e controlo de toda a documentação da empresa.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="input-icon" size={16} />
            <input
              type="text"
              placeholder="Pesquisar documento..."
              className="input-with-icon w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Versão / Registo</th>
                <th>Data de Publicação / Emissão</th>
                <th>Data de Validade</th>
                <th>Atendimento</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    A carregar...
                  </td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <div className="empty-state">
                      <div className="empty-state-icon bg-slate-50 text-slate-400">
                        <FilePlus size={28} />
                      </div>
                      <p className="text-[1.2rem] font-semibold text-slate-800">Nenhum documento registado</p>
                      <p>{searchTerm ? "Tente ajustar o termo de pesquisa." : "Adicione o primeiro documento ao registo."}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => {
                  const status = getStatus(doc.validityDate || doc.validity_date || doc.expirationDate || doc.expiration_date);
                  const StatusIcon = status.icon;
                  return (
                    <tr key={doc.id}>
                      <td className="font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <FilePlus size={16} className="text-slate-400" />
                          <span>{doc.name}</span>
                        </div>
                      </td>
                      <td className="text-slate-700 font-medium">{doc.type || "—"}</td>
                      <td className="text-slate-500 text-xs max-w-[200px] truncate" title={doc.description || ""}>
                        {doc.description || "—"}
                      </td>
                      <td className="text-slate-500">{doc.versionSeries || doc.version_series || doc.version || "—"}</td>
                      <td className="text-slate-500 font-semibold">
                        {(doc.publicationDate || doc.publication_date) ? new Date(doc.publicationDate || doc.publication_date).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="text-slate-700 font-medium">
                        {(doc.validityDate || doc.validity_date || doc.expirationDate || doc.expiration_date)
                          ? new Date(doc.validityDate || doc.validity_date || doc.expirationDate || doc.expiration_date).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className="text-slate-500">{doc.serviceArea || doc.service_area || "—"}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <span className={`badge flex items-center gap-1 w-fit ${status.color} mr-2`}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                          {(doc.fileUrl || doc.file_url) && (
                            <a
                              href={doc.fileUrl || doc.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="topbar-icon-btn !h-10 !w-10 !rounded-[12px] !text-slate-400 hover:!text-blue-600"
                              title="Visualizar / Descarregar"
                            >
                              <Download size={15} />
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(doc)}
                            className="topbar-icon-btn !h-10 !w-10 !rounded-[12px] !text-slate-400 hover:!text-blue-600"
                            title="Editar Documento"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(doc)}
                            className="topbar-icon-btn !h-10 !w-10 !rounded-[12px] !text-slate-400 hover:!text-red-600"
                            title="Eliminar Documento"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Create/Edit Document */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in border border-slate-100 my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FilePlus className="text-blue-600" size={20} />
                <h3 className="text-lg font-bold text-slate-800">
                  {editingDoc ? "Editar Registo de Documentação" : "Novo Registo de Documentação"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Regulamento Interno, Certidão de Registo Comercial..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Tipo do Documento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Licença, Certidão, Alvará, Contrato, Apólice de Seguro..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Registo / Versão
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Série A, Versão 2.1, Nº de registo..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Data de Publicação / Emissão
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={formData.publication_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, publication_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Data de Validade
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={formData.validity_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, validity_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Atendimento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: RH, Jurídico, Administração..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.service_area}
                    onChange={(e) => setFormData(prev => ({ ...prev, service_area: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva o documento, o seu objectivo e âmbito de aplicação..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Anexo do Documento (Upload)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-slate-100 border border-gray-200 rounded-xl cursor-pointer text-slate-600 font-medium transition-all text-sm w-full sm:w-auto">
                    <FileUp size={16} />
                    <span>{uploading ? "A carregar..." : "Carregar Imagem / PDF"}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                {formData.file_url && (
                  <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                    <CheckCircle size={12} />
                    Ficheiro carregado com sucesso
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                  <Save size={16} />
                  Guardar Registo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
