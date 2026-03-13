import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowLeft, HeartPulse, CheckCircle2, XCircle, User, Phone, Calendar, Home, Users as UsersIcon, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/maatri_shield_logo.png';
import loginHero from '../assets/login_hero_premium.png';
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
        patient: 'teal',
        doctor: 'indigo',
        guardian: 'slate'
    };

    // Fix unused variable
    roleColors[role] || 'teal';

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#020617] relative overflow-hidden">
            {/* Left side: Premium Cinematic Hero */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <motion.img 
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.6 }}
                    transition={{ duration: 2 }}
                    src={loginHero} 
                    alt="Clinical Excellence" 
                    className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Advanced Light Leak & Shadow Layering */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] via-[#020617]/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(20,184,166,0.1)_0%,transparent_60%)] z-10" />

                <div className="relative p-20 pt-40 flex flex-col justify-between h-full text-white w-full z-20">
                    <div>
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-row items-center gap-6 mb-20"
                        >
                            <div className="bg-white/5 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-2xl group hover:bg-white/10 transition-all duration-500">
                                <img src={logo} alt="Maatri Shield" className="w-16 h-16 object-contain filter drop-shadow-2xl" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-2xl uppercase tracking-[0.4em] text-white">Maatri Shield</span>
                                <span className="text-[10px] uppercase tracking-[0.5em] text-teal-400 font-black">Clinical Intelligence</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h1 className="text-7xl xl:text-8xl font-black tracking-tighter leading-[0.95] mb-12 text-white">
                                Modern <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">Clinical.</span>
                            </h1>
                            <div className="space-y-6 max-w-md">
                                <div className="h-1.5 w-24 bg-teal-500 rounded-full shadow-[0_0_20px_rgba(20,184,166,0.5)]" />
                                <p className="text-xl text-slate-300 leading-relaxed font-medium">
                                    "Accelerating maternal care with precision neural networks and empathetic clinical insights, built for the next generation of healthcare."
                                </p>
                            </div>
                            
                            <div className="mt-24 flex items-center gap-10">
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black text-white tracking-widest tabular-nums font-mono">2026</span>
                                    <span className="text-[10px] text-teal-500 font-black uppercase tracking-[0.3em]">Protocol Std</span>
                                </div>
                                <div className="w-px h-12 bg-white/10" />
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black text-white tracking-widest tabular-nums font-mono">E2EE</span>
                                    <span className="text-[10px] text-teal-500 font-black uppercase tracking-[0.3em]">Neural Security</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Right side: Authentication Console */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 relative overflow-y-auto bg-[#020617]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.05)_0%,transparent_50%)]" />
                
                <Link
                    to="/portals"
                    className="absolute top-12 left-12 flex items-center gap-3 text-slate-500 hover:text-teal-400 transition-all font-black group z-20 text-xs uppercase tracking-[0.2em]"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Reset Portal
                </Link>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-lg rounded-[4rem] overflow-hidden relative p-12 md:p-14 bg-white/[0.03] backdrop-blur-3xl border border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)]"
                >
                    <div className="relative z-10">
                        <div className="text-center mb-12">
                            <div className="flex justify-center mb-8">
                                <motion.div 
                                    whileHover={{ rotate: 15, scale: 1.1 }}
                                    className="p-6 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl inline-block"
                                >
                                    <UsersIcon size={40} className="text-teal-400" />
                                </motion.div>
                            </div>
                            <h2 className="text-4xl font-black tracking-tighter text-white capitalize mb-4">
                                {role} {isLogin ? 'Console' : 'Registration'}
                            </h2>
                            <p className="text-slate-400 font-medium tracking-tight text-lg">
                                {isLogin ? `Secure access to the Maatri Neural ${role} interface.` : `Initialize your clinical ${role} profile.`}
                            </p>
                        </div>

                        <div className="flex p-2 bg-white/[0.02] rounded-[2rem] mb-12 border border-white/10 backdrop-blur-md">
                            <button
                                onClick={() => { setIsLogin(true); setAuthError(''); setEmail(''); setPassword(''); }}
                                className={`flex-1 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all duration-500 ${isLogin ? 'bg-white text-[#020617] shadow-2xl scale-[1.02]' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Authenticate
                            </button>
                            <button
                                onClick={() => { setIsLogin(false); setAuthError(''); setEmail(''); setPassword(''); }}
                                className={`flex-1 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all duration-500 ${!isLogin ? 'bg-white text-[#020617] shadow-2xl scale-[1.02]' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Register
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <AnimatePresence>
                                {authError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-[1.5rem] text-rose-400 text-sm flex items-center gap-4 font-bold mb-8 backdrop-blur-xl"
                                    >
                                        <XCircle size={20} className="shrink-0" />
                                        {authError}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-8 mb-8"
                                >
                                    <div className="group">
                                        <label className="block text-[10px] font-black text-teal-500 uppercase tracking-[0.3em] mb-3 px-4">Registry Name</label>
                                        <div className="relative">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" size={20} />
                                            <input
                                                type="text"
                                                placeholder="e.g. Dr. Sarah Chen"
                                                className="w-full bg-white/[0.03] border border-white/10 focus:border-teal-500/50 focus:bg-white/[0.05] rounded-[1.5rem] py-5 pl-14 pr-6 outline-none transition-all placeholder:text-slate-700 text-white font-bold text-lg"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required={!isLogin}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-teal-500 uppercase tracking-[0.3em] mb-3 px-4">Age</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" size={20} />
                                                <input
                                                    type="number"
                                                    placeholder="28"
                                                    className="w-full bg-white/[0.03] border border-white/10 focus:border-teal-500/50 focus:bg-white/[0.05] rounded-[1.5rem] py-5 pl-14 pr-6 outline-none transition-all placeholder:text-slate-700 text-white font-bold text-lg"
                                                    value={age}
                                                    onChange={(e) => setAge(e.target.value)}
                                                    required={!isLogin}
                                                />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-teal-500 uppercase tracking-[0.3em] mb-3 px-4">Contact</label>
                                            <div className="relative">
                                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" size={20} />
                                                <input
                                                    type="tel"
                                                    placeholder="Secure Mobile"
                                                    className="w-full bg-white/[0.03] border border-white/10 focus:border-teal-500/50 focus:bg-white/[0.05] rounded-[1.5rem] py-5 pl-14 pr-6 outline-none transition-all placeholder:text-slate-700 text-white font-bold text-lg"
                                                    value={mobile}
                                                    onChange={(e) => setMobile(e.target.value)}
                                                    required={!isLogin}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {role === 'patient' && (
                                        <div className="space-y-8">
                                            <div>
                                                <label className="block text-[10px] font-black text-teal-500 uppercase tracking-[0.3em] mb-3 px-4">Clinical History</label>
                                                <select
                                                    className="w-full bg-white/[0.03] border border-white/10 focus:border-teal-500/50 rounded-[1.5rem] py-5 px-6 outline-none transition-all text-white font-bold text-lg cursor-pointer appearance-none"
                                                    value={pregnancyType}
                                                    onChange={(e) => setPregnancyType(e.target.value)}
                                                >
                                                    <option value="first" className="bg-[#0f172a]">First Pregnancy</option>
                                                    <option value="second" className="bg-[#0f172a]">Second Pregnancy</option>
                                                    <option value="other" className="bg-[#0f172a]">Other Clinical Profile</option>
                                                </select>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[10px] font-black text-teal-500 uppercase tracking-[0.3em] mb-3 px-4">Primary Residence</label>
                                                <div className="relative">
                                                    <Home className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" size={20} />
                                                    <input
                                                        type="text"
                                                        placeholder="Medical Corridor St."
                                                        className="w-full bg-white/[0.03] border border-white/10 focus:border-teal-500/50 focus:bg-white/[0.05] rounded-[1.5rem] py-5 pl-14 pr-6 outline-none transition-all placeholder:text-slate-700 text-white font-bold text-lg"
                                                        value={address}
                                                        onChange={(e) => setAddress(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {role === 'doctor' && (
                                        <div className="space-y-8">
                                            <div className="group">
                                                <label className="block text-[10px] font-black text-teal-500 uppercase tracking-[0.3em] mb-3 px-4">Affiliated Institution</label>
                                                <div className="relative">
                                                    <UsersIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" size={20} />
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. City Life Hospital"
                                                        className="w-full bg-white/[0.03] border border-white/10 focus:border-teal-500/50 focus:bg-white/[0.05] rounded-[1.5rem] py-5 pl-14 pr-6 outline-none transition-all placeholder:text-slate-700 text-white font-bold text-lg"
                                                        value={hospitalName}
                                                        onChange={(e) => setHospitalName(e.target.value)}
                                                        required={!isLogin}
                                                    />
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[10px] font-black text-teal-500 uppercase tracking-[0.3em] mb-3 px-4">Professional Address</label>
                                                <div className="relative">
                                                    <Home className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" size={20} />
                                                    <input
                                                        type="text"
                                                        placeholder="Consultation Chamber Address"
                                                        className="w-full bg-white/[0.03] border border-white/10 focus:border-teal-500/50 focus:bg-white/[0.05] rounded-[1.5rem] py-5 pl-14 pr-6 outline-none transition-all placeholder:text-slate-700 text-white font-bold text-lg"
                                                        value={address}
                                                        onChange={(e) => setAddress(e.target.value)}
                                                        required={!isLogin}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {role === 'guardian' && (
                                        <div>
                                            <label className="block text-[10px] font-black text-teal-500 uppercase tracking-[0.3em] mb-3 px-4">Nexus Relationship</label>
                                            <div className="relative group">
                                                <UsersIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" size={20} />
                                                <select
                                                    className="w-full bg-white/[0.03] border border-white/10 focus:border-teal-500/50 rounded-[1.5rem] py-5 pl-14 pr-6 outline-none transition-all text-white font-bold text-lg cursor-pointer appearance-none"
                                                    value={relationship}
                                                    onChange={(e) => setRelationship(e.target.value)}
                                                >
                                                    <option value="husband" className="bg-[#0f172a]">Husband</option>
                                                    <option value="father" className="bg-[#0f172a]">Father</option>
                                                    <option value="mother" className="bg-[#0f172a]">Mother</option>
                                                    <option value="sibling" className="bg-[#0f172a]">Sibling</option>
                                                    <option value="other" className="bg-[#0f172a]">Other Nexus</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            <div className="group">
                                <label className="block text-[10px] font-black text-teal-500 uppercase tracking-[0.3em] mb-3 px-4">Neural Email Identity</label>
                                <div className="relative">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        placeholder="user@neuralcare.com"
                                        className={`w-full bg-white/[0.03] border ${emailError ? 'border-rose-500/50 ring-4 ring-rose-500/5' : 'border-white/10 focus:border-teal-500/50 focus:bg-white/[0.05]'} rounded-[1.5rem] py-5 pl-14 pr-6 outline-none transition-all placeholder:text-slate-700 text-white font-bold text-lg`}
                                        value={email}
                                        onChange={handleEmailChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-teal-500 uppercase tracking-[0.3em] mb-3 px-4">Biometric Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="w-full bg-white/[0.03] border border-white/10 focus:border-teal-500/50 focus:bg-white/[0.05] rounded-[1.5rem] py-5 pl-14 pr-14 outline-none transition-all placeholder:text-slate-700 text-white font-bold text-lg [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                                        style={{ WebkitTextSecurity: showPassword ? 'none' : undefined }}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition-colors p-2"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-4 px-4 mb-6"
                                >
                                    <input type="checkbox" id="terms" className="w-6 h-6 rounded-lg border-white/10 bg-white/5 text-teal-500 focus:ring-teal-500/50 focus:ring-offset-0 transition-all cursor-pointer" required />
                                    <label htmlFor="terms" className="text-sm text-slate-400 font-bold cursor-pointer hover:text-teal-400 transition-colors">I consent to clinical data processing policy</label>
                                </motion.div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full py-6 bg-gradient-to-r from-teal-500 to-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-[0_20px_40px_-10px_rgba(20,184,166,0.3)] transition-all uppercase tracking-[0.3em] mt-6"
                            >
                                {isLogin ? 'Initialize Uplink' : 'Activate Profile'}
                            </motion.button>
                        </form>

                        <div className="text-center mt-12">
                            <p className="text-slate-500 text-sm font-bold tracking-tight">
                                {isLogin ? "Neural records not found?" : "Already registered on the platform?"}
                                <button
                                    onClick={() => { setIsLogin(!isLogin); setAuthError(''); setEmail(''); setPassword(''); }}
                                    className="ml-3 text-teal-400 hover:text-teal-300 transition-all font-black uppercase tracking-widest text-xs border-b border-teal-500/20 hover:border-teal-400 pb-0.5"
                                >
                                    {isLogin ? 'Join Neural Network' : 'System Uplink'}
                                </button>
                            </p>
                        </div>

                        <div className="mt-16 pt-10 border-t border-white/5">
                            <div className="flex flex-wrap items-center justify-center gap-6">
                                <div className="flex items-center gap-3 py-2.5 px-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl">
                                    <ShieldCheck size={18} className="text-teal-400" />
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Neural Encryption E2EE</span>
                                </div>
                                <div className="flex items-center gap-3 py-2.5 px-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl">
                                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Medical Grade HIPAA</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div >
        </div >
    );
};

export default AuthPage;
