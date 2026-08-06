import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Mail, Lock, User, X, Chrome } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onComplete?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onComplete }) => {
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) setError(error.message);
        else onComplete?.();
      } else {
        const { error } = await signIn(email, password);
        if (error) setError(error.message);
        else onComplete?.();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-cyan-600 p-6 text-center">
          <button onClick={onClose} className="absolute top-3 right-3 text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
          <div className="text-2xl font-bold text-white mb-1">I O I Education Network</div>
          <p className="text-sm text-white/80">AI-Powered English Learning</p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Log In
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : mode === 'signup' ? 'Create Account' : 'Log In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span>or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            <Chrome className="w-4 h-4" />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};
