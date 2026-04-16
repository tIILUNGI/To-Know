import React, { useState, useEffect } from "react";
import { User, Lock, Save, LayoutDashboard, Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function UserProfile() {
  const { user, login } = useAuth(); // Assuming login or some fn can refresh auth, though reload is easiest
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);

  const [profileData, setProfileData] = useState({ name: "", email: "", username: "", role: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setProfileData({
          name: data.name || "",
          email: data.email || "",
          username: data.username || "",
          role: data.role || "",
        });
        setLoading(false);
      })
      .catch(() => {
        addToast("Erro ao carregar os dados do utilizador", "error");
        setLoading(false);
      });
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: profileData.name, email: profileData.email }),
      });
      if (res.ok) {
        addToast("Perfil atualizado com sucesso. Faça login novamente para atualizar no menu.", "success");
      } else {
        addToast("Erro ao atualizar perfil.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setSavingProfile(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast("As senhas não coincidem.", "warning");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      if (res.ok) {
        addToast("Senha alterada com sucesso.", "success");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await res.json();
        addToast(data.message || "Senha atual incorreta.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setSavingPassword(false);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-500 pb-16">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <User className="text-blue-600" size={20} /> Meu Perfil
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Gerencie suas informações pessoais.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Profile Info Form */}
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" size={16} /> Informações Pessoais
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                {profileData.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{profileData.username}</p>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium uppercase">
                  {profileData.role}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
              >
                {savingProfile ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> : <Save size={14} />}
                Guardar
              </button>
            </div>
          </form>
        </div>

        {/* Password Reset Form */}
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="text-indigo-600" size={16} /> Alterar Senha
          </h3>
          <form onSubmit={handleUpdatePassword} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Senha Atual</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingPassword ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> : <Save size={14} />}
                Atualizar
              </button>
            </div>
          </form>
          
          <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <p className="text-xs text-gray-500">
              Se esquecer a senha, use a recuperação no login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
