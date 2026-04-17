import { Scale, GitFork, ListFilter, Shield, Users, Settings, ArrowRight, ChevronRight } from "lucide-react";
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
          <p className="text-sm text-gray-500 mt-2">Selecione uma área de parametrização</p>
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
             <p className="text-sm text-gray-500 mb-4">Gerir critérios de avaliação, pesos e status de processos/entidades</p>
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
             to="/admin"
             className="group p-6 border border-gray-200 rounded-2xl hover:border-amber-300 hover:bg-amber-50/50 transition-all"
           >
             <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
               <ListFilter size={24} />
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-2">Pesos e Fórmulas</h3>
             <p className="text-sm text-gray-500 mb-4">Configurar pesos dos critérios e fórmulas de cálculo</p>
             <span className="inline-flex items-center text-sm font-medium text-amber-600 group-hover:gap-2 transition-all">
               Acessar <ArrowRight size={16} className="ml-1" />
             </span>
           </Link>

           <Link
             to="/configuracoes/perfis"
             className="group p-6 border border-gray-200 rounded-2xl hover:border-green-300 hover:bg-green-50/50 transition-all"
           >
             <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
               <Shield size={24} />
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-2">Perfis de Utilizador</h3>
             <p className="text-sm text-gray-500 mb-4">Ver papéis e permissões do sistema</p>
             <span className="inline-flex items-center text-sm font-medium text-green-600 group-hover:gap-2 transition-all">
               Acessar <ArrowRight size={16} className="ml-1" />
             </span>
           </Link>

           <Link
             to="/configuracoes/utilizadores"
             className="group p-6 border border-gray-200 rounded-2xl hover:border-red-300 hover:bg-red-50/50 transition-all"
           >
             <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
               <Users size={24} />
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-2">Utilizadores</h3>
             <p className="text-sm text-gray-500 mb-4">Cadastrar e gerenciar utilizadores do sistema</p>
             <span className="inline-flex items-center text-sm font-medium text-red-600 group-hover:gap-2 transition-all">
               Acessar <ArrowRight size={16} className="ml-1" />
             </span>
           </Link>
         </div>

        {/* Current Settings */}
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Configurações Disponíveis</h4>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Critérios de Avaliação</span>
            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Estados de Processo</span>
            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Estados de Entidade</span>
            <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Mais em breve...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
