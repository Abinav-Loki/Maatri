import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
import welcomeHero from '../assets/welcome_hero_premium.png';

const Welcome = () => {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.4,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#020617] flex items-center justify-center font-sans">
            {/* Cinematic Background with Slow Parallax */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1.05, opacity: 0.5 }}
                    transition={{ duration: 3 }}
                    className="w-full h-full"
                >
                    <img 
                        src={welcomeHero} 
                        alt="Clinical Environment" 
                        className="w-full h-full object-cover"
                    />
                </motion.div>
                {/* Elite Gradient Layering */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#020617]/40 to-[#020617] z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-transparent to-[#020617] z-10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#020617_85%)] z-10" />
            </div>

            {/* Subtle Ethereal Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3],
                        x: [0, 30, 0],
                        y: [0, -20, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-40 -right-40 w-[40rem] h-[40rem] bg-teal-500/10 rounded-full blur-[100px]" 
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2],
                        x: [0, -30, 0],
                        y: [0, 40, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-40 -left-40 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[100px]" 
                />
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-30 max-w-5xl mx-auto px-8 text-center"
            >
                {/* Elite Header Content */}
                <motion.div variants={itemVariants} className="mb-10">
                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/[0.03] text-teal-400 text-xs md:text-sm font-black tracking-[0.3em] uppercase mb-10 shadow-2xl border border-white/10 backdrop-blur-2xl">
                        <Sparkles size={16} className="animate-pulse" />
                        Next-Generation Maternal Intelligence
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.95]">
                        The Future of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-white to-indigo-400">
                            Clinical Support
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
                        Empowering mothers and clinicians with AI-driven screening and clinical data transparency, designed for a safer Maatri journey.
                    </p>
                </motion.div>

                {/* Clinical Feature Indicators */}
                <motion.div 
                    variants={itemVariants}
                    className="flex flex-wrap justify-center gap-10 md:gap-16 mb-16"
                >
                    <div className="flex items-center gap-4 text-white/80 group">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center text-teal-400 border border-white/10 shadow-2xl backdrop-blur-2xl group-hover:scale-110 group-hover:bg-teal-500/10 transition-all duration-500">
                            <ShieldCheck size={28} />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="font-black text-white uppercase tracking-widest text-xs">Precision</span>
                            <span className="text-slate-400 text-sm font-bold">Neural Screening</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-white/80 group">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center text-indigo-400 border border-white/10 shadow-2xl backdrop-blur-2xl group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all duration-500">
                            <HeartPulse size={28} />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="font-black text-white uppercase tracking-widest text-xs">Insight</span>
                            <span className="text-slate-400 text-sm font-bold">Empathetic Monitoring</span>
                        </div>
                    </div>
                </motion.div>

                {/* Primary Interaction */}
                <motion.div 
                    variants={itemVariants}
                    className="flex flex-col items-center"
                >
                    <button 
                        onClick={() => navigate('/portals')}
                        className="group relative inline-flex items-center justify-center"
                    >
                        <div className="absolute -inset-1.5 bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full blur-xl opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-300" />
                        <div className="relative flex items-center gap-4 bg-white text-[#020617] px-12 py-5 md:px-16 md:py-6 rounded-full text-xl md:text-2xl font-black shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                            Initialize Portal
                            <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform duration-500" />
                        </div>
                    </button>
                    <div className="mt-12 flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                            <span className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                                Secure Medical Network Online
                            </span>
                        </div>
                        <p className="text-slate-600 font-bold text-xs max-w-sm">
                            *This system is an AI-assisted support tool. Clinical decisions should always be validated by medical professionals.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Welcome;

