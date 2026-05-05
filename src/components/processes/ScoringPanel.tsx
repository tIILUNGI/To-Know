import { useState, useEffect } from 'react';
import { Scale, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Criterion {
  id: number;
  name: string;
  description: string;
  weight: number;
  max_score: number;
  score: number;
  evidence: string;
  comments: string;
}

interface ScoringPanelProps {
  processId: number;
  criteria: Criterion[];
  onScoresChange: (scores: any[]) => void;
  onAutoTransition?: () => void;
}

export default function ScoringPanel({ processId, criteria, onScoresChange, onAutoTransition }: ScoringPanelProps) {
  const { addToast } = useToast();
  const [localCriteria, setLocalCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalCriteria(criteria.map(c => ({ ...c, score: 0, evidence: '', comments: '' })));
  }, [criteria]);

  const handleScoreChange = (criterionId: number, field: string, value: string | number) => {
    setLocalCriteria(prev => prev.map(c => 
      c.id === criterionId 
        ? { ...c, [field]: field === 'score' ? Number(value) : String(value) }
        : c
    ));
  };

  const calculateTotal = () => {
    let totalWeighted = 0;
    let totalWeight = 0;
    localCriteria.forEach(c => {
      totalWeight += c.weight;
      totalWeighted += (c.score / c.max_score) * c.weight;
    });
    return totalWeight > 0 ? (totalWeighted / totalWeight) * 100 : 0;
  };

  const saveScores = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/processes/${processId}/score`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scores: localCriteria })
      });

      if (res.ok) {
        const data = await res.json();
        onScoresChange(localCriteria);
        addToast('Pontuações salvas!', 'success');
        
        // Auto-transition if score >= 80%
        const percentage = calculateTotal();
        if (percentage >= 80 && onAutoTransition) {
          onAutoTransition();
        }
      } else {
        addToast('Erro ao salvar pontuações.', 'error');
      }
    } catch {
      addToast('Erro de conexão.', 'error');
    }
    setLoading(false);
  };

  const percentage = calculateTotal();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Scale size={20} />
          Avaliação dos Critérios
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-600">{percentage.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Score Final</p>
          </div>
          <button
            onClick={saveScores}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg"
          >
            <TrendingUp size={16} />
            {loading ? 'Salvando...' : 'Salvar Pontuações'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] bg-white rounded-2xl shadow-sm border border-gray-200">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Critério</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Descrição</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-20">Peso</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Pontuação</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-32">Evidência</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Comentários</th>
            </tr>
          </thead>
          <tbody>
            {localCriteria.map((criterion) => {
              const weightedScore = (criterion.score / criterion.max_score) * criterion.weight;
              return (
                <tr key={criterion.id} className="border-b border-gray-50 hover:bg-gray-50 last:border-b-0">
                  <td className="px-6 py-4">
                    <div>
                      <span className="text-sm font-bold text-gray-900">{criterion.name}</span>
                      <p className="text-xs text-gray-500 mt-1">{criterion.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-gray-600">{criterion.weight}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <input
                        type="range"
                        min="0"
                        max={criterion.max_score}
                        value={criterion.score}
                        onChange={(e) => handleScoreChange(criterion.id, 'score', e.target.value)}
                        className="w-20 h-2 bg-gray-200 rounded-lg cursor-pointer accent-blue-600 hover:accent-blue-500"
                      />
                      <span className="text-xs font-bold text-gray-900 mt-1">{criterion.score}/{criterion.max_score}</span>
                      <span className="text-[10px] text-gray-400">{weightedScore.toFixed(1)} pts</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={criterion.evidence}
                      onChange={(e) => handleScoreChange(criterion.id, 'evidence', e.target.value)}
                      placeholder="Upload/link evidência"
                      className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <textarea
                      value={criterion.comments}
                      onChange={(e) => handleScoreChange(criterion.id, 'comments', e.target.value)}
                      placeholder="Comentários..."
                      rows={2}
                      className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Auto-transition suggestion */}
      {percentage >= 80 && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-emerald-800 text-sm">Pronto para aprovação automática!</p>
              <p className="text-emerald-700 text-xs mt-1">
                Score ≥ 80% - Clique "Avançar para Aprovação" para auto-transition
              </p>
            </div>
          </div>
        </div>
      )}

      {percentage < 60 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-800 text-sm">Score crítico detectado</p>
              <p className="text-red-700 text-xs mt-1">
                Score < 60% - Revisar critérios antes de avançar
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

