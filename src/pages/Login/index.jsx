import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../../components/common/UserContext';
import heroImg from '../../assets/login_hero.svg';
import logo from '../../assets/logo.svg';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useUser();
  const navigate = useNavigate();
  const [role, setRole] = useState('student'); // 'student' or 'faculty'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    setError('');
    login(role, username);
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

        {/* Right Side: Login Card */}
        <div className="flex justify-center">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <img src={logo} alt="Acadrium Logo" className="h-14 w-auto object-contain" />
            </div>

            <h3 className="mb-6 text-center text-xl font-black tracking-tight text-slate-800 uppercase">
              Login to Your Account
            </h3>

            {error && (
              <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-600 border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection */}
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Select User Role
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`cursor-pointer flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                      role === 'student'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('faculty')}
                    className={`cursor-pointer flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                      role === 'faculty'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Faculty
                  </button>
                </div>
              </div>

              {/* Username Input */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Username :
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Password :
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-11 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                className="cursor-pointer mt-2 w-full rounded-full bg-indigo-600 py-3 text-sm font-bold text-white uppercase tracking-wider shadow-lg hover:bg-indigo-700 active:scale-98 transition-all hover:shadow-indigo-200 hover:shadow-md"
              >
                Login
              </button>
            </form>

            {/* REGISTER TOGGLE */}
            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <p className="text-xs font-medium text-slate-500">
                Don’t have an account? <br />
                <span className="block mt-2">Sign Up now</span>
              </p>
              <Link
                to="/register"
                className="cursor-pointer mt-3 inline-block rounded-full border-2 border-indigo-600 px-8 py-2 text-xs font-bold text-indigo-700 uppercase tracking-wider hover:bg-indigo-50 transition-all"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
