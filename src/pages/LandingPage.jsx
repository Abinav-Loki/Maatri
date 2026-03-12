import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import portalBg from '../assets/portal_bg.png';
import { Users, UserRound, ShieldCheck } from 'lucide-react';

const PortalCard = ({ role, title, description, icon: Icon, colorClass, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ scale: 1.05, y: -10 }}
        className="relative group cursor-pointer h-full"
    >
        {/* Card Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-400 to-accent-400 rounded-[2.5rem] opacity-0 group-hover:opacity-30 blur-xl transition duration-500" />
        
        <div 
            style={{ 
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}
            className="relative h-full rounded-[2.5rem] p-8 flex flex-col items-center text-center transition-all duration-500 hover:bg-white/10"
        >
            <div className={`p-5 rounded-2xl ${colorClass} text-white mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                <Icon size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white tracking-tight">{title}</h3>
            <p className="text-slate-300 mb-8 leading-relaxed font-medium">
                {description}
            </p>
            <div className="mt-auto w-full">
                <Link
                    to={`/auth/${role}`}
                    className="block w-full bg-white text-slate-900 font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform group-hover:bg-brand-400 group-hover:text-white shadow-xl"
                >
                    Enter Portal
                </Link>
            </div>
        </div>
    </motion.div>
);

const LandingPage = () => {
    return (
        <div className="relative min-h-screen font-sans overflow-hidden bg-slate-950 flex items-center justify-center py-12 px-4 md:px-8">
            {/* Professional Background Image - Merged Perfectly */}
            <div className="absolute inset-0 z-0 bg-slate-950">
                <img 
                    src={portalBg} 
                    alt="Portal Background" 
                    className="w-full h-full object-cover opacity-30"
                />
                {/* Sophisticated Dark Overlays */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/40 to-slate-900/60" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#020617_90%)]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 backdrop-blur-md text-brand-300 font-bold text-sm mb-6 border border-brand-500/20 shadow-sm">
                        <span>Maatri Shield Central Portals</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-white flex flex-col items-center gap-2">
                        <span>Select Your</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-accent-300">
                             Professional Workspace
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-semibold">
                        Access specialized tools and data tailored to your role in the maternal care ecosystem.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
                    <PortalCard
                        role="patient"
                        title="Patient Portal"
                        description="Track health vitals, symptoms, and receive AI-driven care insights daily."
                        icon={UserRound}
                        colorClass="bg-brand-600/80"
                        delay={0.1}
                    />
                    <PortalCard
                        role="doctor"
                        title="Doctor Portal"
                        description="Monitor high-risk cases and manage patient care with real-time analytics."
                        icon={Users}
                        colorClass="bg-brand-700/80"
                        delay={0.2}
                    />
                    <PortalCard
                        role="guardian"
                        title="Guardian Portal"
                        description="Stay connected and receive critical updates on your loved one's wellness."
                        icon={ShieldCheck}
                        colorClass="bg-brand-800/80"
                        delay={0.3}
                    />
                </div>

                <motion.footer
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-20 text-center"
                >
                    <div className="inline-flex items-center gap-4 py-2 px-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-slate-400 text-sm font-bold shadow-sm">
                        <span>&copy; 2026 Maatri Shield</span>
                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span>HIPAA Compliant</span>
                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span>Enterprise Grade Security</span>
                    </div>
                </motion.footer>
            </div>
        </div>
    );
};

export default LandingPage;
