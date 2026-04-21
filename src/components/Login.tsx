import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, User, Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const Logo = ({ size = "md", className = "" }: { size?: "sm" | "md" | "lg" | "xl", className?: string }) => {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
    xl: "w-24 h-24"
  };
  return (
    <img 
      src="/Tocomply360.png" 
      alt="TO KNOW" 
      className={`${sizeClasses[size]} object-contain site-logo ${className}`}
    />
  );
};

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const { addToast } = useToast();

  if (user) return <Navigate to='/' />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'login') {
      try {
        const success = await login(username, password);
        if (!success) setError('Credenciais inválidas. Tente novamente.');
      } catch {
        setError('Erro de conexão. Verifique sua rede.');
      }
    } else if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        setLoading(false);
        return;
      }
      setTimeout(() => {
        setLoading(false);
        addToast('Pedido enviado ao administrador para aprovação.', 'info');
        setMode('login');
      }, 1500);
      return;
    } else if (mode === 'forgot') {
      setTimeout(() => {
        setLoading(false);
        addToast('Email de recuperação enviado.', 'success');
        setMode('login');
      }, 1500);
      return;
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0a0f1a] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{backgroundImage: 'radial-gradient(circle at 25% 25%, white 2%, transparent 2%), radial-gradient(circle at 75% 75%, white 2%, transparent 2%)', backgroundSize: '60px 60px'}}></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-8 xl:p-12 text-white">
          <div className="bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-6 sm:mb-8 border border-white/20 p-4">
            <Logo size="xl" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">TO KNOW</h1>
          <p className="text-blue-100 text-base sm:text-lg text-center max-w-md mb-6 sm:mb-8 px-4">
            Plataforma corporativa de Compliance e Gestão de Risco
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm text-blue-200 max-w-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span className="text-sm">Due Diligence</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span className="text-sm">Avaliação KYC/KYS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md lg:max-w-lg">
          <div className="bg-white dark:bg-[#1f2937] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-6">
              <div className="bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 w-14 h-14 p-2">
                <Logo size="md" className="!w-10 !h-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">TO KNOW</h2>
            </div>

            <div className="mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {mode === 'login' ? 'Bem-vindo de volta' : mode === 'register' ? 'Criar Conta' : 'Recuperar Senha'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {mode === 'register' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Nome Completo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" strokeWidth={2} />
                    </div>
                    <input
                      type="text"
                      className="input-with-icon block w-full bg-white dark:bg-[#374151] border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {(mode === 'register' || mode === 'forgot') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" strokeWidth={2} />
                    </div>
                    <input
                      type="email"
                      className="input-with-icon block w-full bg-white dark:bg-[#374151] border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {(mode === 'login' || mode === 'register') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Nome de Usuário</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" strokeWidth={2} />
                    </div>
                    <input
                      type="text"
                      className="input-with-icon block w-full bg-white dark:bg-[#374151] border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="Seu usuário"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {(mode === 'login' || mode === 'register') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Senha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" strokeWidth={2} />
                    </div>
                    <input
                      type="password"
                      className="input-with-icon block w-full bg-white dark:bg-[#374151] border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {mode === 'register' && (
                    <div className="space-y-2 mt-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Confirmar Senha</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" strokeWidth={2} />
                        </div>
                        <input
                          type="password"
                          className="input-with-icon block w-full bg-white dark:bg-[#374151] border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                  {mode === 'login' && (
                    <div className="text-right">
                      <button type="button" onClick={() => setMode('forgot')} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                        Esqueceu a senha?
                      </button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : mode === 'login' ? (
                  <>
                    <LogIn size={20} strokeWidth={2} /> Entrar
                  </>
                ) : mode === 'register' ? (
                  <>
                    <User size={20} strokeWidth={2} /> Solicitar Conta
                  </>
                ) : (
                  <>
                    <KeyRound size={20} strokeWidth={2} /> Recuperar Senha
                  </>
                )}
              </button>
            </form>

            {mode !== 'login' && (
              <div className="mt-5 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                <button onClick={() => setMode('login')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center gap-1 mx-auto">
                  <ArrowLeft size={16} strokeWidth={2} /> Voltar ao login
                </button>
              </div>
            )}

            {mode === 'login' && (
              <div className="mt-5 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Não tem acesso?</p>
                <button onClick={() => setMode('register')} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1">
                  Solicitar criação de conta
                </button>
              </div>
            )}
          </div>
          
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
            © 2026 TO KNOW - Compliance Platform
          </p>
        </div>
      </div>
    </div>
  );
}
