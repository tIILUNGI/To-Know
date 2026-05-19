import React, { useState } from 'react';
import { X, Check, Edit3 } from 'lucide-react';

interface Question {
  id: number;
  name: string;
  weight: number;
  max_score: number;
  score?: number;
  observation?: string;
}

interface FormPreviewModalProps {
  questions: Question[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSubmit: () => void;
  totalPercentage: number;
  classification: string;
}

export default function FormPreviewModal({
  questions,
  isOpen,
  onClose,
  onEdit,
  onSubmit,
  totalPercentage,
  classification
}: FormPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-3xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Revisar Respostas</h2>
                <p className="text-sm text-gray-500">Confirme antes de enviar</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-blue-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm font-medium text-gray-600  tracking-wide">Pontuação Final</p>
              <p className="text-3xl font-bold text-emerald-700">{totalPercentage.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600  tracking-wide">Classificação</p>
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                classification === 'Excelente' ? 'bg-emerald-100 text-emerald-800' :
                classification === 'Bom' ? 'bg-blue-100 text-blue-800' :
                classification === 'Satisfatório' ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              }`}>
                {classification}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600  tracking-wide">Perguntas Respondidas</p>
              <p className="text-2xl font-bold text-gray-900">
                {questions.filter(q => q.score && q.score > 0).length}/{questions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {questions.map((question) => (
            <div key={question.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl group hover:bg-white transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{question.name}</h4>
                  <p className="text-xs text-gray-500">Peso: {question.weight}% | Máx: {question.max_score}</p>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    question.score === question.max_score ? 'bg-emerald-100 text-emerald-800' :
                    question.score && question.score >= (question.max_score * 0.7) ? 'bg-blue-100 text-blue-800' :
                    question.score ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {question.score || 0}/{question.max_score}
                  </span>
                </div>
              </div>
              {question.observation && (
                <p className="text-sm text-gray-700 mt-2 italic bg-white p-3 rounded-lg border-l-4 border-blue-300">
                  "{question.observation}"
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 rounded-b-3xl flex flex-col sm:flex-row gap-3 pt-0">
          <button
            onClick={onEdit}
            className="flex-1 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <Edit3 size={18} />
            Editar Respostas
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Confirmar e Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

