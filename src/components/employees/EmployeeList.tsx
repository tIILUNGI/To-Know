import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Mail, Phone, MapPin, Building2, UserPlus } from "lucide-react";
import { useToast } from "../../context/ToastContext";

export default function EmployeeList() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterDepartment) params.append("department", filterDepartment);
    if (filterStatus) params.append("status", filterStatus);

    fetch(`/api/employees?${params.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setEmployees(data);
        setLoading(false);
      })
      .catch(() => {
        addToast("Erro ao carregar funcionários.", "error");
        setLoading(false);
      });
  }, [filterDepartment, filterStatus, addToast]);

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar este funcionário?")) return;
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        addToast("Funcionário eliminado.", "success");
        setEmployees(employees.filter((e) => e.id !== id));
      } else {
        addToast("Erro ao eliminar.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
  };

  const filtered = employees.filter((e) => {
    const matchesSearch =
      searchTerm === "" ||
      e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDepartment === "" || e.department === filterDepartment;
    const matchesStatus = filterStatus === "" || e.status === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Get unique departments for filter
  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Know You Work</h2>
        </div>
        <Link to="/colaboradores/novo" className="btn btn-primary text-sm">
          <UserPlus size={16} strokeWidth={2} /> Novo Colaborador
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px] relative">
            <Search className="input-icon" size={16} />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="input-with-icon block w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="input text-xs min-w-[120px]"
          >
            <option value="">Todos Departamentos</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input text-xs min-w-[120px]"
          >
            <option value="">Todos Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <UserPlus size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nenhum colaborador encontrado</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm || filterDepartment || filterStatus ? "Tente ajustar os filtros" : "Adicione o primeiro colaborador"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filtered.map((emp: any) => (
              <div
                key={emp.id}
                className="p-4 border border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
                    {emp.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <span className={`badge text-xs ${emp.status === "Ativo" ? "badge-success" : "badge-neutral"}`}>
                    {emp.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-gray-900 mb-1 truncate">{emp.name}</h3>
                <p className="text-xs text-blue-600 font-medium mb-1 truncate">{emp.position || "Sem posição"}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                  <Building2 size={10} />
                  {emp.department || "Sem departamento"}
                </p>

                {emp.email && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-1 truncate">
                    <Mail size={10} />
                    {emp.email}
                  </p>
                )}
                {emp.position && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                    <Phone size={10} />
                    {emp.position}
                  </p>
                )}

                <div className="flex gap-2 mt-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/colaboradores/${emp.id}/avaliacao-360`)}
                    className="flex-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors"
                    title="Avaliação 360°"
                  >
                    Avaliar
                  </button>
                  <button
                    onClick={() => navigate(`/colaboradores/${emp.id}/editar`)}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-xs transition-colors"
                    title="Editar"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs transition-colors"
                    title="Eliminar"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
