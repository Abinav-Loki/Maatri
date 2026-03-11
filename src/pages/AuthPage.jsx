import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowLeft, HeartPulse, CheckCircle2, XCircle, User, Phone, Calendar, Home, Users as UsersIcon, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/maatri_shield_logo.png';
import storage from '../utils/storage';

const AuthPage = () => {
    const { role } = useParams();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);

    // Registration States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [mobile, setMobile] = useState('');

    // Role-specific States
    const [pregnancyType, setPregnancyType] = useState('first'); // patient
    const [address, setAddress] = useState(''); // patient & doctor
    const [hospitalName, setHospitalName] = useState(''); // doctor
    const [relationship, setRelationship] = useState('husband'); // guardian

    const [emailError, setEmailError] = useState('');
    const [authError, setAuthError] = useState('');

    const validateEmail = (val) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!val) return "Email is required";
        if (!regex.test(val)) return "Please enter a valid email address";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');

        const err = validateEmail(email);
        if (err) {
            setEmailError(err);
            return;
        }

        try {
            if (isLogin) {
                // verifyUser throws on auth failure, returns profile on success
                const user = await storage.verifyUser(email, password);
                if (user.role !== role) {
                    setAuthError(`This account is registered as a ${user.role}. Please use the correct portal.`);
                    return;
                }
                localStorage.setItem('currentUser', JSON.stringify(user));
                navigate(`/dashboard/${role}`);
            } else {
                // Collect extra info
                const profileInfo = {
                    name,
                    age,
                    mobile,
                    ...(role === 'patient' && { pregnancyType, address }),
                    ...(role === 'doctor' && { hospitalName, address }),
                    ...(role === 'guardian' && { relationship }),
                };

                // saveUser signs up + inserts profile; returns the new profile directly
                const newUser = await storage.saveUser({ email, password, role, ...profileInfo });

                if (newUser) {
                    localStorage.setItem('currentUser', JSON.stringify(newUser));
                    navigate(`/dashboard/${role}`);
                } else {
                    // Email confirmation may be required — show a friendly message
                    setAuthError('Account created! Please check your email to confirm your account, then log in.');
                }
            }
        } catch (error) {
            setAuthError(error.message);
        }
    };

    const handleEmailChange = (e) => {
        const val = e.target.value;
        setEmail(val);
        setAuthError('');
        if (emailError) setEmailError(validateEmail(val));
    };

    const roleColors = {
        patient: 'brand',
        doctor: 'blue',
        guardian: 'accent'
    };

    // Fix unused variable
    roleColors[role] || 'brand';

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white relative overflow-hidden">
            {/* Left side: Hero (Harmonized with Dashboard Sidebar) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[linear-gradient(to_bottom,#6A4C93,#7C5BB3,#8E6BBF)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />

                <div className="relative p-16 pt-32 flex flex-col justify-between h-full text-white w-full">
                    <div>
                        <div className="flex flex-row items-center justify-center lg:justify-start gap-4 mb-8 text-center lg:text-left">
                            <img src={logo} alt="Maatri Shield" className="w-32 h-32 md:w-36 md:h-36 object-contain mix-blend-screen shrink-0 filter brightness-125 contrast-125" />
                            <span className="font-black text-2xl uppercase tracking-[0.2em] text-white/90 drop-shadow-2xl">Maatri Shield</span>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-center lg:text-left"
                        >
                            <h1 className="text-6xl font-black tracking-tight leading-[1.1] mb-6 text-white">
                                Precision <span className="text-white/80">Care.</span>
                            </h1>
                            <p className="text-xl text-white/60 max-w-md leading-relaxed font-medium mx-auto lg:mx-0">
                                Empowering clinicians and mothers with 2026 AI-driven clinical intelligence for a safer Maatri journey.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Right side: Login Area */}
            <div className="w-full lg:w-1/2 flex items-start justify-center p-6 md:p-12 pt-12 md:pt-16 relative overflow-y-auto bg-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.03)_0%,transparent_50%)]" />
                <Link
                    to="/"
                    className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-slate-400 hover:text-brand-600 transition-all font-bold group z-20 text-xs md:text-sm"
                >
                    <ArrowLeft size={16} className="md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                    Back to portals
                </Link>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        boxShadow: '20px 20px 60px #d1d1d1, -20px -20px 60px #ffffff, inset 0 1px 1px rgba(255,255,255,1)',
                        background: '#F8F7FF'
                    }}
                    className="w-full max-w-md rounded-[2rem] md:rounded-[2.5rem] overflow-hidden relative p-6 md:p-10 border-2 border-brand-200"
                >
                    <div className="text-center mb-10">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-white rounded-3xl shadow-xl shadow-brand-500/10 mb-4 inline-block border border-brand-50">
                                <UsersIcon size={32} className="text-brand-600" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 capitalize mb-2">
                            {role} {isLogin ? 'Login' : 'Register'}
                        </h2>
                        <p className="text-slate-700 font-bold tracking-tight">
                            {isLogin ? `Access the high-precision ${role} monitoring system.` : `Create your ${role} account to get started.`}
                        </p>
                    </div>

                    <div className="flex p-1.5 bg-slate-900/5 rounded-2xl mb-10 border border-white/20">
                        <button
                            onClick={() => { setIsLogin(true); setAuthError(''); setEmail(''); setPassword(''); }}
                            className={`flex-1 py-3.5 rounded-xl font-extrabold transition-all duration-300 ${isLogin ? 'bg-white shadow-xl text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => { setIsLogin(false); setAuthError(''); setEmail(''); setPassword(''); }}
                            className={`flex-1 py-3.5 rounded-xl font-extrabold transition-all duration-300 ${!isLogin ? 'bg-white shadow-xl text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Join
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence>
                            {authError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-600 text-sm flex items-center gap-3 font-bold mb-6"
                                >
                                    <XCircle size={20} />
                                    {authError}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-6 mb-6"
                            >
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest mb-2 px-2">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Sarah Johnson"
                                            className="w-full bg-white/60 border border-white/50 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-slate-300 font-bold"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required={!isLogin}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest mb-2 px-2">Age</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="number"
                                                placeholder="28"
                                                className="w-full bg-white/60 border border-white/50 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-slate-300 font-bold"
                                                value={age}
                                                onChange={(e) => setAge(e.target.value)}
                                                required={!isLogin}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest mb-2 px-2">Mobile</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="tel"
                                                placeholder="9876543210"
                                                className="w-full bg-white/60 border border-white/50 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-slate-300 font-bold"
                                                value={mobile}
                                                onChange={(e) => setMobile(e.target.value)}
                                                required={!isLogin}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {role === 'patient' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest mb-2 px-2">Pregnancy History</label>
                                            <select
                                                className="w-full bg-white/60 border border-white/50 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 rounded-2xl py-4 px-4 outline-none transition-all font-bold cursor-pointer"
                                                value={pregnancyType}
                                                onChange={(e) => setPregnancyType(e.target.value)}
                                            >
                                                <option value="first">First Pregnancy</option>
                                                <option value="second">Second Pregnancy</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest mb-2 px-2">Home Address</label>
                                            <div className="relative">
                                                <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="123 Medical Lane"
                                                    className="w-full bg-white/60 border border-white/50 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-slate-300 font-bold"
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {role === 'doctor' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest mb-2 px-2">Hospital / Clinic Name</label>
                                            <div className="relative">
                                                <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="e.g. City Life Hospital"
                                                    className="w-full bg-white/60 border border-white/50 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-slate-300 font-bold"
                                                    value={hospitalName}
                                                    onChange={(e) => setHospitalName(e.target.value)}
                                                    required={!isLogin}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest mb-2 px-2">Professional Address</label>
                                            <div className="relative">
                                                <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 456 Medical Square"
                                                    className="w-full bg-white/60 border border-white/50 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-slate-300 font-bold"
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    required={!isLogin}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {role === 'guardian' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest mb-2 px-2">Relationship to Patient</label>
                                            <div className="relative">
                                                <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <select
                                                    className="w-full bg-white/60 border border-white/50 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-bold cursor-pointer"
                                                    value={relationship}
                                                    onChange={(e) => setRelationship(e.target.value)}
                                                >
                                                    <option value="husband">Husband</option>
                                                    <option value="father">Father</option>
                                                    <option value="mother">Mother</option>
                                                    <option value="sibling">Sibling</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        <div>
                            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest mb-2 px-2">Email Identity</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="sarah@clinic.com"
                                    className={`w-full bg-white/60 border ${emailError ? 'border-rose-300 ring-4 ring-rose-50' : 'border-white/50 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10'} rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-slate-300 font-bold`}
                                    value={email}
                                    onChange={handleEmailChange}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest mb-2 px-2">Secure Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="w-full bg-white/60 border border-white/50 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 rounded-2xl py-4 pl-12 pr-12 outline-none transition-all placeholder:text-slate-300 font-bold"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-center gap-3 px-2 mb-4"
                            >
                                <input type="checkbox" id="terms" className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" required />
                                <label htmlFor="terms" className="text-sm text-slate-700 font-bold">I agree to the Clinical Data Policy</label>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-5 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-2xl font-black text-lg shadow-2xl shadow-brand-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] ring-offset-4 hover:ring-2 ring-brand-500/50 mt-4 uppercase tracking-widest"
                        >
                            {isLogin ? 'Authenticate Now' : 'Initialize Account'}
                        </button>
                    </form>

                    <p className="text-center mt-10 text-slate-600 text-sm font-bold">
                        {isLogin ? "New to the platform?" : "Already have an account?"}
                        <button
                            onClick={() => { setIsLogin(!isLogin); setAuthError(''); setEmail(''); setPassword(''); }}
                            className="ml-2 text-brand-600 hover:underline"
                        >
                            {isLogin ? 'Join Now' : 'Login'}
                        </button>
                    </p>

                    <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                        <div className="flex items-center justify-center gap-3 py-2 px-4 bg-slate-50 rounded-2xl inline-flex mx-auto border border-slate-100/50">
                            <ShieldCheck size={16} className="text-brand-600" />
                            <p className="text-[10px] font-extrabold text-slate-700 uppercase tracking-[0.15em]">
                                🛡️ HIPAA Compliant & E2EE
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div >
        </div >
    );
};

export default AuthPage;
