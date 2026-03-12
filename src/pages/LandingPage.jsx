import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import logo from '../assets/maatri_shield_logo.png';
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
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
            }}
            className="relative h-full bg-white/70 rounded-[2.5rem] p-8 flex flex-col items-center text-center transition-all duration-500 hover:bg-white/90"
        >
            <div className={`p-5 rounded-2xl ${colorClass} text-white mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                <Icon size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-800 tracking-tight">{title}</h3>
            <p className="text-slate-600 mb-8 leading-relaxed font-medium">
                {description}
            </p>
            <div className="mt-auto w-full">
                <Link
                    to={`/auth/${role}`}
                    className="block w-full bg-slate-900 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform group-hover:bg-brand-600 shadow-xl"
                >
                    Enter Portal
                </Link>
            </div>
        </div>
    </motion.div>
);

const LandingPage = () => {
    return (
        <div className="relative min-h-screen font-sans overflow-hidden bg-slate-50 flex items-center justify-center py-12 px-4 md:px-8">
            {/* Professional Background Image */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={portalBg} 
                    alt="Portal Background" 
                    className="w-full h-full object-cover opacity-40 mix-blend-multiply"
                />
                {/* Sophisticated Overlays */}
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-50/40 via-transparent to-accent-50/40" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#f8fafc_90%)]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100/80 backdrop-blur-md text-brand-700 font-bold text-sm mb-6 border border-brand-200 shadow-sm">
                        <span>Maatri Shield Central Portals</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-slate-900 flex flex-col items-center gap-2">
                        <span>Select Your</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-600">
                             Professional Workspace
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-semibold">
                        Access specialized tools and data tailored to your role in the maternal care ecosystem.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
                    <PortalCard
                        role="patient"
                        title="Patient Portal"
                        description="Track health vitals, symptoms, and receive AI-driven care insights daily."
                        icon={UserRound}
                        colorClass="bg-[#8B5CF6]"
                        delay={0.1}
                    />
                    <PortalCard
                        role="doctor"
                        title="Doctor Portal"
                        description="Monitor high-risk cases and manage patient care with real-time analytics."
                        icon={Users}
                        colorClass="bg-[#7C3AED]"
                        delay={0.2}
                    />
                    <PortalCard
                        role="guardian"
                        title="Guardian Portal"
                        description="Stay connected and receive critical updates on your loved one's wellness."
                        icon={ShieldCheck}
                        colorClass="bg-[#6D28D9]"
                        delay={0.3}
                    />
                </div>

                <motion.footer
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-20 text-center"
                >
                    <div className="inline-flex items-center gap-4 py-2 px-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-200 text-slate-500 text-sm font-bold shadow-sm">
                        <span>&copy; 2026 Maatri Shield</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>HIPAA Compliant</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>Enterprise Grade Security</span>
                    </div>
                </motion.footer>
            </div>
        </div>
    );
};

export default LandingPage;
