import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (formData.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    
    setLoading(true);
    try {
      await signUp(formData.email, formData.password, formData.name);
      navigate('/dashboard');
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 to-yellow-100 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🕉️</div>
          <h1 className="text-3xl font-bold text-gray-900">Register for Darshan</h1>
          <p className="text-gray-500 mt-1">Create your Ambaji Temple account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><div className="relative"><User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Enter your name" /></div></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="you@example.com" /></div></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="pl-10 pr-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Minimum 6 characters" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">{showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}</button></div></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type={showPassword ? 'text' : 'password'} required value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Confirm password" /></div></div>

          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><UserPlus className="w-5 h-5" /> Create Account</>}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">Already have an account? <Link to="/login" className="text-orange-600 font-semibold">Sign In</Link></p>
      </motion.div>
    </div>
  );
};

export default Register;