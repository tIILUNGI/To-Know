import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, FileText, CheckCircle, AlertCircle, Upload, User, Calendar } from "lucide-react";

export default function EntityHistory() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/entities/${id}/history`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500">Carregando histórico...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Erro ao carregar histórico.</p>
      </div>
    );
  }

  const { entity, audit_history, processes, evaluations, documents } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/entities/${id}`} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Histórico Completo</h1>
          <p className="text-sm text-gray-500">{entity.name}</p>
        </div>
      </div>

      {/* Cadastro Atual */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-blue-600" />
          Dados Cadastrais Atuais
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <span className="text-gray-500 text-xs uppercase">Denominação Social</span>
            <p className="font-semibold text-gray-900">{entity.name}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase">Estado</span>
            <span className={`badge mt-1 ${entity.status === "Ativo" ? "badge-success" : entity.status === "Bloqueado" || entity.status === "Desqualificado" ? "badge-danger" : entity.status === "Em revisão" || entity.status === "Em observação" ? "badge-warning" : "badge-neutral"}`}>
              {entity.status}
            </span>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase">Relacionamento</span>
            <span className={`badge mt-1 ${entity.relationship_status === "Homologado" || entity.relationship_status === "Elegível" ? "badge-success" : entity.relationship_status === "Restrito" || entity.relationship_status === "Suspenso" ? "badge-warning" : entity.relationship_status === "Desqualificado" ? "badge-danger" : "badge-neutral"}`}>
              {entity.relationship_status}
            </span>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase">Risco Final</span>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${entity.final_risk_rating === "Alto" ? "bg-red-500" : entity.final_risk_rating === "Médio" ? "bg-amber-500" : "bg-green-500"}`}></div>
              <span className="text-sm font-semibold">{entity.final_risk_rating || "Pendente"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock size={20} className="text-green-600" />
            Audit Trail ({audit_history?.length || 0} eventos)
          </h2>
        </div>
        <div className="p-4 space-y-4">
          {audit_history && audit_history.length > 0 ? (
            audit_history.map((item) => (
              <div key={item.id} className="flex gap-4 items-start border-l-2 border-green-100 pl-4 pb-4 relative">
                <div className="absolute w-3 h-3 bg-green-600 rounded-full -left-[7px] top-0 border-2 border-white"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-gray-900 uppercase">{item.action}</span>
                    <span className="text-[10px] text-gray-400">{new Date(item.timestamp).toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="text-sm text-gray-600">{item.details}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                      {item.user_name?.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-gray-500">{item.user_name}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 italic">Nenhum registro de auditoria.</p>
          )}
        </div>
      </div>

      {/* Processos */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle size={20} className="text-blue-600" />
            Processos ({processes?.length || 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-4 py-2.5">Processo</th>
                <th className="px-4 py-2.5 hidden md:table-cell">Tipo</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 hidden lg:table-cell">Aberto por</th>
                <th className="px-4 py-2.5 hidden lg:table-cell">Aprovador</th>
                <th className="px-4 py-2.5">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {processes && processes.length > 0 ? (
                processes.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <Link to={`/processos/${p.id}`} className="text-sm font-semibold text-blue-600 hover:underline">
                        {p.code || `#${p.id.toString().slice(-6)}`}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 hidden md:table-cell">{p.process_type}</td>
                    <td className="px-4 py-2.5">
                      <span className={`badge text-xs ${p.status === "Aprovado" ? "badge-success" : p.status === "Reprovado" ? "badge-danger" : p.status === "Pendente" ? "bg-amber-100 text-amber-800" : p.status === "Aprovado com restrições" ? "bg-orange-100 text-orange-800" : "badge-neutral"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 hidden lg:table-cell">{p.opener_name}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 hidden lg:table-cell">{p.approver_name || "-"}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-sm">Nenhum processo encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Avaliações */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle size={20} className="text-purple-600" />
            Avaliações e Reavaliações ({evaluations?.length || 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-4 py-2.5">Tipo</th>
                <th className="px-4 py-2.5 hidden md:table-cell">Período</th>
                <th className="px-4 py-2.5">Score</th>
                <th className="px-4 py-2.5">Classificação</th>
                <th className="px-4 py-2.5 hidden lg:table-cell">Avaliador</th>
                <th className="px-4 py-2.5">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {evaluations && evaluations.length > 0 ? (
                evaluations.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-sm font-semibold text-gray-900">{e.type}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 hidden md:table-cell">{e.period || "-"}</td>
                    <td className="px-4 py-2.5 text-sm font-bold text-gray-900">{Math.round(e.percentage)}%</td>
                    <td className="px-4 py-2.5">
                      <span className={`badge text-xs ${e.classification === "Excellent" || e.classification === "Good" ? "badge-success" : e.classification === "Fair" ? "badge-warning" : "badge-danger"}`}>
                        {e.classification}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 hidden lg:table-cell">{e.evaluator_name}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{new Date(e.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-sm">Nenhuma avaliação registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documentos */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Upload size={20} className="text-orange-600" />
            Documentos ({documents?.length || 0})
          </h2>
        </div>
        <div className="p-4">
          {documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition-all flex items-center gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Calendar size={10} /> {new Date(doc.upload_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Upload size={16} />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400">
              <Upload size={32} strokeWidth={1.5} />
              <p className="mt-3 font-medium">Nenhum documento anexado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
