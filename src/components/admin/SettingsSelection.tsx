import { Scale, GitFork, Settings, ArrowRight, Users, Bell, Database } from "lucide-react";
import { Link } from "react-router-dom";

export default function SettingsSelection() {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 mb-4">
            <Settings size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
        </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/admin"
              className="group p-6 border border-gray-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Scale size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Critérios e Estados</h3>
              <p className="text-sm text-gray-500 mb-4">Gerir critérios de avaliação e status de processos/entidades</p>
              <span className="inline-flex items-center text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                Acessar <ArrowRight size={16} className="ml-1" />
              </span>
            </Link>

            <Link
              to="/configuracoes/tipos-processo"
              className="group p-6 border border-gray-200 rounded-2xl hover:border-purple-300 hover:bg-purple-50/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <GitFork size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Tipos de Processo</h3>
              <p className="text-sm text-gray-500 mb-4">Definir tipos de processos e fluxos de aprovação</p>
              <span className="inline-flex items-center text-sm font-medium text-purple-600 group-hover:gap-2 transition-all">
                Acessar <ArrowRight size={16} className="ml-1" />
              </span>
            </Link>

            <Link
              to="/configuracoes/utilizadores"
              className="group p-6 border border-gray-200 rounded-2xl hover:border-green-300 hover:bg-green-50/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Gestão de Utilizadores</h3>
              <p className="text-sm text-gray-500 mb-4">Gerir contas, acessos e permissões de utilizadores</p>
              <span className="inline-flex items-center text-sm font-medium text-green-600 group-hover:gap-2 transition-all">
                Acessar <ArrowRight size={16} className="ml-1" />
              </span>
            </Link>

            <Link
              to="/alertas"
              className="group p-6 border border-gray-200 rounded-2xl hover:border-amber-300 hover:bg-amber-50/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
                <Bell size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Alertas</h3>
              <p className="text-sm text-gray-500 mb-4">Monitorizar alertas do sistema e notificações</p>
              <span className="inline-flex items-center text-sm font-medium text-amber-600 group-hover:gap-2 transition-all">
                Acessar <ArrowRight size={16} className="ml-1" />
              </span>
            </Link>

            <Link
              to="/demo/criar"
              className="group p-6 border border-gray-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Database size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Dados Demo</h3>
              <p className="text-sm text-gray-500 mb-4">Criar dados de teste para demonstração</p>
              <span className="inline-flex items-center text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                Criar <ArrowRight size={16} className="ml-1" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
}
