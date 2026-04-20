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
    code: "", name: "", description: "", 
    entity_type: "", process_type: "Evaluation", evaluation_type: "",
    weight: 1, min_score: 0, max_score: 10, 
    is_required: true, is_active: true, display_order: 99
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
        entity_type: c.entity_type || "",
        process_type: c.process_type || "Evaluation",
        evaluation_type: c.evaluation_type || "",
        weight: c.weight, min_score: c.min_score || 0, max_score: c.max_score,
        is_required: c.is_required, is_active: c.is_active, display_order: c.display_order
      });
    } else {
      setEditingId(null);
      setFormData({
        code: `CRIT-${Date.now().toString().slice(-4)}`, name: "", description: "",
        entity_type: "", process_type: "Evaluation", evaluation_type: "",
        weight: 1, min_score: 0, max_score: 10,
        is_required: true, is_active: true, display_order: 99
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = editingId ? `/api/criteria/${editingId}` : "/api/criteria";
      const method = editingId ? "PUT" : "POST";
      
      const payload = {
        ...formData,
        entity_type: formData.entity_type || null,
        evaluation_type: formData.evaluation_type || null,
        min_score: formData.min_score || 0,
        is_active: formData.is_active ? 1 : 0,
        is_required: formData.is_required ? 1 : 0
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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
          <div className="relative bg-white rounded-xl shadow-2xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
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
                  <label className="text-xs font-medium text-gray-500">Ordem</label>
                  <input type="number" min="0" value={formData.display_order} onChange={e => setFormData({...formData, display_order: Number(e.target.value)})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Nome do Critério</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Descrição</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none" rows={2}></textarea>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Tipo de Entidade</label>
                  <select value={formData.entity_type} onChange={e => setFormData({...formData, entity_type: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="">Ambos</option>
                    <option value="Supplier">Fornecedor</option>
                    <option value="Client">Cliente</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Tipo de Processo</label>
                  <select value={formData.process_type} onChange={e => setFormData({...formData, process_type: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="Aprovação">Aprovação</option>
                    <option value="Avaliação">Avaliação</option>
                    <option value="Reavaliação">Reavaliação</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Tipo de Avaliação</label>
                <select value={formData.evaluation_type} onChange={e => setFormData({...formData, evaluation_type: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  <option value="">N/A</option>
                  <option value="Performance">Performance</option>
                  <option value="Satisfaction">Satisfação</option>
                  <option value="SupplierSatisfaction">Satisfação do Fornecedor</option>
                  <option value="ClientPerformance">Performance do Cliente</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Peso</label>
                  <input type="number" min="0.1" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Nota Mín.</label>
                  <input type="number" min="0" value={formData.min_score} onChange={e => setFormData({...formData, min_score: Number(e.target.value)})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Nota Máx.</label>
                  <input type="number" min="1" value={formData.max_score} onChange={e => setFormData({...formData, max_score: Number(e.target.value)})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
              </div>

              <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formData.is_required} onChange={e => setFormData({...formData, is_required: e.target.checked})} className="rounded" />
                  Obrigatório
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded" />
                  Ativo
                </label>
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
                <th className="px-2 sm:px-4 py-2.5">Código</th>
                <th className="px-2 sm:px-4 py-2.5">Nome</th>
                <th className="px-2 sm:px-4 py-2.5 hidden sm:table-cell">Entidade</th>
                <th className="px-2 sm:px-4 py-2.5 hidden sm:table-cell">Processo</th>
                <th className="px-2 sm:px-4 py-2.5 hidden md:table-cell">Avaliação</th>
                <th className="px-2 sm:px-4 py-2.5 text-center">Peso/Máx</th>
                <th className="px-2 sm:px-4 py-2.5 text-center">Min/Max</th>
                <th className="px-2 sm:px-4 py-2.5 text-center">Obs.</th>
                <th className="px-2 sm:px-4 py-2.5 text-right">Acções</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={9} className="px-3 sm:px-4 py-6 text-center text-gray-400 text-sm">Carregando...</td></tr>
            ) : criteria.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-2 sm:px-4 py-2.5">
                  <span className="text-xs font-medium text-blue-600 px-2 py-0.5 bg-blue-50 rounded">{c.code}</span>
                </td>
                <td className="px-2 sm:px-4 py-2.5">
                  <div className="text-sm font-medium text-gray-900">{c.name}</div>
                  <div className="text-[10px] text-gray-500 truncate max-w-[120px] sm:max-w-xs">{c.description}</div>
                </td>
                <td className="px-2 sm:px-4 py-2.5 hidden sm:table-cell">
                  <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{c.entity_type || "Ambos"}</span>
                </td>
                <td className="px-2 sm:px-4 py-2.5 hidden sm:table-cell">
                  <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{c.process_type}</span>
                </td>
                <td className="px-2 sm:px-4 py-2.5 hidden md:table-cell">
                  <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded">{c.evaluation_type || "—"}</span>
                </td>
                <td className="px-2 sm:px-4 py-2.5 text-center">
                  <span className="font-medium text-gray-900 text-xs">{c.weight}</span>
                </td>
                <td className="px-2 sm:px-4 py-2.5 text-center">
                  <span className="text-xs text-gray-600">{c.min_score}/{c.max_score}</span>
                </td>
                <td className="px-2 sm:px-4 py-2.5 text-center">
                  <div className="flex flex-col gap-1">
                    {c.is_required ? <span className="text-[9px] bg-red-50 text-red-600 px-1 rounded">Obr.</span> : null}
                    {c.is_active ? <span className="text-[9px] bg-green-50 text-green-600 px-1 rounded">Ativo</span> : <span className="text-[9px] bg-gray-100 text-gray-500 px-1 rounded">Inativo</span>}
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-2.5 text-right">
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
