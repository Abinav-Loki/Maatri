import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle2, XCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import storage from '../utils/storage';
import logo from '../assets/maatri_shield_logo.png';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Supabase puts the hash fragment with access_token when redirecting here
        if (!location.hash.includes('access_token') && !location.hash.includes('type=recovery')) {
            // Might not have the token, although supabase handles session checking automatically.
            // But we let the user stay on the page. If the update fails, we show an error.
        }
    }, [location]);

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            await storage.updatePassword(password);
            setSuccess('Password updated successfully! Redirecting...');
            setTimeout(() => {
                navigate('/portals');
            }, 3000);
        } catch (err) {
            setError(err.message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden px-4">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] via-[#020617]/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(20,184,166,0.05)_0%,transparent_60%)] z-10" />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] border border-white/5 shadow-2xl p-10 relative z-20"
            >
                <div className="flex justify-center mb-8">
                    <img src={logo} alt="Maatri Shield" className="w-16 h-16 object-contain filter drop-shadow-2xl" />
                </div>
                
                <h2 className="text-3xl font-black text-white text-center mb-2 tracking-tight">Set New Password</h2>
                <p className="text-slate-400 text-center text-sm font-medium mb-10">
                    Secure your Neural account with a new biometric key.
                </p>

                <form onSubmit={handleReset} className="space-y-6">
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-400 text-sm flex items-center gap-3 font-bold"
                            >
                                <XCircle size={18} className="shrink-0" />
                                {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-teal-500/10 border border-teal-500/20 p-4 rounded-2xl text-teal-400 text-sm flex items-center gap-3 font-bold"
                            >
                                <CheckCircle2 size={18} className="shrink-0" />
                                {success}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="group">
                        <label className="block text-[10px] font-black text-teal-500 uppercase tracking-[0.3em] mb-3 px-4">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="w-full bg-white/[0.03] border border-white/10 focus:border-teal-500/50 focus:bg-white/[0.05] rounded-[1.5rem] py-4 pl-14 pr-14 outline-none transition-all placeholder:text-slate-700 text-white font-bold text-lg [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition-colors p-2"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="group border-t border-white/5 pt-6 mt-6">
                        <label className="block text-[10px] font-black text-teal-500 uppercase tracking-[0.3em] mb-3 px-4">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="w-full bg-white/[0.03] border border-white/10 focus:border-teal-500/50 focus:bg-white/[0.05] rounded-[1.5rem] py-4 pl-14 pr-14 outline-none transition-all placeholder:text-slate-700 text-white font-bold text-lg [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading || success}
                        className="w-full py-5 bg-gradient-to-r from-teal-500 to-indigo-600 text-white rounded-[2rem] font-black text-base shadow-[0_15px_30px_-10px_rgba(20,184,166,0.3)] transition-all uppercase tracking-[0.2em] mt-8 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isLoading ? 'Updating...' : 'Update Password'}
                        {!isLoading && <ArrowRight size={18} />}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
