import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../context/authStore';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

const getErrorMessage = (err: any, fallback: string): string => {
  const payload = err?.response?.data?.error ?? err?.response?.data;

  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
    if (typeof payload.code === 'string' && payload.code.trim()) {
      return `Error: ${payload.code}`;
    }
  }

  if (typeof err?.message === 'string' && err.message.trim()) {
    return err.message;
  }

  return fallback;
};

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, setUser, setTokens } = useAuthStore();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!USERNAME_REGEX.test(formData.username.trim())) {
      setError('Username can contain only letters, numbers and underscore');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.register({
        username: formData.username.trim(),
        password: formData.password,
      });
      
      // Salva i token nel localStorage PRIMA di chiamare setTokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      console.log('✅ Tokens saved to localStorage');
      
      setTokens(response.data.accessToken, response.data.refreshToken);
      setUser(response.data.user);
      navigate('/');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Registration failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-950 via-gray-950 to-violet-950/10 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="rounded-xl backdrop-blur-sm bg-gray-900/50 border border-violet-500/20 p-8 shadow-lg shadow-violet-500/10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Create Account
            </h1>
            <p className="text-gray-300">Join our community of map creators</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-red-900/20 border border-red-500/50 backdrop-blur-sm p-4 text-red-300 shadow-lg shadow-red-500/10"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <label className="block text-sm font-semibold mb-2 bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                pattern="[A-Za-z0-9_]+"
                className="w-full rounded-lg bg-violet-500/5 border border-violet-500/30 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-violet-400 focus:bg-violet-500/10 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                placeholder="username"
                required
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <label className="block text-sm font-semibold mb-2 bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-lg bg-violet-500/5 border border-violet-500/30 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-violet-400 focus:bg-violet-500/10 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                placeholder="••••••••"
                required
              />
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-semibold mt-6 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/50 hover:shadow-violet-500/70"
            >
              {isLoading ? (
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  ⏳
                </motion.span>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-gray-300"
          >
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent font-semibold hover:from-violet-300 hover:to-purple-300 transition-all"
            >
              Sign in
            </button>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};
