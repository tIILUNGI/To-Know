import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, UserPlus, Key, Mail, Shield } from "lucide-react";
import { useToast } from "../../context/ToastContext";

export default function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditing);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    role: "Analyst",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (isEditing) {
      fetch(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          setFormData({
            username: data.username,
            name: data.name,
            email: data.email || "",
            role: data.role,
            password: "",
            confirmPassword: ""
          });
          setFetchLoading(false);
        })
        .catch(() => {
          addToast("Erro ao carregar utilizador.", "error");
          setFetchLoading(false);
        });
    }
  }, [id, isEditing, addToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) newErrors.username = "Username é obrigatório";
    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!formData.role) newErrors.role = "Papel é obrigatório";

    if (!isEditing) {
      if (!formData.password.trim()) newErrors.password = "Senha é obrigatória";
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Senhas não coincidem";
      }
    } else {
      if (formData.password && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Senhas não coincidem";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast("Corrija os erros no formulário.", "error");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        username: formData.username,
        name: formData.name,
        email: formData.email || null,
        role: formData.role
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const url = isEditing ? `/api/users/${id}` : "/api/users";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addToast(isEditing ? "Utilizador actualizado com sucesso!" : "Utilizador criado com sucesso!", "success");
        navigate("/configuracoes/utilizadores");
      } else {
        const err = await res.json();
        addToast(err.message || "Erro ao salvar utilizador.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }

    setLoading(false);
  };

  if (fetchLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/configuracoes/utilizadores")} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
           <div>
             <h2 className="text-2xl font-bold text-gray-900">
               {isEditing ? "Editar Utilizador" : "Novo Utilizador"}
             </h2>
           </div>
        </div>
        <button
          type="submit"
          form="user-form"
          disabled={loading}
          className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-purple-700 active:scale-95 transition-all shadow-xl shadow-purple-200 disabled:opacity-50"
        >
          <Save size={20} /> {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <form id="user-form" onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="ex: jose.silva"
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all ${errors.username ? 'border-red-500' : 'border-gray-200'}`}
            />
            {errors.username && <p className="text-xs text-red-600">{errors.username}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome Completo *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="José da Silva"
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jose@empresa.co.ao"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Papel *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all ${errors.role ? 'border-red-500' : 'border-gray-200'}`}
            >
              <option value="Analyst">Analyst</option>
              <option value="Compliance Manager">Compliance Manager</option>
              <option value="Administrator">Administrator</option>
            </select>
            {errors.role && <p className="text-xs text-red-600">{errors.role}</p>}
          </div>

          {!isEditing && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Senha *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Senha segura"
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all ${errors.password ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirmar Senha *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repita a senha"
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword}</p>}
              </div>
            </>
          )}

          {isEditing && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nova Senha (opcional)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Deixe em branco para manter a actual"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
              <p className="text-xs text-gray-500">Preencha apenas se desejar alterar a senha.</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <p className="text-sm text-amber-800">
            <strong>Nota:</strong> O papel do utilizador define suas permissões no sistema. 
            Administradores têm acesso total, Compliance Managers podem aprovar processos e gerir critérios, e Analysts têm acesso apenas às funcionalidades básicas.
          </p>
        </div>
      </form>
    </div>
  );
}
