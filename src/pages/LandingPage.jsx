import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import portalBg from '../assets/portal_bg_premium.png';
import { Users, UserRound, ShieldCheck } from 'lucide-react';

const PortalCard = ({ role, title, description, icon: Icon, colorClass, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.7, ease: "easeOut" }}
        whileHover={{ y: -15 }}
        className="relative group cursor-pointer h-full"
    >
        {/* Advanced Card Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/20 to-teal-500/20 rounded-[3rem] opacity-0 group-hover:opacity-100 blur-2xl transition duration-700" />
        
        <div 
            className="relative h-full rounded-[3rem] p-10 flex flex-col items-center text-center transition-all duration-700 bg-[#0f172a]/40 backdrop-blur-2xl border border-white/5 group-hover:bg-[#0f172a]/60 group-hover:border-white/10 shadow-2xl"
        >
            <div className={`w-20 h-20 rounded-[2rem] ${colorClass} text-white mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl flex items-center justify-center`}>
                <Icon size={36} />
            </div>
            <h3 className="text-3xl font-black mb-4 text-white tracking-tight">{title}</h3>
            <p className="text-slate-400 mb-10 leading-relaxed font-medium text-lg">
                {description}
            </p>
            <div className="mt-auto w-full">
                <Link
                    to={`/auth/${role}`}
                    className="block w-full bg-white text-[#0f172a] font-black py-5 px-8 rounded-[2rem] transition-all duration-500 transform group-hover:bg-teal-400 group-hover:scale-105 shadow-2xl uppercase tracking-[0.2em] text-xs"
                >
                    Initialize Workspace
                </Link>
            </div>
        </div>
    </motion.div>
);

const LandingPage = () => {
    return (
        <div className="relative min-h-screen font-sans overflow-hidden bg-[#020617] flex items-center justify-center py-20 px-4 md:px-8">
            {/* Unified Clinical Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <motion.img 
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.7 }}
                    transition={{ duration: 2 }}
                    src={portalBg} 
                    alt="Clinical Environment" 
                    className="w-full h-full object-cover"
                />
                {/* Multi-layered merging gradients - Softened for better image visibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617] opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-transparent to-[#020617] opacity-60" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#020617_75%)] opacity-80" />
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
                        description="Monitor high-risk cases and manage patient care with data-driven analytics."
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
