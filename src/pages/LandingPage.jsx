import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import logo from '../assets/maatri_shield_logo.png';
import { Users, UserRound, ShieldCheck, HeartPulse } from 'lucide-react';

const PortalCard = ({ role, title, description, icon: Icon, colorClass, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ scale: 1.05, y: -15 }}
        style={{ boxShadow: '12px 12px 24px rgba(0,0,0,0.03), -12px -12px 24px rgba(255,255,255,1), inset 0 1px 1px rgba(255,255,255,1)' }}
        className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center group cursor-pointer transition-all duration-500 hover:shadow-3xl border-2 border-brand-200"
    >
        <div className={`p-4 rounded-2xl ${colorClass} text-white mb-6 group-hover:scale-110 transition-all duration-300`}>
            <Icon size={32} />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-slate-800">{title}</h3>
        <p className="text-slate-600 mb-8 leading-relaxed">
            {description}
        </p>
        <Link
            to={`/auth/${role}`}
            className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_15px_rgba(139,92,246,0.6)]"
        >
            Enter Portal
        </Link>
    </motion.div>
);

const LandingPage = () => {
    return (
        <div
            className="min-h-screen py-20 px-4 md:px-8 bg-cover bg-center bg-no-repeat relative overflow-x-hidden font-sans"
            style={{ background: '#ffffff' }}
        >


            <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 text-brand-600 font-medium mb-8 shadow-sm">
                        <span>Advanced Maternal Monitoring</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-extrabold mb-6 tracking-tight text-slate-900 flex flex-col items-center gap-4">
                        <span>Empowering Every</span>
                        <div className="flex items-center gap-3 md:gap-5 flex-wrap justify-center">
                            <div className="w-12 h-12 md:w-20 md:h-20 rounded-2xl bg-brand-600 flex items-center justify-center p-2 shadow-xl border border-white/20">
                                <img src={logo} alt="Maatri Shield Logo" className="w-full h-full object-contain mix-blend-screen filter brightness-110" />
                            </div>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6]">Maatri Shield</span>
                        </div>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium px-4">
                        AI-driven risk detection and continuous monitoring for a safer, healthier experience for mother and child.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                    <PortalCard
                        role="patient"
                        title="Patient Portal"
                        description="Track your symptoms daily, monitor vitals, and get instant risk assessments from our AI models."
                        icon={UserRound}
                        colorClass="bg-[#8B5CF6]"
                        delay={0.2}
                    />
                    <PortalCard
                        role="doctor"
                        title="Doctor Portal"
                        description="Manage your clinical caseload, review real-time patient data, and receive critical alerts anytime."
                        icon={Users}
                        colorClass="bg-[#8B5CF6]"
                        delay={0.4}
                    />
                    <PortalCard
                        role="guardian"
                        title="Guardian Portal"
                        description="Stay informed about your loved one's health status and be the first to know in case of emergencies."
                        icon={ShieldCheck}
                        colorClass="bg-[#8B5CF6]"
                        delay={0.6}
                    />
                </div>

                <motion.footer
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-20 text-slate-400 text-sm"
                >
                    &copy; 2026 Maatri Shield &bull; Secure & HIPAA Compliant
                </motion.footer>
            </div>
        </div>
    );
};

export default LandingPage;
