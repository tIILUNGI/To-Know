import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Users, Calendar, FileText, BarChart3 } from 'lucide-react';
import { useToast } from "../../context/ToastContext";

interface ClientSatisfactionForm {
  id: number;
  title: string;
  description: string;
  created_at: string;
  created_by: number;
  questions_count: number;
  responses_count: number;
  is_active: boolean;
}

interface FormResponse {
  id: number;
  form_id: number;
  client_name: string;
  client_email: string;
  submitted_at: string;
  answers: Array<{
    question_id: number;
    question_text: string;
    answer_type: 'rating' | 'text' | 'yesno';
    answer_value: string | number | boolean;
  }>;
}

export default function ClientSatisfactionList() {
  const [forms, setForms] = useState<ClientSatisfactionForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<ClientSatisfactionForm | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingResponses, setViewingResponses] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const response = await fetch('/api/client-satisfaction/forms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setForms(data);
      } else {
        addToast('Erro ao carregar formulários', 'error');
      }
    } catch (error) {
      console.error('Error loading forms:', error);
      addToast('Erro ao carregar formulários', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadResponses = async (formId: number) => {
    try {
      const response = await fetch(`/api/client-satisfaction/forms/${formId}/responses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResponses(data);
        setViewingResponses(true);
      } else {
        addToast('Erro ao carregar respostas', 'error');
      }
    } catch (error) {
      console.error('Error loading responses:', error);
      addToast('Erro ao carregar respostas', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderAnswer = (answer: FormResponse['answers'][0]) => {
    switch (answer.answer_type) {
      case 'rating':
        return (
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-lg ${star <= Number(answer.answer_value) ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-600">({answer.answer_value}/5)</span>
          </div>
        );
      case 'yesno':
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            answer.answer_value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {answer.answer_value ? 'Sim' : 'Não'}
          </span>
        );
      case 'text':
      default:
        return <span className="text-gray-700">{String(answer.answer_value)}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (viewingResponses && selectedForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedForm.title}</h2>
            <p className="text-gray-600 mt-1">{selectedForm.description}</p>
          </div>
          <button
            onClick={() => {
              setViewingResponses(false);
              setSelectedForm(null);
              setResponses([]);
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Voltar à lista
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Respostas Recebidas</h3>
              <p className="text-gray-600">{responses.length} resposta{responses.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {responses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma resposta recebida ainda</p>
            </div>
          ) : (
            <div className="space-y-6">
              {responses.map((response) => (
                <div key={response.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{response.client_name}</h4>
                      <p className="text-sm text-gray-600">{response.client_email}</p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(response.submitted_at)}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {response.answers.map((answer, index) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-4">
                        <p className="font-medium text-gray-900 mb-2">{answer.question_text}</p>
                        {renderAnswer(answer)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Formulários de Satisfação</h1>
          <p className="text-gray-600 mt-2">Crie e gerencie formulários de satisfação para enviar aos seus clientes</p>
        </div>
        <Link
          to="/avaliacoes/cliente/satisfacao"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Novo Formulário
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum formulário criado</h3>
          <p className="text-gray-600 mb-6">Comece criando seu primeiro formulário de satisfação para clientes</p>
          <Link
            to="/avaliacoes/cliente/satisfacao"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl inline-flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Criar Primeiro Formulário
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <div key={form.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{form.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{form.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  form.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {form.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText size={16} />
                  <span>{form.questions_count} pergunta{form.questions_count !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} />
                  <span>{form.responses_count} resposta{form.responses_count !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} />
                  <span>{formatDate(form.created_at)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedForm(form);
                    loadResponses(form.id);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  Ver Respostas
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
