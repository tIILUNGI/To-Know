import { Shield, CheckCircle, AlertCircle, Users } from "lucide-react";

export default function RolesInfo() {
  const roles = [
    {
      name: "Administrator",
      icon: Shield,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Acesso total ao sistema, incluindo configurações e gestão de utilizadores.",
      permissions: [
        "Gerir todas as entidades (fornecedores e clientes)",
        "Aprovar ou rejeitar processos",
        "Configurar critérios e estados do sistema",
        "Criar, editar e eliminar utilizadores",
        "Acesso a todos os relatórios e dashboards",
        "Configurar parâmetros do sistema"
      ]
    },
    {
      name: "Compliance Manager",
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Gestor de compliance com poderes de aprovação e supervisão.",
      permissions: [
        "Aprovar ou rejeitar processos de due diligence",
        "Reavaliar fornecedores e clientes",
        "Visualizar todos os relatórios",
        "Gerir documentos e evidências",
        "Emitir decisões e comunicar resultados",
        "Não pode criar/eliminar utilizadores"
      ]
    },
    {
      name: "Analyst",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "Utilizador padrão com acesso às operações básicas.",
      permissions: [
        "Cadastrar e editar fornecedores e clientes",
        "Iniciar processos de aprovação e avaliação",
        "Preencher formulários de avaliação",
        "Submeter processos para análise",
        "Visualizar próprio histórico e dashboards",
        "Não pode aprovar processos nem configurar sistema"
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Perfis de Utilizador</h2>
        <p className="text-sm text-gray-500 mt-1">
          Conheça os papéis disponíveis no sistema e suas permissões.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${role.bgColor} flex items-center justify-center`}>
                <role.icon size={22} className={role.color} />
              </div>
              <h3 className="text-base font-bold text-gray-900">{role.name}</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">{role.description}</p>
            <div className="space-y-1">
              {role.permissions.map((perm, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                  <CheckCircle size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Informação Importante</h4>
            <p className="text-xs text-blue-800">
              Os papéis são atribuídos no momento da criação do utilizador e podem ser alterados posteriormente por um Administrador.
              As permissões são aplicadas automaticamente com base no papel, garantindo a segurança e separação de funções no sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
