import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, FileText, Gauge, RefreshCw, ArrowLeft } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../common/ConfirmModal";

export default function ProcessTypesSettings() {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "", sort_order: 0, is_active: true });
  const { addToast } = useToast();

  const fetchTypes = () => {
    setLoading(true);
    fetch("/api/process-types/all", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setTypes(data);
        setLoading(false);
      })
      .catch(() => {
        addToast("Erro ao carregar tipos de processo.", "error");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleOpenModal = (type?: any) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        description: type.description || "",
        sort_order: type.sort_order || 0,
        is_active: !!type.is_active
      });
    } else {
      setEditingType(null);
      setFormData({ name: "", description: "", sort_order: 0, is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      addToast("O nome é obrigatório.", "error");
      return;
    }

    try {
      const url = editingType ? `/api/process-types/${editingType.id}` : "/api/process-types";
      const method = editingType ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        addToast(editingType ? "Tipo actualizado!" : "Tipo criado!", "success");
        setIsModalOpen(false);
        fetchTypes();
      } else {
        const err = await res.json();
        addToast(err.message || "Erro ao salvar.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/process-types/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        addToast("Tipo eliminado com sucesso.", "success");
        fetchTypes();
      } else {
        const err = await res.json();
        addToast(err.message || "Erro ao eliminar.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setDeleteTarget(null);
  };

  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "aprovação": return <FileText size={20} className="text-blue-600" />;
      case "avaliação": return <Gauge size={20} className="text-green-600" />;
      case "reavaliação": return <RefreshCw size={20} className="text-amber-600" />;
      default: return <FileText size={20} className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar Tipo de Processo"
        message={`Tem certeza que deseja eliminar o tipo "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
           <div>
             <h2 className="text-2xl font-bold text-gray-900">Tipos de Processo</h2>
           </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Novo Tipo
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingType ? "Editar Tipo" : "Novo Tipo"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Aprovação"
                  className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional"
                  rows={3}
                  className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ordem</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-10 text-gray-400">Carregando...</div>
        ) : types.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-400">Nenhum tipo de processo cadastrado.</div>
        ) : (
          types.map((type) => (
            <div key={type.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-blue-200 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getIcon(type.name)}
                  <h3 className="text-base font-bold text-gray-900">{type.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenModal(type)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(type)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">{type.description || "Sem descrição"}</p>
              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded ${type.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {type.is_active ? "Ativo" : "Inativo"}
                </span>
                <span className="text-gray-400">Ordem: {type.sort_order}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
