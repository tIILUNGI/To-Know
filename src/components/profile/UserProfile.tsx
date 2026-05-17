import React, { useState, useEffect } from "react";
import { User, Lock, Save, LayoutDashboard, Mail, Camera } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import PageHeader from "../common/PageHeader";

export default function UserProfile() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);

  const [profileData, setProfileData] = useState({ name: "", email: "", username: "", role: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const [avatar, setAvatar] = useState<string | null>(localStorage.getItem("user_avatar"));

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      localStorage.setItem("user_avatar", base64String);
      setAvatar(base64String);
      // Dispatch custom event to notify Layout.tsx header avatar in real-time
      window.dispatchEvent(new Event("avatar_updated"));
      addToast("Foto de perfil atualizada!", "success");
    };
    reader.readAsDataURL(file);
  };

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
      <div className="h-full flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-16">
      <PageHeader title={t("menu.profile")} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-[1.1rem] font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2.5">
            <LayoutDashboard className="text-blue-600 animate-pulse-soft" size={18} /> 
            {t("profile.personal_info")}
          </h3>
          
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            {/* Interactive Avatar Upload Container */}
            <div className="flex flex-col items-center sm:flex-row gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="relative group cursor-pointer w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                {avatar ? (
                  <img src={avatar} className="w-full h-full object-cover animate-fade-in" alt="Profile" />
                ) : (
                  <span className="text-2xl font-bold text-slate-400 dark:text-slate-500">
                    {profileData.name.charAt(0)}
                  </span>
                )}
                {/* Hover Overlay */}
                <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[0.7rem] font-bold transition-opacity duration-200 cursor-pointer">
                  <Camera size={16} className="mb-0.5" />
                  ALTERAR
                </label>
                <input 
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[1.05rem] font-bold text-slate-900 dark:text-slate-200">{profileData.username}</p>
                <span className="px-2.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[0.7rem] font-bold uppercase tracking-wider mt-1.5 inline-block">
                  {profileData.role}
                </span>
                <p className="text-[0.8rem] text-slate-400 dark:text-slate-500 mt-1">Clique no avatar para carregar imagem</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[0.78rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("profile.name")}
              </label>
              <div className="relative">
                <User className="input-icon" size={16} />
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="input-with-icon w-full"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[0.78rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("profile.email")}
              </label>
              <div className="relative">
                <Mail className="input-icon" size={16} />
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="input-with-icon w-full"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="btn btn-primary min-w-[120px]"
              >
                {savingProfile ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Save size={14} />
                )}
                {t("actions.save")}
              </button>
            </div>
          </form>
        </div>

        {/* Password Reset Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-[1.1rem] font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2.5">
            <Lock className="text-indigo-650 animate-pulse-soft" size={18} /> 
            {t("profile.password.title")}
          </h3>
          
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[0.78rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("profile.password.current")}
              </label>
              <div className="relative">
                <Lock className="input-icon" size={16} />
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="input-with-icon w-full"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[0.78rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("profile.password.new")}
              </label>
              <div className="relative">
                <Lock className="input-icon" size={16} />
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder={t("profile.password.new_placeholder")}
                  className="input-with-icon w-full"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[0.78rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("profile.password.confirm")}
              </label>
              <div className="relative">
                <Lock className="input-icon" size={16} />
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="input-with-icon w-full"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="btn btn-primary !bg-indigo-600 hover:!bg-indigo-700 min-w-[120px]"
              >
                {savingPassword ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Save size={14} />
                )}
                {t("actions.save")}
              </button>
            </div>
          </form>
          
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
            <p className="text-[0.85rem] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {t("profile.password.hint")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
