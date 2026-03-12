import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
import logo from '../assets/maatri_shield_logo.png';
import welcomeHero from '../assets/welcome_hero.png';

const Welcome = () => {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-900 flex items-center justify-center font-sans">
            {/* Background Image with Zoom Animation */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                    className="w-full h-full"
                >
                    <img 
                        src={welcomeHero} 
                        alt="Mother and Baby" 
                        className="w-full h-full object-cover opacity-60"
                    />
                </motion.div>
                {/* Gradient Overlays for Readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/60 to-slate-900/90 z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 via-transparent to-slate-900/40 z-10" />
            </div>

            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        x: [0, 50, 0],
                        y: [0, -30, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl opacity-50" 
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.3, 1],
                        rotate: [0, -120, 0],
                        x: [0, -40, 0],
                        y: [0, 60, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl opacity-50" 
                />
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-30 max-w-4xl mx-auto px-6 text-center"
            >
                {/* Logo Section */}
                <motion.div 
                    variants={itemVariants}
                    className="flex justify-center mb-10"
                >
                    <div className="relative">
                        <motion.div 
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute inset-0 bg-brand-500/30 blur-2xl rounded-full"
                        />
                        <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white/10 backdrop-blur-xl flex items-center justify-center p-4 border border-white/20 rounded-3xl shadow-2xl">
                            <img 
                                src={logo} 
                                alt="Maatri Shield Logo" 
                                className="w-full h-full object-contain filter brightness-110 drop-shadow-md" 
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Text Content */}
                <motion.div variants={itemVariants} className="mb-6">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/20 text-brand-200 text-xs md:text-sm font-semibold tracking-wide uppercase mb-6 shadow-sm border border-brand-400/30 backdrop-blur-md">
                        <Sparkles size={14} className="animate-pulse" />
                        Next-Gen Maternal Safety
                    </span>
                    <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1]">
                        Nurturing Life Through <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-200 to-accent-300">
                            Intelligent Care
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed font-medium">
                        Advanced AI monitoring for every expectant mother, ensuring safety and peace of mind at every step of your journey.
                    </p>
                </motion.div>

                {/* Features Highlight */}
                <motion.div 
                    variants={itemVariants}
                    className="flex flex-wrap justify-center gap-6 md:gap-8 mb-12"
                >
                    <div className="flex items-center gap-3 text-white/90">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-brand-300 border border-white/10 shadow-sm backdrop-blur-md">
                            <ShieldCheck size={20} />
                        </div>
                        <span className="font-semibold text-sm md:text-base">AI Risk Detection</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/90">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-accent-300 border border-white/10 shadow-sm backdrop-blur-md">
                            <HeartPulse size={20} />
                        </div>
                        <span className="font-semibold text-sm md:text-base">Real-time Monitoring</span>
                    </div>
                </motion.div>

                {/* Call to Action */}
                <motion.div 
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <button 
                        onClick={() => navigate('/portals')}
                        className="group relative inline-flex items-center justify-center"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-accent-600 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                        <div className="relative flex items-center gap-2 bg-white text-slate-900 px-8 py-4 md:px-12 md:py-5 rounded-full text-lg md:text-xl font-black shadow-2xl transition-all duration-300 group-hover:bg-brand-50">
                            Get Started
                            <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                    <p className="mt-6 text-white/50 font-medium text-sm md:text-base">
                        Experience the future of maternity care
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Welcome;
