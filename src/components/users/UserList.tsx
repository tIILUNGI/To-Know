import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Trash2, Edit, UserPlus, Shield } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../common/ConfirmModal";

export default function UserList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { addToast } = useToast();

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/users", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => {
        addToast("Erro ao carregar utilizadores.", "error");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        addToast("Utilizador eliminado com sucesso.", "success");
        fetchUsers();
      } else {
        addToast("Erro ao eliminar utilizador.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setDeleteTarget(null);
  };

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Administrator":
        return "bg-purple-100 text-purple-700";
      case "Compliance Manager":
        return "bg-blue-100 text-blue-700";
      case "Analyst":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-500">
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar Utilizador"
        message={`Tem certeza que deseja eliminar o utilizador ${deleteTarget?.name}? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Utilizadores</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Gerencie utilizadores do sistema e suas permissões.
          </p>
        </div>
        <Link
          to="/configuracoes/utilizadores/novo"
          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
        >
          <Plus size={16} />
          Novo Utilizador
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Search className="input-icon" size={16} />
            <input
              type="text"
              placeholder="Pesquisar utilizadores..."
              className="input-with-icon block w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-3 sm:px-4 py-2.5">Utilizador</th>
                <th className="px-3 sm:px-4 py-2.5 hidden sm:table-cell">Username</th>
                <th className="px-3 sm:px-4 py-2.5">Email</th>
                <th className="px-3 sm:px-4 py-2.5">Papel</th>
                <th className="px-3 sm:px-4 py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-4 py-8 text-center text-gray-400 text-sm">
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-4 py-8 text-center text-gray-400 text-sm">
                    Nenhum utilizador encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-4 py-2.5 text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-sm text-gray-600 hidden sm:table-cell">
                      {user.username}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-sm text-gray-600">
                      {user.email || "—"}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/configuracoes/utilizadores/${user.id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
