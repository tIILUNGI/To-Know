import { useState, useEffect } from "react";
import { Settings, Plus, Edit2, Trash2, X } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../common/ConfirmModal";

export default function CriteriaSettings() {
  const [criteria, setCriteria] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    code: "", name: "", description: "", process_type: "Evaluation",
    weight: 1, max_score: 10, is_required: true, display_order: 99
  });

  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const fetchCriteria = () => {
    setLoading(true);
    fetch('/api/criteria', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
      setCriteria(data);
      setLoading(false);
    })
    .catch(() => {
      addToast("Erro ao carregar critérios", "error");
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  const handleOpenModal = (c?: any) => {
    if (c) {
      setEditingId(c.id);
      setFormData({
        code: c.code, name: c.name, description: c.description || "",
        process_type: c.process_type, weight: c.weight, max_score: c.max_score,
        is_required: c.is_required, display_order: c.display_order
      });
    } else {
      setEditingId(null);
      setFormData({
        code: `CRIT-${Date.now().toString().slice(-4)}`, name: "", description: "", process_type: "Evaluation",
        weight: 1, max_score: 10, is_required: true, display_order: 99
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = editingId ? `/api/criteria/${editingId}` : "/api/criteria";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        addToast(`Critério ${editingId ? "atualizado" : "criado"} com sucesso`, "success");
        setIsModalOpen(false);
        fetchCriteria();
      } else {
        const data = await res.json();
        addToast(data.message || "Erro ao salvar", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/criteria/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        addToast("Critério removido", "success");
        fetchCriteria();
      } else {
        addToast("Erro ao remover", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in">
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar Critério"
        message={`Confirma a remoção do critério "${deleteTarget?.name}"?`}
        confirmLabel="Remover"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl p-4 sm:p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? "Editar" : "Novo"} Critério</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Código</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} disabled={!!editingId} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Tipo</label>
                  <select value={formData.process_type} onChange={e => setFormData({...formData, process_type: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="Evaluation">Avaliação</option>
                    <option value="Homologation">Homologação</option>
                    <option value="Due Diligence">Due Diligence</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Nome</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Descrição</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none" rows={2}></textarea>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Peso</label>
                  <input type="number" min="1" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Pontuação Máx.</label>
                  <input type="number" min="1" value={formData.max_score} onChange={e => setFormData({...formData, max_score: Number(e.target.value)})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Salvar</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings size={20} className="text-blue-600" /> Critérios
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Defina pesos e pontuações.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
          <Plus size={16} /> Novo
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <th className="px-3 sm:px-4 py-2.5">Código</th>
              <th className="px-3 sm:px-4 py-2.5">Critério</th>
              <th className="px-3 sm:px-4 py-2.5 hidden sm:table-cell">Processo</th>
              <th className="px-3 sm:px-4 py-2.5 text-center">Peso/Máx</th>
              <th className="px-3 sm:px-4 py-2.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-3 sm:px-4 py-6 text-center text-gray-400 text-sm">Carregando...</td></tr>
            ) : criteria.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 sm:px-4 py-2.5">
                  <span className="text-xs font-medium text-blue-600 px-2 py-0.5 bg-blue-50 rounded">{c.code}</span>
                </td>
                <td className="px-3 sm:px-4 py-2.5">
                  <div className="text-sm font-medium text-gray-900">{c.name}</div>
                  <div className="text-[10px] text-gray-500 truncate max-w-[150px] sm:max-w-xs">{c.description}</div>
                </td>
                <td className="px-3 sm:px-4 py-2.5 hidden sm:table-cell">
                  <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{c.process_type}</span>
                </td>
                <td className="px-3 sm:px-4 py-2.5 text-center">
                  <span className="font-medium text-gray-900">{c.weight}/{c.max_score}</span>
                </td>
                <td className="px-3 sm:px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleOpenModal(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(c)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
