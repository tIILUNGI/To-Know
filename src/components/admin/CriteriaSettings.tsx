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
    <div className="space-y-6 animate-in fade-in">
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar Critério"
        message={`Confirma a remoção do critério "${deleteTarget?.name}"? Ele deixará de aparecer em novos processos.`}
        confirmLabel="Remover"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full m-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900">{editingId ? "Editar Critério" : "Novo Critério"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Código</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} disabled={!!editingId} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none disabled:opacity-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Tipo</label>
                  <select value={formData.process_type} onChange={e => setFormData({...formData, process_type: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none">
                    <option value="Evaluation">Avaliação</option>
                    <option value="Homologation">Homologação</option>
                    <option value="Due Diligence">Due Diligence</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Nome</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Descrição</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-100 outline-none resize-none" rows={2}></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Peso</label>
                  <input type="number" min="1" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Pontuação Máx.</label>
                  <input type="number" min="1" value={formData.max_score} onChange={e => setFormData({...formData, max_score: Number(e.target.value)})} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 active:scale-95 transition-all">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100">Salvar Critério</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center bg-white p-6 rounded-[20px] shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Settings size={22} className="text-blue-600" /> Parametrização de Critérios
          </h2>
          <p className="text-gray-500 font-medium text-xs mt-1">Defina os pesos e pontuações para aprovações e avaliações.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100">
          <Plus size={18} /> Novo Critério
        </button>
      </div>

      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-widest font-black border-b border-gray-100">
              <th className="px-6 py-4">Código</th>
              <th className="px-6 py-4">Critério</th>
              <th className="px-6 py-4 hidden md:table-cell">Processo</th>
              <th className="px-6 py-4 text-center">Peso / Máx</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">Carregando...</td></tr>
            ) : criteria.map(c => (
              <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 text-xs font-black text-blue-600 bg-blue-50/50 rounded-lg m-2 inline-block shadow-sm">{c.code}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-black text-gray-900 group-hover:text-blue-700 transition-colors">{c.name}</div>
                  <div className="text-[11px] text-gray-500 font-medium truncate max-w-xs mt-0.5 leading-relaxed">{c.description}</div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-[9px] font-black uppercase tracking-widest">{c.process_type}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-black text-gray-900">{c.weight}x</span>
                    <span className="text-gray-300">/</span>
                    <span className="font-bold text-gray-500">{c.max_score}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(c)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(c)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
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
