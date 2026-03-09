import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import storage from '../utils/storage';

const CloudStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncStatus, setSyncStatus] = useState('online'); // 'online', 'offline', 'syncing'
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        const handleOnline = async () => {
            setIsOnline(true);
            setSyncStatus('syncing');
            setShowToast(true);

            // Trigger sync
            try {
                await storage.syncOfflineData();
                setSyncStatus('online');
            } catch (error) {
                console.error('Sync failed:', error);
                setSyncStatus('online'); // Revert to online but items might still be unsynced
            }

            setTimeout(() => setShowToast(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setSyncStatus('offline');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const getStatusIcon = () => {
        switch (syncStatus) {
            case 'offline':
                return <CloudOff className="text-rose-500" size={20} />;
            case 'syncing':
                return <RefreshCw className="text-amber-500 animate-spin" size={20} />;
            case 'online':
            default:
                return <CheckCircle2 className="text-emerald-500" size={20} />;
        }
    };

    const getStatusText = () => {
        switch (syncStatus) {
            case 'offline': return 'Offline Mode';
            case 'syncing': return 'Syncing Data...';
            case 'online': return 'All data synced';
            default: return 'Online';
        }
    };

    return (
        <div className="relative flex items-center gap-2 px-3 py-1.5 bg-white/50 backdrop-blur-sm rounded-full border border-slate-200">
            {getStatusIcon()}
            <span className="text-xs font-semibold text-slate-600 hidden sm:block">
                {getStatusText()}
            </span>

            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`absolute top-full mt-2 right-0 p-3 rounded-lg shadow-xl text-white text-sm font-medium z-50 whitespace-nowrap ${isOnline ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                    >
                        {isOnline ? '🚀 Connection Restored. Syncing...' : '⚠️ Offline: Data saved locally.'}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CloudStatus;
