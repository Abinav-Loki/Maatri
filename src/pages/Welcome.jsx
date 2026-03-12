import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
import logo from '../assets/maatri_shield_logo.png';

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
        <div className="relative min-h-screen overflow-hidden bg-slate-50 flex items-center justify-center font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        x: [0, 100, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-24 -right-24 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl" 
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.3, 1],
                        rotate: [0, -120, 0],
                        x: [0, -80, 0],
                        y: [0, 100, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl" 
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_#f8fafc_70%)]" />
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 max-w-4xl mx-auto px-6 text-center"
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
                            className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full"
                        />
                        <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white glass flex items-center justify-center p-6 border-2 border-brand-100">
                            <img 
                                src={logo} 
                                alt="Maatri Shield Logo" 
                                className="w-full h-full object-contain filter drop-shadow-lg" 
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Text Content */}
                <motion.div variants={itemVariants} className="mb-6">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-semibold tracking-wide uppercase mb-6 shadow-sm border border-brand-200">
                        <Sparkles size={14} className="animate-pulse" />
                        Next-Gen Maternal Safety
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
                        Nurturing Life Through <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-brand-500 to-accent-600">
                            Intelligent Care
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
                        Advanced AI monitoring for every expectant mother, ensuring safety and peace of mind at every step of your journey.
                    </p>
                </motion.div>

                {/* Features Highlight */}
                <motion.div 
                    variants={itemVariants}
                    className="flex flex-wrap justify-center gap-8 mb-12"
                >
                    <div className="flex items-center gap-3 text-slate-700">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-100 shadow-sm">
                            <ShieldCheck size={20} />
                        </div>
                        <span className="font-semibold">AI Risk Detection</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700">
                        <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center text-accent-600 border border-accent-100 shadow-sm">
                            <HeartPulse size={20} />
                        </div>
                        <span className="font-semibold">Real-time Monitoring</span>
                    </div>
                </motion.div>

                {/* Call to Action */}
                <motion.div 
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <button 
                        onClick={() => navigate('/portals')}
                        className="group relative inline-flex items-center justify-center"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-accent-600 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 font-bold" />
                        <div className="relative flex items-center gap-2 bg-slate-900 text-white px-10 py-5 rounded-full text-xl font-bold shadow-2xl transition-all duration-300">
                            Get Started
                            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                    <p className="mt-6 text-slate-400 font-medium">
                        Experience the future of maternity care
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Welcome;
