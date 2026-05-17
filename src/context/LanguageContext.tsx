import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "pt" | "en";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Menu/Navigation
    "menu.dashboard": "Dashboard",
    "menu.suppliers": "Fornecedores",
    "menu.clients": "Clientes",
    "menu.employees": "Colaboradores",
    "menu.processes": "Processos",
    "menu.evaluations": "Avaliações",
    "menu.legal": "Documentação Legal",
    "menu.reports": "Relatórios",
    "menu.alerts": "Alertas",
    "menu.settings": "Configurações",
    "menu.logout": "Terminar Sessão",
    "menu.profile": "Meu Perfil",
    "menu.darkMode": "Modo Escuro",
    "menu.lightMode": "Modo Claro",

    // General Actions
    "actions.add": "Adicionar",
    "actions.edit": "Editar",
    "actions.delete": "Eliminar",
    "actions.save": "Guardar",
    "actions.cancel": "Cancelar",
    "actions.search": "Pesquisar...",
    "actions.loading": "A carregar...",

    // Legal Documents
    "legal.title": "Documentação Legal",
    "legal.add": "Adicionar Documento",
    "legal.total": "Total de Documentos",
    "legal.active": "Documentos Ativos",
    "legal.expiring": "A Expirar em Breve",
    "legal.expired": "Documentos Expirados",
    "legal.archive": "Arquivo Corporativo",
    "legal.subtitle": "Consulte, controle caducidades e faça a gestão dos seus documentos legais.",
    "legal.table.doc": "Documento",
    "legal.table.type": "Tipo",
    "legal.table.version": "Versão / Série",
    "legal.table.launch": "Lançamento",
    "legal.table.expiration_year": "Caducidade (Ano)",
    "legal.table.expiration_date": "Data Limite",
    "legal.table.status": "Estado",
    "legal.table.actions": "Ações",
    "legal.status.valid": "Válido",
    "legal.status.expiring": "Expira em Breve",
    "legal.status.expired": "Expirado",

    // Evaluations
    "eval.title": "Processos de Avaliações",
    "eval.quick_actions": "Ações Rápidas de Avaliação",
    "eval.action.perf_client": "Desempenho (Cliente)",
    "eval.action.perf_supplier": "Desempenho (Fornecedor)",
    "eval.action.reval": "Reavaliação",
    "eval.action.satisf_client": "Satisfação (Cliente)",
    "eval.action.satisf_360": "360° (Colaborador)",

    // User Profile
    "profile.personal_info": "Informações Pessoais",
    "profile.name": "Nome Completo",
    "profile.email": "Email",
    "profile.password.title": "Alterar Senha",
    "profile.password.current": "Senha Atual",
    "profile.password.new": "Nova Senha",
    "profile.password.new_placeholder": "Mínimo 6 caracteres",
    "profile.password.confirm": "Confirmar Senha",
    "profile.password.hint": "Se esquecer a senha, use a recuperação no login."
  },
  en: {
    // Menu/Navigation
    "menu.dashboard": "Dashboard",
    "menu.suppliers": "Suppliers",
    "menu.clients": "Clients",
    "menu.employees": "Employees",
    "menu.processes": "Processes",
    "menu.evaluations": "Evaluations",
    "menu.legal": "Legal Documentation",
    "menu.reports": "Reports",
    "menu.alerts": "Alerts",
    "menu.settings": "Settings",
    "menu.logout": "Logout",
    "menu.profile": "My Profile",
    "menu.darkMode": "Dark Mode",
    "menu.lightMode": "Light Mode",

    // General Actions
    "actions.add": "Add",
    "actions.edit": "Edit",
    "actions.delete": "Delete",
    "actions.save": "Save",
    "actions.cancel": "Cancel",
    "actions.search": "Search...",
    "actions.loading": "Loading...",

    // Legal Documents
    "legal.title": "Legal Documentation",
    "legal.add": "Add Document",
    "legal.total": "Total Documents",
    "legal.active": "Active Documents",
    "legal.expiring": "Expiring Soon",
    "legal.expired": "Expired Documents",
    "legal.archive": "Corporate Archive",
    "legal.subtitle": "Consult, track expirations and manage your legal documents.",
    "legal.table.doc": "Document",
    "legal.table.type": "Type",
    "legal.table.version": "Version / Series",
    "legal.table.launch": "Launch",
    "legal.table.expiration_year": "Expiration (Year)",
    "legal.table.expiration_date": "Due Date",
    "legal.table.status": "Status",
    "legal.table.actions": "Actions",
    "legal.status.valid": "Valid",
    "legal.status.expiring": "Expiring Soon",
    "legal.status.expired": "Expired",

    // Evaluations
    "eval.title": "Evaluation Processes",
    "eval.quick_actions": "Quick Evaluation Actions",
    "eval.action.perf_client": "Performance (Client)",
    "eval.action.perf_supplier": "Performance (Supplier)",
    "eval.action.reval": "Re-evaluation",
    "eval.action.satisf_client": "Satisfaction (Client)",
    "eval.action.satisf_360": "360° (Employee)",

    // User Profile
    "profile.personal_info": "Personal Information",
    "profile.name": "Full Name",
    "profile.email": "Email",
    "profile.password.title": "Change Password",
    "profile.password.current": "Current Password",
    "profile.password.new": "New Password",
    "profile.password.new_placeholder": "Minimum 6 characters",
    "profile.password.confirm": "Confirm Password",
    "profile.password.hint": "If you forget your password, use the recovery option at login."
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved === "en" || saved === "pt") ? saved : "pt";
  });

  const toggleLanguage = () => {
    const next = language === "pt" ? "en" : "pt";
    setLanguage(next);
    localStorage.setItem("language", next);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations["pt"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
