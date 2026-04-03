import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 to-yellow-100 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🕉️</div>
          <h1 className="text-3xl font-bold text-gray-900">Ambaji Temple</h1>
          <p className="text-gray-500 mt-1">Sign in for Divine Darshan</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="you@example.com" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><LogIn className="w-5 h-5" /> Sign In</>}
          </button>
        </form>

        <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div><div className="relative flex justify-center"><span className="px-2 bg-white text-gray-500">Or</span></div></div>

        <button onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-2 py-2 border rounded-lg hover:bg-gray-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google
        </button>

        <p className="text-center text-sm text-gray-600 mt-6">Don't have an account? <Link to="/register" className="text-orange-600 font-semibold">Register</Link></p>
        <p className="text-center text-xs text-gray-400 mt-4">Admin: admin@ambaji.com / admin123</p>
      </motion.div>
    </div>
  );
};

export default Login;