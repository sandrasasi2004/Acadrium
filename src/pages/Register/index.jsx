import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../../components/common/UserContext';
import heroImg from '../../assets/login_hero.svg';
import logo from '../../assets/logo.svg';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { register } = useUser();
  const navigate = useNavigate();
  const [role, setRole] = useState('student'); // 'student' or 'faculty'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    register(role, username, email);
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50 p-4 md:p-8 font-sans">
      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-2">
        
        {/* Left Side: Branding and Illustration */}
        <div className="hidden flex-col items-center justify-center text-center lg:flex">
          <img 
            src={heroImg} 
            alt="Acadrium Academic Companion" 
            className="w-full max-w-md object-contain animate-pulse-slow"
            style={{ animationDuration: '6s' }}
          />
          <h2 className="mt-6 max-w-md text-base font-medium leading-relaxed text-slate-600">
            AI-Powered Academic Memory and Document Management System for Contextual Information Retrieval
          </h2>
        </div>

        {/* Right Side: Registration Card */}
        <div className="flex justify-center">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <img src={logo} alt="Acadrium Logo" className="h-14 w-auto object-contain" />
            </div>

            {/* Role Select Pills (From Screenshot 2) */}
            <div className="mb-6 flex justify-center">
              <div className="flex rounded-full bg-slate-100 p-1 border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setRole('faculty')}
                  className={`cursor-pointer rounded-full px-6 py-1.5 text-xs font-bold transition-all ${
                    role === 'faculty'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  FACULTY
                </button>
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`cursor-pointer rounded-full px-6 py-1.5 text-xs font-bold transition-all ${
                    role === 'student'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  STUDENT
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-600 border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Username :
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-11 pr-4 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Email :
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-11 pr-4 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Password :
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-11 pr-11 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Confirm Password :
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-11 pr-11 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* SIGN UP BUTTON */}
              <button
                type="submit"
                className="cursor-pointer mt-4 w-full rounded-full bg-indigo-600 py-3 text-sm font-bold text-white uppercase tracking-wider shadow-lg hover:bg-indigo-700 active:scale-98 transition-all hover:shadow-indigo-200 hover:shadow-md"
              >
                Sign Up
              </button>
            </form>

            {/* LOGIN TOGGLE */}
            <div className="mt-6 border-t border-slate-100 pt-4 text-center">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Go to Login Page
              </p>
              <Link
                to="/login"
                className="cursor-pointer inline-block rounded-full border-2 border-indigo-600 px-8 py-2 text-xs font-bold text-indigo-700 uppercase tracking-wider hover:bg-indigo-50 transition-all"
              >
                Login
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
