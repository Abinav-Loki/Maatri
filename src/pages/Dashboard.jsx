import React, { useEffect, useState } from 'react';
import logo from '../assets/maatri_shield_logo.png';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Bell, Settings, LogOut, TrendingUp,
    AlertTriangle, Plus, X, Heart, Droplets,
    Thermometer, ChevronRight, LayoutDashboard,
    Users as UsersIcon, User, Search, Edit, Camera,
    MessageSquare, Sparkles, Bot, Trash2,
    Calendar, Download, CheckCircle2, Play, Square, Zap, Image as ImageIcon,
    Mic, Pause, UserPlus, Lock, ArrowRight, Shield
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, LineChart, Line,
    Legend, ReferenceLine
} from 'recharts';
import GaugeChart from 'react-gauge-chart';
import storage from '../utils/storage';
import CloudStatus from '../components/CloudStatus';
import { getAiCareAdvice, generateWeeklyClinicalReport } from '../services/aiAssistant';
import twilioMock from '../utils/twilio';
import browserNotifications from '../utils/notifications';

const Dashboard = () => {
    console.log("=== DASHBOARD RENDER START ===");
    const { role } = useParams();
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [stats, setStats] = useState([]);
    const [alert, setAlert] = useState("");
    const [logs, setLogs] = useState([]);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [showQuickProfile, setShowQuickProfile] = useState(false);

    // Log Form State
    const [logForm, setLogForm] = useState({
        heartRate: '', systolic: '', diastolic: '', glucose: '', symptoms: ''
    });

    const [profileForm, setProfileForm] = useState({
        name: '', age: '', mobile: '', address: '', pregnancyType: '', relationship: '',
        photo: '', hospitalName: ''
    });

    // Connection System State
    const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
    const [doctorSearchResults, setDoctorSearchResults] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [showRequestsDropdown, setShowRequestsDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedViewDoctor, setSelectedViewDoctor] = useState(null);
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

    // Telemedicine State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeChatPartner, setActiveChatPartner] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const chatEndRef = React.useRef(null);
    const [newMessage, setNewMessage] = useState('');
    const [chatSearchQuery, setChatSearchQuery] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [isCalling, setIsCalling] = useState(false);
    const [callType, setCallType] = useState(null); // 'audio' or 'video'
    const [callStatus, setCallStatus] = useState('idle'); // 'idle', 'ringing', 'connected'
    const [incomingCall, setIncomingCall] = useState(null);
    const [connectedPartners, setConnectedPartners] = useState([]);
    const [isDeleteChatConfirmOpen, setIsDeleteChatConfirmOpen] = useState(false);
    const [patientHealthData, setPatientHealthData] = useState({}); // { email: { latestLog, risk } }
    const [searchStatuses, setSearchStatuses] = useState({}); // { email: status }
    const [clinicalNotifications, setClinicalNotifications] = useState([]);
    const [isSOSTriggered, setIsSOSTriggered] = useState(false);

    // AI Assistant State
    const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
    const [aiChatHistory, setAiChatHistory] = useState([]);
    const [aiNewMessage, setAiNewMessage] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const aiChatEndRef = React.useRef(null);
    const [patientFilter, setPatientFilter] = useState('all'); // 'all', 'urgent', 'help', 'normal'
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportContent, setReportContent] = useState('');
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [patientReports, setPatientReports] = useState([]);
    const [selectedReportTimestamp, setSelectedReportTimestamp] = useState(null);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [demoDataPoints, setDemoDataPoints] = useState([]);
    const [isSosPulsing, setIsSosPulsing] = useState(false);
    const [demoRiskPercent, setDemoRiskPercent] = useState(0);
    const [simMessages, setSimMessages] = useState([]);
    const [showSimLogs, setShowSimLogs] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Appointments State
    const [appointments, setAppointments] = useState([]);

    // Unread Messages State
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [partnerUnreadCounts, setPartnerUnreadCounts] = useState({}); // { partnerEmail: count }
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [appointmentForm, setAppointmentForm] = useState({ date: '', time: '', reason: '' });
    const [selectedPatientForAppointment, setSelectedPatientForAppointment] = useState(null);
    const [appointmentStep, setAppointmentStep] = useState('date'); // 'date' or 'time'
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewDate, setViewDate] = useState(new Date());

    // Guardian Connection State
    const [guardianConnectionStatus, setGuardianConnectionStatus] = useState('none'); // 'none' | 'pending' | 'accepted'
    const [guardianPatientEmail, setGuardianPatientEmail] = useState('');

    // Health Profile State
    const [isHealthProfileOpen, setIsHealthProfileOpen] = useState(false);
    const [isSavingHealthProfile, setIsSavingHealthProfile] = useState(false);
    const [healthProfileForm, setHealthProfileForm] = useState({
        weight: '', height: '', bloodType: '',
        currentConditions: [],
        pastConditions: '', allergies: '', currentMedications: '', notes: ''
    });
    const [patientHealthProfiles, setPatientHealthProfiles] = useState({}); // { email: healthProfile }

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const generateCalendarDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Add empty slots for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add actual days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    // Demo Mode Animation Logic
    useEffect(() => {
        if (isDemoMode) {
            browserNotifications.requestPermission();
        }

        const fullDemoData = [
            { day: 'Sun', hr: 72, sys: 110, dia: 70, g: 92, risk: 0.15 },
            { day: 'Mon', hr: 75, sys: 115, dia: 75, g: 95, risk: 0.2 },
            { day: 'Tue', hr: 78, sys: 122, dia: 80, g: 98, risk: 0.3 },
            { day: 'Wed', hr: 74, sys: 128, dia: 84, g: 94, risk: 0.45 },
            { day: 'Thu', hr: 82, sys: 135, dia: 88, g: 105, risk: 0.6 },
            { day: 'Fri', hr: 85, sys: 142, dia: 92, g: 115, risk: 0.75 },
            { day: 'Sat', hr: 90, sys: 151, dia: 96, g: 120, risk: 1.0 }, // Pathological BP > 150/95
        ];

        let currentIndex = 0;
        // Initialize with undefined values so X-Axis renders fully, but lines draw progressively
        setDemoDataPoints(fullDemoData.map(d => ({ day: d.day })));
        setIsSosPulsing(false);
        setDemoRiskPercent(0.15); // Start Safe

        const totalScanDuration = 2500; // Faster, more cinematic scan
        const intervalTime = totalScanDuration / fullDemoData.length;

        const timer = setInterval(() => {
            if (currentIndex < fullDemoData.length) {
                const currentPoint = fullDemoData[currentIndex];
                setDemoDataPoints(prev => {
                    const next = [...prev];
                    // Real-time animation: fill up to current index with actual values
                    for (let i = 0; i <= currentIndex; i++) {
                        next[i] = { ...fullDemoData[i] };
                    }
                    return next;
                });
                setDemoRiskPercent(currentPoint.risk);

                // Auto Trigger SOS if pathological BP detected
                if (currentPoint.sys > 150 || currentPoint.dia > 95) {
                    setIsSosPulsing(true);
                    handleAutoEmergencySOS(currentPoint);
                }

                if (currentIndex === fullDemoData.length - 1) {
                    if (navigator.vibrate) {
                        navigator.vibrate([200, 100, 200]);
                    }
                    clearInterval(timer);
                }
                currentIndex++;
            }
        }, intervalTime);

        return () => clearInterval(timer);
    }, [isDemoMode]);

    const handleAutoEmergencySOS = async (vitals) => {
        if (isSOSTriggered) return;
        setIsSOSTriggered(true);
        const msg = `EMERGENCY: Maatri Shield detected critical vitals (BP: ${vitals.sys}/${vitals.dia}). Location: ${currentUser?.address || 'Saved Home Address'}. Help is being dispatched.`;

        // Browser notification
        browserNotifications.send("CRITICAL EMERGENCY", msg);

        // Storage Notification
        await storage.addNotification(currentUser.email, 'SOS', msg);

        // Twilio SMS
        if (currentUser?.mobile) {
            twilioMock.sendSMS(currentUser.mobile, msg);
        }
        if (currentUser?.emergencyContact) {
            twilioMock.sendSMS(currentUser.emergencyContact, `EMERGENCY ALERT for ${currentUser.name}: Critical vitals detected. ${msg}`);
            twilioMock.sendWhatsApp(currentUser.emergencyContact, `EMERGENCY: ${currentUser.name} needs immediate help. Live Location: https://maps.google.com/?q=current+location. [ REPLY 'SAFE' TO CANCEL ]`);
        }

        const updated = await storage.getNotifications(currentUser.email);
        setClinicalNotifications(updated);
    };

    // Dynamic Data Processing for Trends
    const weeklyTrends = React.useMemo(() => {
        try {
            console.log("Calculating weeklyTrends. isDemoMode:", isDemoMode);
            if (isDemoMode) {
                return demoDataPoints;
            }
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const now = new Date();
            const last7Days = [];

            const sunday = new Date(now);
            sunday.setDate(now.getDate() - now.getDay());
            sunday.setHours(0, 0, 0, 0);

            for (let i = 0; i < 7; i++) {
                const d = new Date(sunday);
                d.setDate(sunday.getDate() + i);
                last7Days.push({
                    day: days[d.getDay()],
                    fullDate: d.toDateString(),
                    hr: 0, sys: 0, dia: 0, g: 0, count: 0
                });
            }

            logs.forEach(log => {
                const logDate = new Date(log.timestamp).toDateString();
                const dayObj = last7Days.find(d => d.fullDate === logDate);
                if (dayObj) {
                    dayObj.hr += parseInt(log.heartRate) || 0;
                    dayObj.sys += parseInt(log.systolic) || 0;
                    dayObj.dia += parseInt(log.diastolic) || 0;
                    dayObj.g += parseInt(log.glucose) || 0;
                    dayObj.count++;
                }
            });

            return last7Days.map(d => ({
                day: d.day,
                hr: d.count ? Math.round(d.hr / d.count) : null,
                sys: d.count ? Math.round(d.sys / d.count) : null,
                dia: d.count ? Math.round(d.dia / d.count) : null,
                g: d.count ? Math.round(d.g / d.count) : null,
            }));
        } catch (e) {
            console.error("CRITICAL ERROR IN WEEKLY TRENDS:", e);
            return [];
        }
    }, [logs, isDemoMode, demoDataPoints]);

    const riskStats = React.useMemo(() => {
        if (role !== 'doctor') return { high: 0, medium: 0, low: 0 };
        const counts = { high: 0, medium: 0, low: 0 };
        patients.forEach(p => {
            const risk = patientHealthData[p.email]?.risk?.level;
            if (risk === 'urgent') counts.high++;
            else if (risk === 'help') counts.medium++;
            else counts.low++;
        });
        return counts;
    }, [role, patients, patientHealthData]);

    const getRiskStatus = React.useCallback((log) => {
        if (!log) return { level: 'normal', label: 'Normal', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100', score: 0.2 };

        const hr = parseInt(log.heartRate);
        const sys = parseInt(log.systolic);
        const dia = parseInt(log.diastolic);
        const glucose = parseInt(log.glucose);

        // Normalize deviations (simple linear model)
        // Normal ranges: HR 60-100, SYS 90-120, DIA 60-80, GLU 70-120
        const hrDev = Math.max(0, hr > 100 ? (hr - 100) / 40 : (60 - hr) / 40);
        const sysDev = Math.max(0, (sys - 120) / 60);
        const diaDev = Math.max(0, (dia - 80) / 40);
        const gluDev = Math.max(0, (glucose - 120) / 130);

        // Calculate a raw score between 0.1 and 1.0
        const maxDev = Math.max(hrDev, sysDev, diaDev, gluDev);
        const dynamicScore = Math.min(1.0, 0.2 + (maxDev * 0.8));

        // Urgent conditions
        if (sys > 180 || dia > 120 || glucose > 250 || hr > 120 || hr < 40) {
            return { level: 'urgent', label: 'Urgent', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', score: dynamicScore };
        }

        // Need Help conditions
        if (sys > 140 || dia > 90 || glucose > 140 || hr > 100) {
            return { level: 'help', label: 'Need Help', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', score: Math.max(0.4, dynamicScore) };
        }

        return { level: 'normal', label: 'Normal', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100', score: Math.max(0.1, dynamicScore) };
    }, []);

    const updateDashboardData = React.useCallback(async (userRole, targetUser) => {
        const userLogs = await storage.getLogs(targetUser.email);
        setLogs(userLogs);

        const today = new Date().toDateString();
        const todayLogs = userLogs.filter(log => new Date(log.timestamp).toDateString() === today);
        const latestLog = todayLogs[0] || userLogs[0];
        const risk = getRiskStatus(latestLog);
        const isToday = todayLogs.length > 0 && latestLog === todayLogs[0];

        if (userRole === 'patient') {
            setStats([
                {
                    label: "Heart Rate",
                    value: latestLog ? `${latestLog.heartRate} bpm` : "-- bpm",
                    status: isToday ? "Today's Latest" : "Last Recorded",
                    color: isToday ? "text-brand-600" : "text-slate-400"
                },
                {
                    label: "Blood Pressure",
                    value: latestLog ? `${latestLog.systolic}/${latestLog.diastolic}` : "--/--",
                    status: isToday ? "Today's Latest" : "Last Recorded",
                    color: isToday ? "text-brand-600" : "text-slate-400"
                },
                {
                    label: "Glucose Level",
                    value: latestLog ? `${latestLog.glucose} mg/dL` : "-- mg/dL",
                    status: isToday ? "Today's Latest" : "Last Recorded",
                    color: isToday ? "text-brand-600" : "text-slate-400"
                },
            ]);
            setAlert(isToday ? "Monitoring active. Your vitals for today are synced." : (latestLog ? "No logs for today. Showing previous data." : "Welcome! Please enter your first health log to start monitoring."));
        } else if (userRole === 'doctor') {
            setStats([
                { label: "Patient Status", value: risk.label, status: isToday ? "Updated Today" : "Latest Assessment", color: risk.color },
                { label: "Recent Symptoms", value: latestLog?.symptoms ? "Reported" : "None", status: latestLog?.symptoms ? "Check history" : "All clear", color: latestLog?.symptoms ? "text-amber-500" : "text-slate-400" },
                { label: "Vitals Accuracy", value: "Verified", status: "Real-time sync", color: "text-blue-500" },
            ]);
            setAlert(latestLog ? `Reviewing data for ${targetUser.name}. ${isToday ? "Updated today." : "No logs today."}` : `No logs found for ${targetUser.name}`);
        } else if (userRole === 'guardian') {
            setStats([
                { label: "Last Sync", value: isToday ? "Today" : (latestLog ? new Date(latestLog.timestamp).toLocaleDateString() : "Never"), status: isToday ? "Active" : "Stable", color: isToday ? "text-brand-600" : "text-slate-400" },
                { label: "Risk Level", value: risk.label, status: isToday ? "Live Check" : "Final State", color: risk.color },
                { label: "Patient", value: targetUser.name || "Linked", status: "Verified", color: "text-blue-500" },
            ]);
            setAlert(isToday ? `Monitoring ${targetUser.name}'s vitals today.` : (latestLog ? `No new logs today from ${targetUser.name}.` : `Waiting for ${targetUser.name} to log data.`));
        }
    }, [getRiskStatus]);

    useEffect(() => {
        const fetchInitialData = async () => {
            const userStr = localStorage.getItem('currentUser');
            if (!userStr) {
                navigate('/');
                return;
            }
            const user = JSON.parse(userStr);
            setCurrentUser(user);

            // Initial Data Fetching
            if (role === 'doctor') {
                const authorizedPatients = await storage.getAuthorizedPatients(user.email);
                setPatients(authorizedPatients);

                // Fetch initial chat partners for doctor
                const initialPartners = await storage.getConnectedPartners(user.email, 'doctor');
                setConnectedPartners(initialPartners);

                // Fetch health data for each patient
                const healthInfo = {};
                for (const p of authorizedPatients) {
                    const pLogs = await storage.getLogs(p.email);
                    healthInfo[p.email] = {
                        latestLog: pLogs[0] || null,
                        risk: getRiskStatus(pLogs[0])
                    };
                }
                setPatientHealthData(healthInfo);

                if (authorizedPatients.length > 0) {
                    // Do not auto-select patient for doctors to keep analytics clean
                    setAlert("Select a patient from the directory or reports to view their clinical data.");
                } else {
                    setStats([
                        { label: "Connected Patients", value: "0", status: "Await follow", color: "text-slate-400" },
                        { label: "Critical Alerts", value: "0", status: "All clear", color: "text-green-500" },
                        { label: "Pending Requests", value: "0", status: "Incoming", color: "text-slate-400" },
                    ]);
                    setAlert("Access restricted. Patients must accept your follow request before you can view their data.");
                }
                // Fetch pending requests for doctor
                console.log('[Dashboard] Fetching initial pending requests for doctor');
                const requestsWithNames = await storage.getPendingRequests(user.email);
                console.log(`[Dashboard] Fetched ${requestsWithNames.length} requests with names`);
                setPendingRequests(requestsWithNames);
            } else if (role === 'guardian') {
                // Guardian uses the connection request system.
                // 1. Fetch all outgoing connections made by this guardian
                const { data: allConns } = await supabase
                    .from('connections')
                    .select('*')
                    .eq('from_email', user.email.toLowerCase());

                const acceptedConn = (allConns || []).find(c => c.status === 'accepted');
                const pendingConn = (allConns || []).find(c => c.status === 'pending');

                if (acceptedConn) {
                    setGuardianConnectionStatus('accepted');
                    setGuardianPatientEmail(acceptedConn.to_email);
                    const patient = await storage.getPatientByEmail(acceptedConn.to_email);
                    if (patient) {
                        setSelectedPatient(patient);
                        await updateDashboardData('guardian', patient);
                        const reports = await storage.getClinicalReports(acceptedConn.to_email);
                        setPatientReports(reports);
                    }
                } else if (pendingConn) {
                    setGuardianConnectionStatus('pending');
                    setGuardianPatientEmail(pendingConn.to_email);
                    setStats([
                        { label: "Request Sent", value: "Pending", status: "Awaiting approval", color: "text-amber-400" },
                        { label: "Risk Level", value: "--", status: "No access yet", color: "text-slate-400" },
                        { label: "Connection", value: "Pending", status: "Waiting", color: "text-amber-400" },
                    ]);
                    setAlert(`Connection request sent to ${pendingConn.to_email}. Waiting for patient approval.`);
                } else {
                    setGuardianConnectionStatus('none');
                    setStats([
                        { label: "Last Sync", value: "Never", status: "Inactive", color: "text-slate-400" },
                        { label: "Risk Level", value: "--", status: "No data", color: "text-slate-400" },
                        { label: "Connection", value: "None", status: "Send a request", color: "text-slate-400" },
                    ]);
                    setAlert("Enter the patient's email address below to send a connection request.");
                }
            } else if (role === 'patient') {
                await updateDashboardData('patient', user);
                // Fetch reports for patient
                const reports = await storage.getClinicalReports(user.email);
                setPatientReports(reports);

                // Fetch initial pending requests instantly so user doesn't wait
                const requestsWithNames = await storage.getPendingRequests(user.email);
                setPendingRequests(requestsWithNames);

                // Fetch connected partners (doctors) for chat
                const partners = await storage.getConnectedPartners(user.email, 'patient');
                setConnectedPartners(partners);
            }

            // Load AI Chat History
            const storedAiHistory = await storage.getAiHistory(user.email);
            setAiChatHistory(storedAiHistory);

            // Load Appointments
            const userAppointments = await storage.getAppointments(user.email, role);
            setAppointments(userAppointments);

            // Sync any offline data on fresh load
            if (navigator.onLine) {
                storage.syncOfflineData();
            }
        };

        fetchInitialData();

        // Periodic check for requests and messages
        const dataInterval = setInterval(async () => {
            const userStr = localStorage.getItem('currentUser');
            if (!userStr) return;
            const user = JSON.parse(userStr);

            if (user) {
                // Optimized batch fetch for requests and partners
                const requestsWithNames = await storage.getPendingRequests(user.email);
                setPendingRequests(prev => JSON.stringify(prev) === JSON.stringify(requestsWithNames) ? prev : requestsWithNames);

                const partners = await storage.getConnectedPartners(user.email, user.role);
                setConnectedPartners(prev => JSON.stringify(prev) === JSON.stringify(partners) ? prev : partners);

                if (user.role === 'guardian') {
                    const { data: allConns } = await supabase
                        .from('connections')
                        .select('*')
                        .eq('from_email', user.email.toLowerCase());

                    const acceptedConn = (allConns || []).find(c => c.status === 'accepted');
                    if (acceptedConn && guardianConnectionStatus === 'pending') {
                        setGuardianConnectionStatus('accepted');
                        setGuardianPatientEmail(acceptedConn.to_email);
                        const patient = await storage.getPatientByEmail(acceptedConn.to_email);
                        if (patient) {
                            setSelectedPatient(patient);
                            await updateDashboardData('guardian', patient);
                        }
                    }
                }

                // Real-time message/call polling
                if (activeChatPartner && isChatOpen) {
                    await storage.markMessagesAsRead(activeChatPartner.email, user.email);
                    const msgs = await storage.getMessages(user.email, activeChatPartner.email);
                    setChatMessages(msgs);

                    // Check for incoming calls in messages
                    const latestMsg = msgs[msgs.length - 1];
                    if (latestMsg && latestMsg.type === 'call_request' && latestMsg.to === user.email && latestMsg.status === 'pending') {
                        setIncomingCall(latestMsg);
                    }
                }

                // Final consolidation of counts to prevent flickering
                const finalUnreadCount = await storage.getUnreadMessagesCount(user.email);
                setUnreadMessageCount(finalUnreadCount);

                const partnerCounts = await storage.getUnreadMessagesCountPerPartner(user.email);
                setPartnerUnreadCounts(partnerCounts);
            }
        }, 15000); // Increased polling interval to 15s for network stability
        return () => clearInterval(dataInterval);
    }, [role, navigate, activeChatPartner, updateDashboardData]);

    // Simulation Logs Listener
    useEffect(() => {
        const unsubscribe = twilioMock.onMessage((newMsg) => {
            setSimMessages(prev => [newMsg, ...prev].slice(0, 10));
        });
        return unsubscribe;
    }, []);

    // Clinical Reminders & Notification Fetching
    useEffect(() => {
        if (!currentUser) return;

        const syncNotifications = async () => {
            const notes = await storage.getNotifications(currentUser.email);
            setClinicalNotifications(notes);
        };

        syncNotifications();
        const notificationInterval = setInterval(syncNotifications, 10000); // Polling every 10s for real-time SOS/reminders

        let reminderTimer;
        if (role !== 'doctor') {
            const checkReminders = async () => {
                const now = new Date();

                // 2 Hour Water Reminder (7200000 ms)
                // Only send AFTER the user has entered at least one health log
                const existingLogs = await storage.getLogs(currentUser.email);
                if (existingLogs.length > 0) {
                    const lastWater = await storage.getLastWaterReminder(currentUser.email);
                    if (!lastWater || (now - new Date(lastWater.timestamp)) > 7200000) {
                        const message = "Time for your hydration! Staying consistent helps keep your Maatri Shield score in the green.";
                        await storage.addNotification(currentUser.email, 'water', message);
                        browserNotifications.send("Hydration Alert", message);
                        if (currentUser?.mobile) {
                            twilioMock.sendWhatsApp(currentUser.mobile, message);
                        }
                        syncNotifications();
                    }
                }

                // Medicine Reminder (User-set times)
                if (currentUser?.medicineTimes) {
                    const currentHourMin = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                    const medTimes = currentUser.medicineTimes.split(',').map(t => t.trim());

                    if (medTimes.includes(currentHourMin)) {
                        const message = "Time for your medicine! Staying consistent helps keep your Maatri Shield score in the green.";
                        // Avoid duplicates if checked multiple times in the same minute
                        const recentNotes = await storage.getNotifications(currentUser.email);
                        const isAlreadyNotified = recentNotes.some(n => n.type === 'medicine' && (now - new Date(n.timestamp)) < 120000);

                        if (!isAlreadyNotified) {
                            await storage.addNotification(currentUser.email, 'medicine', message);
                            browserNotifications.send("Medicine Reminder", message);
                            if (currentUser?.mobile) {
                                twilioMock.sendWhatsApp(currentUser.mobile, message);
                            }
                            syncNotifications();
                        }
                    }
                }
            };

            checkReminders();
            reminderTimer = setInterval(checkReminders, 60000);
        }

        return () => {
            clearInterval(notificationInterval);
            if (reminderTimer) clearInterval(reminderTimer);
        };
    }, [currentUser, role]);

    useEffect(() => {
        if (activeTab === 'notifications' && currentUser) {
            const markAllRead = async () => {
                await storage.markNotificationsAsRead(currentUser.email);
                const updated = await storage.getNotifications(currentUser.email);
                setClinicalNotifications(updated);
            };
            markAllRead();
        }
    }, [activeTab, currentUser]);

    useEffect(() => {
        const fetchReports = async () => {
            if (activeTab === 'reports') {
                if (role === 'doctor' && selectedPatient) {
                    const reports = await storage.getClinicalReports(selectedPatient.email);
                    setPatientReports(reports);
                } else if (role === 'patient') {
                    const reports = await storage.getClinicalReports(currentUser.email);
                    setPatientReports(reports);
                } else if (role === 'guardian' && selectedPatient) {
                    const reports = await storage.getClinicalReports(selectedPatient.email);
                    setPatientReports(reports);
                }
            }
        };
        fetchReports();
    }, [role, activeTab, selectedPatient, currentUser]);

    // Auto-scroll AI Chat
    useEffect(() => {
        if (isAiAssistantOpen) {
            aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [aiChatHistory, isAiLoading, isAiAssistantOpen]);

    // Auto-scroll Telemedicine Chat
    useEffect(() => {
        if (isChatOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, isChatOpen]);

    const handleDoctorSearch = async (query) => {
        setDoctorSearchQuery(query);
        const results = await storage.searchDoctors(query);
        setDoctorSearchResults(results);

        // Fetch connection statuses for search results
        const statuses = {};
        for (const doc of results) {
            statuses[doc.email] = await storage.getConnectionStatus(currentUser.email, doc.email);
        }
        setSearchStatuses(statuses);
    };

    const handleSendFollowRequest = async (toEmail) => {
        console.log(`[Dashboard] Sending follow request to ${toEmail}`);
        const success = await storage.sendConnectionRequest(currentUser.email, toEmail);
        if (success) {
            setSearchStatuses(prev => ({ ...prev, [toEmail]: 'pending' }));
        }
    };

    const handleRequestAction = async (requestId, status) => {
        await storage.handleConnectionRequest(requestId, status);
        const requestsWithNames = await storage.getPendingRequests(currentUser.email);
        setPendingRequests(requestsWithNames);

        if (role === 'doctor' && status === 'accepted') {
            const authorizedPatients = await storage.getAuthorizedPatients(currentUser.email);
            setPatients(authorizedPatients);

            // Refresh health data for each patient
            const healthInfo = {};
            for (const p of authorizedPatients) {
                const pLogs = await storage.getLogs(p.email);
                healthInfo[p.email] = {
                    latestLog: pLogs[0] || null,
                    risk: getRiskStatus(pLogs[0])
                };
            }
            setPatientHealthData(healthInfo);

            if (authorizedPatients.length > 0 && !selectedPatient) {
                // Do not auto-select patient for doctors
                setAlert(`Patient ${authorizedPatients[authorizedPatients.length - 1].name} added. Select them to view data.`);
            }
        }
    };


    const handleLogout = () => {
        storage.logout();
        navigate(`/login/${role || 'patient'}`);
    };

    const handleSOS = async () => {
        if (!window.confirm("TRIGGER EMERGENCY SOS? This will alert all your connected doctors and guardians immediately.")) return;

        setIsSOSTriggered(true);
        try {
            const msg = `EMERGENCY: ${currentUser.name} is requesting immediate help via SOS Trigger.`;
            await storage.addSOS(currentUser.email, currentUser.name);

            // Twilio Alerts
            if (currentUser?.emergencyContact) {
                twilioMock.sendSMS(currentUser.emergencyContact, msg);
                twilioMock.sendWhatsApp(currentUser.emergencyContact, `${msg} Live Location: https://maps.google.com/?q=current+location. [ REPLY 'SAFE' TO CANCEL ]`);
            }

            const updated = await storage.getNotifications(currentUser.email);
            setClinicalNotifications(updated);
            alert("EMERGENCY SOS SENT! Your clinical team and emergency contact have been notified.");
        } catch (error) {
            console.error("SOS Error:", error);
            alert("Failed to send SOS. Please call emergency services immediately.");
        }
        setTimeout(() => setIsSOSTriggered(false), 5000);
    };

    const handleResetDemo = async () => {
        setIsDemoMode(false);
        setDemoDataPoints([]);
        setIsSosPulsing(false);
        setDemoRiskPercent(0);
        setIsSOSTriggered(false);
        await storage.clearAllNotifications(currentUser.email);
        const updated = await storage.getNotifications(currentUser.email);
        setClinicalNotifications(updated);
        console.log("[Dashboard] Demo and Notifications Reset");
    };

    const handleProfileEdit = () => {
        setProfileForm({
            name: currentUser.name || '',
            age: currentUser.age || '',
            mobile: currentUser.mobile || '',
            emergencyContact: currentUser.emergencyContact || '',
            medicineTimes: currentUser.medicineTimes || '',
            address: currentUser.address || '',
            pregnancyType: currentUser.pregnancyType || '',
            relationship: currentUser.relationship || '',
            photo: currentUser.photo || '',
            hospitalName: currentUser.hospitalName || ''
        });
        setIsProfileModalOpen(true);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChatPartner) return;

        await storage.saveMessage({
            from: currentUser.email,
            to: activeChatPartner.email,
            text: newMessage,
            type: 'text'
        });
        setNewMessage('');
        const msgs = await storage.getMessages(currentUser.email, activeChatPartner.email);
        setChatMessages(msgs);
    };

    const handleChatImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeChatPartner) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            await storage.saveMessage({
                from: currentUser.email,
                to: activeChatPartner.email,
                text: reader.result,
                type: 'image'
            });
            const msgs = await storage.getMessages(currentUser.email, activeChatPartner.email);
            setChatMessages(msgs);
        };
        reader.readAsDataURL(file);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = async () => {
                    await storage.saveMessage({
                        from: currentUser.email,
                        to: activeChatPartner.email,
                        text: reader.result,
                        type: 'voice'
                    });
                    const msgs = await storage.getMessages(currentUser.email, activeChatPartner.email);
                    setChatMessages(msgs);
                };
                reader.readAsDataURL(blob);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied or not available.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleCallAction = async (type) => {
        if (!activeChatPartner) return;

        if (role === 'doctor') {
            // Doctors initiate actual call UI
            setIsCalling(true);
            setCallType(type);
            setCallStatus('ringing');

            // Log call in chat
            await storage.saveMessage({
                from: currentUser.email,
                to: activeChatPartner.email,
                text: `Started a ${type} call`,
                type: 'call_log',
                callType: type
            });
        } else {
            // Patients/Guardians send a request
            await storage.sendCallRequest(currentUser.email, activeChatPartner.email, type);
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} call request sent to doctor.`);
        }
    };

    const acceptCall = async () => {
        if (incomingCall) {
            await storage.updateMessageStatus(incomingCall.id, 'accepted');
        }
        setIsCalling(true);
        setCallType(incomingCall.callType);
        setCallStatus('connected');
        setIncomingCall(null);
    };

    const endCall = () => {
        setIsCalling(false);
        setCallStatus('idle');
        setIncomingCall(null);
    };

    const openChat = async (partner) => {
        // Privacy Check: Only allowed if connection is accepted
        const status = await storage.getConnectionStatus(currentUser.email, partner.email);
        if (status !== 'accepted') {
            alert("You can only chat once the connection request is approved.");
            return;
        }

        setActiveChatPartner(partner);
        setIsChatOpen(true);

        // Immediate UI feedback
        setUnreadMessageCount(prev => Math.max(0, prev - 1)); // Optimistic decrement if we know they have unread

        if (currentUser) {
            // Immediate UI feedback for this specific partner
            setPartnerUnreadCounts(prev => ({
                ...prev,
                [partner.email.toLowerCase()]: 0
            }));

            await storage.markMessagesAsRead(partner.email, currentUser.email);
            const msgs = await storage.getMessages(currentUser.email, partner.email);
            setChatMessages(msgs);

            // Re-fetch actual counts to be precise
            const freshCount = await storage.getUnreadMessagesCount(currentUser.email);
            setUnreadMessageCount(freshCount);
            const freshPartnerCounts = await storage.getUnreadMessagesCountPerPartner(currentUser.email);
            setPartnerUnreadCounts(freshPartnerCounts);
        }
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileForm({ ...profileForm, photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProfile = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        console.log('[Profile Save] Starting profile update...');
        console.log('[Profile Save] Current User Email:', currentUser?.email);

        // Auto-fix phone numbers: prepend '+' if missing (don't block save)
        const fixedForm = { ...profileForm };
        if (fixedForm.mobile && !fixedForm.mobile.startsWith('+')) {
            fixedForm.mobile = '+' + fixedForm.mobile.replace(/^\+*/, '');
        }
        if (fixedForm.emergencyContact && !fixedForm.emergencyContact.startsWith('+')) {
            fixedForm.emergencyContact = '+' + fixedForm.emergencyContact.replace(/^\+*/, '');
        }

        try {
            console.log('[Profile Save] Calling storage.updateProfile with:', fixedForm);
            const updatedUser = await storage.updateProfile(currentUser.email, fixedForm);
            console.log('[Profile Save] Update result:', updatedUser);
            if (updatedUser) {
                setCurrentUser(updatedUser);
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                setIsProfileModalOpen(false);

                // Send confirmation notifications via Twilio Mock
                if (fixedForm.mobile) {
                    const msg = `Hello ${fixedForm.name || 'User'}, your Maatri Shield profile has been updated successfully. Your mobile notifications are now active.`;
                    await storage.addNotification(currentUser.email, 'Profile Alert', msg);
                    twilioMock.sendSMS(fixedForm.mobile, msg);
                    twilioMock.sendWhatsApp(fixedForm.mobile, msg);
                }
                if (fixedForm.emergencyContact) {
                    // Also notify emergency contact
                    const msg2 = `Alert: You have been set as the Emergency Contact for ${fixedForm.name || 'a Maatri Shield user'}. You will receive alerts in case of clinical emergencies.`;
                    twilioMock.sendSMS(fixedForm.emergencyContact, msg2);
                    twilioMock.sendWhatsApp(fixedForm.emergencyContact, msg2);
                }

                alert('Profile updated successfully!');
            } else {
                throw new Error('Update returned no data. Please check your connection.');
            }
        } catch (err) {
            console.error('[Dashboard] Profile Update Error:', err);
            alert(`Failed to update profile: ${err.message}`);
        }
    };

    // AI Assistant Handlers
    const handleSendAiQuestion = async (e) => {
        e.preventDefault();
        if (!aiNewMessage.trim()) return;

        const originalMessage = aiNewMessage;
        const userMsg = { role: 'user', parts: [{ text: originalMessage }] };
        const updatedHistory = [...aiChatHistory, userMsg];

        setAiChatHistory(updatedHistory);
        setAiNewMessage('');
        setIsAiLoading(true);

        // Fetch Latest Vitals from storage
        const latestLog = role === 'doctor' && selectedPatient
            ? await storage.getLatestVitals(selectedPatient.email)
            : await storage.getLatestVitals(currentUser.email);

        const gestationalWeek = currentUser?.pregnancyType === '1st' ? '12-24' : '25-40';

        try {
            const aiResponseText = await getAiCareAdvice(
                latestLog,
                gestationalWeek,
                aiChatHistory, // Send existing history excluding the new message (context injection handles the current one)
                originalMessage
            );

            const botMsg = { role: 'model', parts: [{ text: aiResponseText }] };
            const finalHistory = [...updatedHistory, botMsg];
            setAiChatHistory(finalHistory);
            await storage.saveAiHistory(currentUser.email, finalHistory);
        } catch (error) {
            console.error("Dashboard AI Error:", error);
            const errorMsg = { role: 'model', parts: [{ text: "**System Error**: Something went wrong while processing your request. Please try again or refresh the page." }] };
            setAiChatHistory([...updatedHistory, errorMsg]);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleClearAiChat = async () => {
        if (window.confirm("Are you sure you want to clear your conversation with the Care Assistant?")) {
            setAiChatHistory([]);
            await storage.saveAiHistory(currentUser.email, []);
            alert("Conversation history cleared.");
        }
    };

    const handleDeleteClinicalChat = () => {
        setIsDeleteChatConfirmOpen(true);
    };

    const confirmDeleteChat = async () => {
        if (!activeChatPartner || !currentUser) return;
        await storage.clearMessages(currentUser.email, activeChatPartner.email);
        setChatMessages([]);
        setConnectedPartners(prev => prev.filter(p => p.email !== activeChatPartner.email));
        setIsDeleteChatConfirmOpen(false);
        setIsChatOpen(false);
        setActiveChatPartner(null);
    };

    const handleDeleteMessage = async (messageId) => {
        // Optimistically remove from UI first for instant feedback
        setChatMessages(prev => prev.filter(m => m.id !== messageId));
        // Then delete from storage
        await storage.deleteMessage(messageId);
    };

    // --- Health Profile Handlers ---
    const handleOpenHealthProfile = async () => {
        if (!currentUser) return;
        const profile = await storage.getHealthProfile(currentUser.email);
        if (profile) {
            setHealthProfileForm({
                weight: profile.weight || '',
                height: profile.height || '',
                bloodType: profile.blood_type || '',
                currentConditions: profile.current_conditions || [],
                pastConditions: profile.past_conditions || '',
                allergies: profile.allergies || '',
                currentMedications: profile.current_medications || '',
                notes: profile.notes || ''
            });
        }
        setIsHealthProfileOpen(true);
    };

    const handleSaveHealthProfile = async (e) => {
        e.preventDefault();
        setIsSavingHealthProfile(true);
        await storage.saveHealthProfile(currentUser.email, healthProfileForm);
        setIsSavingHealthProfile(false);
        setIsHealthProfileOpen(false);
    };

    const toggleCondition = (condition) => {
        setHealthProfileForm(prev => ({
            ...prev,
            currentConditions: prev.currentConditions.includes(condition)
                ? prev.currentConditions.filter(c => c !== condition)
                : [...prev.currentConditions, condition]
        }));
    };

    const handleSelectPatient = async (patient) => {
        console.log("Patient Selected:", patient.email);
        setSelectedPatient(patient);
        updateDashboardData(role, patient);

        // Fetch reports if on reports tab
        if (role === 'doctor' && activeTab === 'reports') {
            const reports = await storage.getClinicalReports(patient.email);
            setPatientReports(reports);
        }

        if (role === 'doctor' && activeTab !== 'reports') {
            // Also load the patient's health profile for the doctor to view
            const hp = await storage.getHealthProfile(patient.email);
            setPatientHealthProfiles(prev => ({ ...prev, [patient.email]: hp }));
            setIsPatientModalOpen(true);
        }
    };


    const handleLinkPatient = async (e) => {
        e.preventDefault();
        const emailInput = e.target.email.value.trim().toLowerCase();

        // Verify email belongs to a registered patient
        const patient = await storage.getPatientByEmail(emailInput);
        if (!patient) {
            alert("Patient not found. Ensure the email is correct and the account is registered as a Patient.");
            return;
        }

        // Send connection request using the existing connection system
        const sent = await storage.sendConnectionRequest(currentUser.email, emailInput);
        if (sent) {
            setGuardianConnectionStatus('pending');
            setGuardianPatientEmail(emailInput);
            setStats([
                { label: "Request Sent", value: "Pending", status: "Awaiting approval", color: "text-amber-400" },
                { label: "Risk Level", value: "--", status: "No access yet", color: "text-slate-400" },
                { label: "Connection", value: "Pending", status: "Waiting", color: "text-amber-400" },
            ]);
            setAlert(`Request sent to ${patient.name || emailInput}. You can view their data once they approve.`);
            e.target.reset();
        } else {
            alert("Failed to send connection request. You may have already sent one.");
        }
    };

    const handleSaveLog = async (e) => {
        e.preventDefault();
        console.log('[Dashboard] Attempting to save log:', logForm);
        try {
            await storage.saveLog(currentUser.email, logForm);
            console.log('[Dashboard] Log saved successfully, updating UI...');
            await updateDashboardData('patient', currentUser);
            setIsLogModalOpen(false);
            setLogForm({ heartRate: '', systolic: '', diastolic: '', glucose: '', symptoms: '' });
            alert("Thank you for caring. Health log saved and synced successfully!");
        } catch (err) {
            console.error('[Dashboard] Error in handleSaveLog:', err);
            alert(`Failed to save log: ${err.message || 'Unknown error'}`);
        }
    };

    const handleViewDoctorDetails = (doctor) => {
        setSelectedViewDoctor(doctor);
        setIsDoctorModalOpen(true);
    };

    const handleRemovePatient = async (patientEmail) => {
        if (window.confirm("Are you sure you want to remove this patient? They will no longer be able to share data with you.")) {
            await storage.removeConnection(currentUser.email, patientEmail);
            // Refresh patient list
            const authorizedPatients = await storage.getAuthorizedPatients(currentUser.email);
            setPatients(authorizedPatients);

            // Handle selection clearing if the active patient was removed
            if (selectedPatient && selectedPatient.email === patientEmail) {
                if (authorizedPatients.length > 0) {
                    setSelectedPatient(authorizedPatients[0]);
                    await updateDashboardData('doctor', authorizedPatients[0]);
                } else {
                    setSelectedPatient(null);
                    setStats([
                        { label: "Connected Patients", value: "0", status: "Await follow", color: "text-slate-400" },
                        { label: "Critical Alerts", value: "0", status: "All clear", color: "text-green-500" },
                        { label: "Pending Requests", value: "0", status: "Incoming", color: "text-slate-400" },
                    ]);
                    setAlert("Access restricted. Patients must accept your follow request before you can view their data.");
                }
            }
        }
    };

    const handleGenerateReport = async () => {
        const targetUser = role === 'doctor' ? selectedPatient : currentUser;

        if (!targetUser) {
            alert(role === 'doctor' ? "Digital Scribe: Please select a patient in the list first." : "Digital Scribe: Profile error.");
            return;
        }

        console.log("Generating report for:", targetUser.email);
        setIsGeneratingReport(true);
        try {
            console.log("Clinical Scribe: Fetching logs...");
            const allLogs = await storage.getLogs(targetUser.email);

            // Filter only last 7 days for "Weekly" report
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weeklyLogs = allLogs.filter(log => new Date(log.timestamp) > weekAgo);

            console.log(`Clinical Scribe: Found ${weeklyLogs.length} logs from the last 7 days.`);

            console.log("Clinical Scribe: Fetching chat history...");
            // For doctor: chat between doctor and patient
            // For patient: chat with all doctors
            let doctorChat = [];
            if (role === 'doctor') {
                doctorChat = await storage.getMessages(currentUser.email, targetUser.email);
            } else {
                // If patient is generating, get chats with all connected doctors for full context
                const partners = await storage.getConnectedDoctors(targetUser.email);
                for (const partner of partners) {
                    const msgs = await storage.getMessages(targetUser.email, partner.email);
                    doctorChat = [...doctorChat, ...msgs];
                }
            }
            console.log(`Clinical Scribe: Found ${doctorChat.length} clinical messages.`);

            console.log("Clinical Scribe: Fetching patient AI history...");
            const patientAiHistory = await storage.getAiHistory(targetUser.email);
            console.log(`Clinical Scribe: Found ${patientAiHistory.length} AI interaction logs.`);

            if (weeklyLogs.length === 0 && doctorChat.length === 0 && patientAiHistory.length === 0) {
                console.warn("Clinical Scribe: No data found for the last 7 days.");
                alert("The AI service needs at least some clinical data (vitals, chat, or AI history) to generate a report. Please ensure there are logs or messages from the last week.");
                return;
            }

            console.log(`Clinical Scribe: Requesting AI report (S.O.A.P Analysis)...`);
            const report = await generateWeeklyClinicalReport(weeklyLogs, doctorChat, patientAiHistory, (role === 'doctor' ? currentUser.email : 'ANY'));

            if (report && report.length > 10) {
                console.log("Clinical Scribe: Report generated successfully.");
                setReportContent(report);
                setSelectedReportTimestamp(new Date().toISOString());

                // Save report to history
                await storage.saveClinicalReport(targetUser.email, report);

                // Refresh reports list if current target
                if (role === 'patient' || (selectedPatient && selectedPatient.email === targetUser.email)) {
                    const reports = await storage.getClinicalReports(targetUser.email);
                    setPatientReports(reports);
                }

                setIsReportModalOpen(true);
            } else {
                console.error("Clinical Scribe: AI returned empty or too short report.", report);
                alert("The AI service returned an incomplete report. This can happen if the clinical context is too sparse. Try adding more detail to the patient logs.");
            }
        } catch (error) {
            console.error("Dashboard Trigger Error:", error);
            alert("Digital Scribe Error: " + (error.message || "Unknown error"));
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleDownloadReport = () => {
        if (!reportContent) return;
        const element = document.createElement("a");
        const file = new Blob([reportContent], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        const targetName = role === 'doctor' ? selectedPatient?.name : currentUser?.name;
        element.download = `Clinical_Report_${targetName?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        if (!selectedPatient) return;

        try {
            const appointment = await storage.saveAppointment(
                currentUser.email,
                selectedPatient.email,
                `${appointmentForm.date}T${appointmentForm.time}`,
                appointmentForm.reason
            );

            if (appointment) {
                // Refresh appointments list
                const updatedAppointments = await storage.getAppointments(currentUser.email, role);
                setAppointments(updatedAppointments);

                setIsAppointmentModalOpen(false);
                setAppointmentForm({ date: '', time: '', reason: '' });

                // Send automated chat message
                const chatMsg = `New Appointment Scheduled:\nDate: ${appointmentForm.date}\nTime: ${appointmentForm.time}\nReason: ${appointmentForm.reason}\n\nPlease be prepared for the consultation.`;
                await storage.saveMessage({
                    from: currentUser.email,
                    to: selectedPatient.email,
                    text: chatMsg,
                    type: 'text',
                    status: 'sent'
                });

                // Send In-App Notification
                await storage.addNotification(
                    selectedPatient.email,
                    'Clinical Alert',
                    `Your doctor has scheduled an appointment for ${appointmentForm.date} at ${appointmentForm.time}.`
                );

                // Send External Telegram/SMS alert
                if (selectedPatient.mobile) {
                    const smsMsg = `MaatriShield Alert: Dr. ${currentUser.name} scheduled an appointment on ${appointmentForm.date} at ${appointmentForm.time}. Reason: ${appointmentForm.reason}.`;
                    twilioMock.sendSMS(selectedPatient.mobile, smsMsg);
                    twilioMock.sendWhatsApp(selectedPatient.mobile, smsMsg); // Sends via telegram actually
                }

                alert('Appointment scheduled successfully and notifications sent!');
            }
        } catch (error) {
            console.error('Error booking appointment:', error);
            alert('Failed to book appointment.');
        }
    };


    return (
        <div className="min-h-screen bg-white flex font-sans relative overflow-x-hidden text-slate-900">
            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={`fixed w-64 bg-[#0f172a] h-screen flex flex-col py-8 px-4 z-50 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-[4px_0_24px_rgba(0,0,0,0.15)] border-r border-white/5`}>
                <div className="py-1 flex flex-col items-center gap-1 mb-8 text-center select-none shrink-0 border-b border-white/5 pb-6">
                    <div className="relative w-20 h-20 mb-2 group">
                        <img 
                            src={logo} 
                            alt="Maatri Shield" 
                            className="w-full h-full object-contain filter brightness-110 contrast-125 mix-blend-screen transition-all duration-500 group-hover:scale-110" 
                        />
                    </div>
                    <span className="hidden md:block font-black text-[11px] uppercase tracking-[0.6em] text-slate-400 transition-colors group-hover:text-brand-400">Maatri Shield</span>
                </div>

                {/* Emergency SOS Button */}
                {(role === 'patient' || role === 'guardian') && (
                    <div className="px-1 mb-3">
                        <button
                            onClick={handleSOS}
                            className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[9px] transition-all shadow-2xl relative overflow-hidden group ${isSOSTriggered
                                ? 'bg-red-600 text-white animate-pulse'
                                : 'bg-gradient-to-br from-red-500 via-rose-600 to-red-700 text-white hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(225,29,72,0.4)] border border-white/10'}`}
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <AlertTriangle size={16} className={`relative z-10 ${isSOSTriggered ? 'animate-bounce' : ''}`} />
                            <span className="hidden md:block relative z-10 text-[10px]">Emergency SOS</span>
                        </button>
                    </div>
                )}

                <nav className="flex-1 space-y-3 px-1 overflow-hidden">
                    {[
                        { id: 'overview', icon: Activity, label: "Overview" },
                        ...(role === 'doctor' ? [
                            { id: 'patients-list', icon: UsersIcon, label: "Patients List" },
                            { id: 'reports', icon: Download, label: "Reports" }
                        ] : []),
                        ...(role === 'patient' || role === 'guardian' ? [
                            { id: 'reports', icon: Download, label: "My Reports" }
                        ] : []),
                        { id: 'analytics', icon: TrendingUp, label: "Analytics" },
                        { id: 'chat', icon: MessageSquare, label: "Messages" },
                        ...(role === 'patient' || role === 'guardian' ? [
                            { id: 'find-doctors', icon: UsersIcon, label: "Find Doctors" },
                            { id: 'calendar', icon: Calendar, label: "Calendar" }
                        ] : []),
                        { id: 'notifications', icon: Bell, label: "Notifications" },
                        { id: 'settings', icon: Settings, label: "Settings" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (item.id === 'notifications') {
                                    setClinicalNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                    if (currentUser) storage.markNotificationsAsRead(currentUser.email);
                                }
                                if (item.id === 'patients-list') setPatientFilter('all');
                                if (['reports', 'find-doctors'].includes(item.id) && role === 'doctor') {
                                    setSelectedPatient(null);
                                }
                            }}
                            className={`flex items-center gap-3.5 w-full p-3.5 rounded-xl transition-all duration-300 group relative ${activeTab === item.id
                                ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <item.icon size={22} className={activeTab === item.id ? 'text-brand-400 group-hover:scale-110 transition-transform' : 'text-slate-500 group-hover:text-slate-300'} />
                            <span className="hidden md:block text-[15px] font-bold tracking-tight">{item.label}</span>
                            {activeTab === item.id && (
                                <motion.div layoutId="activeNav" className="absolute left-[-4px] w-1 h-5 bg-brand-500 rounded-r-full shadow-[2px_0_10px_rgba(99,102,241,0.8)]" />
                            )}
                            {item.id === 'notifications' && clinicalNotifications.filter(n => !n.read && (role !== 'doctor' || n.type !== 'water')).length > 0 && (
                                <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse"></span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto px-1 pt-6 border-t border-white/5">
                    {role === 'doctor' && (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 shadow-2xl relative overflow-hidden group transition-all duration-500 hover:shadow-brand-500/10">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-400 border border-white/10">
                                    <Shield size={16} />
                                </div>
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Clinical Intelligence</p>
                            </div>
                            <div className="flex items-end justify-between relative z-10">
                                <div>
                                    <h4 className="text-2xl font-black text-white tabular-nums">98.4<span className="text-[10px] text-slate-400 ml-1">%</span></h4>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">System Precision</p>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-teal-500/10 rounded-lg border border-teal-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></div>
                                    <span className="text-[8px] font-black text-teal-400 uppercase tracking-widest">Live</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content - Added ml-64 to compensate for fixed sidebar */}
            <main 
                className={`flex-1 min-w-0 transition-all duration-500 p-4 lg:p-8 lg:ml-64 min-h-screen relative overflow-x-hidden bg-cover bg-fixed bg-center`}
                style={{ backgroundImage: "url('/dashboard_bg.png')" }}
            >
                <div className="absolute inset-0 bg-white/20 pointer-events-none"></div>

                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-500/5 rounded-full blur-[40px] -mr-80 -mt-80 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[40px] -ml-60 -mb-60 pointer-events-none"></div>
                
                <header className="flex justify-between items-center mb-8 gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 bg-slate-100 rounded-xl text-slate-600 shadow-sm"
                        >
                            <Zap size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-[#000000] capitalize">{role} <span className="text-[#000000]">Command Center</span></h1>
                            <div className="text-slate-500 mt-1 flex items-center flex-wrap gap-2 text-xs md:text-sm">
                            {role === 'doctor' ? `Overseeing ${patients.length} patients` :
                                role === 'guardian' ? (selectedPatient ? `Monitoring ${selectedPatient.name}` : "Connect to a patient") :
                                    <>
                                        {logs.length === 0 ? (
                                            <motion.span
                                                key="welcome-quote"
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.6 }}
                                                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-brand-50 to-purple-50 text-brand-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-brand-100 shadow-sm"
                                            >
                                                Welcome, {currentUser?.name?.split(' ')[0] || 'Mama'}! Every journey starts with one step.
                                            </motion.span>
                                        ) : (
                                            <>
                                                <span>Your daily health overview.</span>
                                                <motion.span
                                                    initial={{ opacity: 0.8, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
                                                    className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-purple-200 shadow-sm"
                                                >
                                                    A mother's care shapes Tomorrow
                                                </motion.span>
                                            </>
                                        )}
                                    </>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 relative">
                        <CloudStatus />
                        {role === 'patient' && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsLogModalOpen(true)} className="btn-primary flex items-center gap-2 py-2 px-4 shadow-brand-100">
                                    <Plus size={20} /> <span>Add Log</span>
                                </button>
                                <button onClick={handleOpenHealthProfile} className="flex items-center gap-2 py-2 px-4 bg-white border border-brand-200 text-brand-700 rounded-2xl font-bold text-sm hover:bg-brand-50 transition-all shadow-sm">
                                    <Heart size={18} /> <span>Health Profile</span>
                                </button>
                            </div>
                        )}
                        {role === 'guardian' && !currentUser?.linkedPatientEmail && (
                            <form onSubmit={handleLinkPatient} className="flex gap-2">
                                <input type="email" name="email" placeholder="Patient's Email" className="input-field py-2 text-sm max-w-[200px]" required />
                                <button type="submit" className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
                                    <Search size={16} /> Link
                                </button>
                            </form>
                        )}
                        <div className="hidden md:block text-right">
                            <p className="font-bold">{currentUser?.name || currentUser?.email?.split('@')[0] || 'User'}</p>
                            <p className="text-xs text-slate-400 capitalize">{role}</p>
                        </div>

                        <div className="flex items-center gap-6">
                            {(role === 'patient' || role === 'doctor') && (
                                <div className="relative group">
                                    <button
                                        onClick={() => {
                                            setShowRequestsDropdown(!showRequestsDropdown);
                                            setActiveTab('overview');
                                        }}
                                        className={`p-4 bg-white/50 backdrop-blur-sm rounded-2xl text-slate-400 hover:text-brand-600 hover:bg-white transition-all border border-slate-200 shadow-sm relative ${pendingRequests.length > 0 ? 'animate-pulse text-brand-500 border-brand-200' : ''}`}
                                    >
                                        <UserPlus size={24} />
                                        {pendingRequests.length > 0 && (
                                            <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
                                                {pendingRequests.length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            )}
                            <div className="relative group">
                                <button
                                    onClick={async () => {
                                        setActiveTab('notifications');
                                        setShowRequestsDropdown(false);
                                        setClinicalNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                        if (currentUser) await storage.markNotificationsAsRead(currentUser.email);
                                    }}
                                    className={`p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-brand-600 hover:shadow-xl hover:shadow-brand-500/10 transition-all relative ${clinicalNotifications.some(n => !n.read) ? 'text-brand-500 border-brand-200' : ''}`}
                                >
                                    <Bell size={24} />
                                    {clinicalNotifications.filter(n => !n.read && (role !== 'doctor' || n.type !== 'water')).length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-white shadow-lg shadow-rose-500/20">
                                            {clinicalNotifications.filter(n => !n.read && (role !== 'doctor' || n.type !== 'water')).length}
                                        </span>
                                    )}
                                </button>
                            </div>
                            <AnimatePresence>
                                {showRequestsDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowRequestsDropdown(false)}></div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-12 w-80 glass p-4 rounded-3xl shadow-2xl z-50 border border-white/40 backdrop-blur-sm"
                                        >
                                            <h4 className="text-sm font-black text-slate-900 mb-4 px-2 flex justify-between items-center">
                                                Pending Requests
                                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                                            </h4>

                                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                {pendingRequests.length > 0 && (
                                                    <div className="pb-2 border-b border-slate-100 mb-2">
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 px-2">Clinical Requests</p>
                                                        {pendingRequests.map(req => {
                                                            const senderName = req.senderName || 'Loading...';
                                                            return (
                                                                <div key={req.id} className="bg-white/50 p-3 rounded-2xl border border-white/50 flex items-center gap-3 mb-2">
                                                                    <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                                                                        {senderName[0]?.toUpperCase()}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs font-bold text-slate-800 truncate">{senderName}</p>
                                                                        <p className="text-[10px] text-slate-400 truncate">{req?.from_email}</p>
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        <button onClick={() => handleRequestAction(req.id, 'accepted')} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"><Plus size={14} /></button>
                                                                        <button onClick={() => handleRequestAction(req.id, 'rejected')} className="p-1.5 bg-slate-200 text-slate-500 rounded-lg hover:bg-slate-300 transition-colors"><LogOut size={14} className="rotate-90" /></button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {clinicalNotifications.filter(n => !n.read).length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 px-2">Health Reminders</p>
                                                        {clinicalNotifications.filter(n => !n.read).slice(0, 3).map(note => (
                                                            <div key={note.id} className="bg-brand-50/50 p-3 rounded-2xl border border-brand-100 flex items-center gap-3">
                                                                <div className="p-2 bg-brand-100 text-brand-600 rounded-xl">
                                                                    {note.type === 'water' ? <Droplets size={14} /> : <Activity size={14} />}
                                                                </div>
                                                                <p className="text-xs font-bold text-slate-700 leading-tight">{note.message}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {pendingRequests.length === 0 && clinicalNotifications.filter(n => !n.read).length === 0 && (
                                                    <div className="py-8 text-center text-slate-400">
                                                        <Activity className="mx-auto mb-2 opacity-10" size={32} />
                                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-300">All caught up</p>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => { setShowRequestsDropdown(false); setActiveTab('notifications'); }}
                                                className="w-full mt-4 py-2 text-[10px] font-black uppercase tracking-widest text-brand-600 hover:text-brand-700 transition-colors"
                                            >
                                                View All Notifications
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Interactive Avatar Button */}
                        <button
                            onClick={() => setShowQuickProfile(!showQuickProfile)}
                            className={`w-12 h-12 rounded-full border-2 border-white flex items-center justify-center font-bold text-white shadow-md transition-all hover:scale-110 active:scale-95 overflow-hidden ring-offset-2 hover:ring-2 ${role === 'doctor' ? 'bg-blue-600 ring-blue-100' :
                                role === 'guardian' ? 'bg-purple-600 ring-purple-100' :
                                    'bg-brand-600 ring-brand-100'
                                }`}
                        >
                            {currentUser?.photo ? (
                                <img src={currentUser.photo} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                currentUser?.name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U'
                            )}
                        </button>

                        {/* Quick Profile Dropdown */}
                        <AnimatePresence>
                            {showQuickProfile && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowQuickProfile(false)}></div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-16 w-64 glass p-4 rounded-2xl shadow-xl z-50 border border-white/40 backdrop-blur-sm"
                                    >
                                        <div className="flex flex-col items-center mb-4">
                                            <div className={`w-14 h-14 rounded-2xl mb-3 border-2 border-white shadow-md flex items-center justify-center text-white text-xl font-bold overflow-hidden ${role === 'doctor' ? 'bg-blue-600' :
                                                role === 'guardian' ? 'bg-purple-600' :
                                                    'bg-brand-600'
                                                }`}>
                                                {currentUser?.photo ? (
                                                    <img src={currentUser.photo} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    currentUser?.name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U'
                                                )}
                                            </div>
                                            <h3 className="font-bold text-base text-slate-900 leading-tight">{currentUser?.name || 'User'}</h3>
                                            <p className="text-slate-400 text-[9px] uppercase font-bold tracking-widest mt-0.5">{role}</p>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            {role === 'doctor' && currentUser?.hospitalName && (
                                                <div className="bg-brand-50/50 p-2.5 rounded-xl border border-brand-100">
                                                    <p className="text-[8px] text-brand-600 uppercase font-black mb-0.5">Clinic / Hospital</p>
                                                    <p className="text-xs font-bold text-slate-800">{currentUser?.hospitalName || 'Clinical Facility'}</p>
                                                </div>
                                            )}
                                            <div className="bg-slate-50/50 p-2.5 rounded-xl border border-white/50">
                                                <p className="text-[8px] text-slate-400 uppercase font-black mb-0.5">Email</p>
                                                <p className="text-xs font-bold text-slate-700 truncate">{currentUser?.email || '...'}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setActiveTab('settings');
                                                // handleProfileEdit(); // Removed modal trigger
                                                setShowQuickProfile(false);
                                            }}
                                            className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold text-xs hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 flex items-center justify-center gap-2"
                                        >
                                            <Edit size={14} /> User Settings
                                        </button>

                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </header >

                {activeTab === 'find-doctors' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Connect with Doctors</h2>
                            <p className="text-slate-500 text-sm">Search by Name, Hospital, or Mobile Number.</p>
                        </div>

                        <div className="relative group max-w-xl">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search e.g. 'City Life Hospital'..."
                                className="w-full pl-14 pr-5 py-4 bg-white rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 shadow-sm transition-all text-base font-medium"
                                value={doctorSearchQuery}
                                onChange={(e) => handleDoctorSearch(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {doctorSearchResults.length > 0 ? (
                                doctorSearchResults.map(doc => {
                                    const status = searchStatuses[doc.email];
                                    return (
                                        <motion.div
                                            key={doc.email}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white/40 backdrop-blur-sm p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer border border-white/40 hover:border-brand-300 hover:bg-white/60 transition-all hover:shadow-2xl hover:shadow-brand-500/5 group"
                                            onClick={() => handleViewDoctorDetails(doc)}
                                        >
                                            <div className="w-20 h-20 rounded-2xl bg-blue-100 border-4 border-white shadow-md mb-3 flex items-center justify-center text-blue-600 text-2xl font-black overflow-hidden uppercase">
                                                {doc.photo ? <img src={doc.photo} alt={doc.name} className="w-full h-full object-cover" /> : (doc.name?.[0] || 'D')}
                                            </div>
                                            <h4 className="font-black text-base text-slate-900 leading-tight group-hover:text-brand-600 transition-colors">{doc.name}</h4>
                                            <p className="text-[9px] text-brand-600 font-bold uppercase tracking-widest mt-1 mb-2">{doc.hospitalName || 'Independent Practice'}</p>

                                            <div className="w-full space-y-2 mb-4 text-xs">
                                                <div className="flex justify-between px-1 text-slate-400 font-bold uppercase text-[8px]">
                                                    <span>View Profile</span>
                                                    <span className="text-brand-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Details <ChevronRight size={8} /></span>
                                                </div>
                                            </div>

                                            {status === 'accepted' ? (
                                                <div className="w-full py-3 bg-green-50 text-green-600 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2">
                                                    <Heart size={16} fill="currentColor" /> Medical Partner
                                                </div>
                                            ) : status === 'pending' ? (
                                                <div className="w-full py-3 bg-orange-50 text-orange-600 rounded-2xl font-black text-sm uppercase">
                                                    Request Pending
                                                </div>
                                            ) : (
                                                <div className="w-full py-3.5 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-2">
                                                    <Activity size={16} /> Connect & Share
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })
                            ) : doctorSearchQuery ? (
                                <div className="col-span-full py-20 text-center">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <Search size={40} />
                                    </div>
                                    <p className="text-slate-400 font-bold text-lg">No doctors found matching "{doctorSearchQuery}"</p>
                                    <p className="text-slate-300 text-sm">Try searching by mobile number or hospital name.</p>
                                </div>
                            ) : (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
                                    <Activity className="mx-auto mb-4 text-slate-200" size={48} />
                                    <p className="text-slate-400 font-bold">Start typing to find medical professionals</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {
                    activeTab === 'chat' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Messages</h2>
                                    <p className="text-slate-500 text-sm">Clinical care team and patient connectivity.</p>
                                </div>
                                <div className="relative group w-full md:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search clinical DMs..."
                                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-50 focus:border-brand-500 transition-all text-sm font-medium"
                                        value={chatSearchQuery}
                                        onChange={(e) => setChatSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 shadow-xl shadow-brand-500/5 overflow-hidden">
                                <div className="divide-y divide-slate-50">
                                    {connectedPartners
                                        .filter(p => p.name.toLowerCase().includes(chatSearchQuery.toLowerCase()))
                                        .map(partner => (
                                            <motion.div
                                                key={partner.email}
                                                className="p-6 flex items-center gap-5 cursor-pointer group transition-all hover:bg-white/20"
                                                onClick={() => openChat(partner)}
                                            >
                                                <div className="relative shrink-0">
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black border-2 transition-transform group-hover:scale-105 overflow-hidden ${partner.role === 'doctor' ? 'bg-blue-600 border-white/40' : 'bg-brand-600 border-white/40'}`}>
                                                        {partner.photo ? <img src={partner.photo} alt={partner.name} className="w-full h-full object-cover" /> : (partner.name?.[0] || 'P')}
                                                    </div>
                                                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-white"></div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">{partner.name}</h3>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Active now</span>
                                                    </div>
                                                    <p className="text-slate-500 text-sm truncate pr-10">
                                                        {partner.role === 'doctor' ? partner.hospitalName || 'Clinical Specialist' : `${partner.pregnancyType} Stage • Age ${partner.age}`}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="p-3 bg-white/20 text-slate-400 rounded-2xl hover:text-brand-600 hover:bg-white/40 transition-all">
                                                        <Camera size={20} />
                                                    </div>
                                                    <div className="p-3 bg-brand-600 text-white rounded-2xl shadow-lg shadow-brand-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                                        <ChevronRight size={20} />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    }
                                </div>

                                {connectedPartners.length === 0 && (
                                    <div className="py-24 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                                            <MessageSquare size={40} />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 mb-1">No active conversations</h4>
                                        <p className="text-slate-500 text-sm max-w-sm mx-auto">
                                            {role === 'doctor' ? "Accept patient data sharing requests to start chatting." : "Find clinical specialists to start your care journey."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )
                }

                {
                    activeTab === 'calendar' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-6xl mx-auto space-y-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">My Appointments</h2>
                                    <p className="text-slate-500 font-medium">Manage and view your upcoming clinical visits.</p>
                                </div>
                                <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex gap-2">
                                    <button className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold transition-all">Calendar View</button>
                                    <button className="px-6 py-2.5 bg-slate-50 text-slate-400 rounded-xl font-bold hover:text-slate-600 transition-all">List View</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                 {/* Large Calendar View */}
                                <div className="lg:col-span-2 bg-white/40 backdrop-blur-sm p-6 rounded-3xl shadow-2xl shadow-indigo-100/10 border border-white/60">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-2xl font-black text-slate-800">
                                            {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                        </h3>
                                        <div className="flex gap-3">
                                            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-3 bg-white rounded-2xl border border-slate-100 hover:border-brand-300 transition-all shadow-sm">
                                                <ChevronRight size={20} className="rotate-180" />
                                            </button>
                                            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-3 bg-white rounded-2xl border border-slate-100 hover:border-brand-300 transition-all shadow-sm">
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-4 text-center mb-6">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                            <div key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{day}</div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-4">
                                        {generateCalendarDays().map((day, i) => {
                                            const hasAppointment = day && appointments.some(app => new Date(app.appointment_time).toDateString() === day.toDateString());
                                            const isToday = day && day.toDateString() === new Date().toDateString();

                                            return (
                                                <div
                                                    key={i}
                                                    className={`aspect-square rounded-3xl border transition-all flex flex-col items-center justify-center relative p-2
                                                        ${!day ? 'invisible' : ''}
                                                        ${isToday ? 'bg-brand-50 border-brand-200' : 'bg-white border-slate-50 hover:border-brand-100'}
                                                    `}
                                                >
                                                    <span className={`text-lg font-black ${isToday ? 'text-brand-600' : 'text-slate-700'}`}>{day?.getDate()}</span>
                                                    {hasAppointment && (
                                                        <div className="mt-1 w-2 h-2 rounded-full bg-brand-500 shadow-lg shadow-brand-100 animate-pulse"></div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Appointment Quick List */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="text-brand-600" size={16} /> Upcoming Visits
                                    </h4>
                                    {appointments.length > 0 ? (
                                        <div className="space-y-4">
                                            {appointments
                                                .filter(app => new Date(app.appointment_time) >= new Date())
                                                .map((app, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="bg-white/40 backdrop-blur-sm p-6 rounded-3xl border-l-[6px] border-teal-500 shadow-xl shadow-teal-500/5"
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Clinic Visit</p>
                                                                <p className="font-extrabold text-slate-800">
                                                                    {new Date(app.appointment_time).toLocaleDateString('default', { month: 'short', day: 'numeric' })} at {new Date(app.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="p-3 bg-slate-50 text-xs text-slate-600 italic rounded-xl">
                                                            "{app.reason}"
                                                        </div>
                                                    </motion.div>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50/50 p-8 rounded-2xl border-2 border-dashed border-slate-100 text-center">
                                            <p className="text-slate-400 text-sm font-bold">No upcoming appointments scheduled.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                }

                {
                    activeTab === 'notifications' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Clinical Notifications</h2>
                                    <p className="text-slate-500 font-medium">Categorized health reminders and clinical alerts</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        await storage.deleteReadNotifications(currentUser.email);
                                        const updated = await storage.getNotifications(currentUser.email);
                                        setClinicalNotifications(updated);
                                    }}
                                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Clear all seen
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="space-y-4">
                                    {clinicalNotifications.length > 0 ? (
                                        clinicalNotifications.filter(n => role !== 'doctor' || n.type !== 'water').map((n) => (
                                            <motion.div
                                                key={n.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`p-6 rounded-3xl border shadow-sm transition-all flex items-start gap-4 ${n.type === 'SOS'
                                                    ? 'bg-rose-50 border-rose-200'
                                                    : (n.type === 'water' || n.type === 'medicine')
                                                        ? 'bg-[#DBBCDF]/20 border-[#DBBCDF]/30'
                                                        : 'bg-white border-slate-100 hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className={`p-3 rounded-2xl flex-shrink-0 ${n.type === 'SOS'
                                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                                                    : (n.type === 'water' || n.type === 'medicine')
                                                        ? 'bg-[#DBBCDF] text-white shadow-lg shadow-indigo-100'
                                                        : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    {n.type === 'SOS' ? <AlertTriangle size={20} className="animate-pulse" /> :
                                                        n.type === 'water' ? <Droplets size={20} /> :
                                                            n.type === 'medicine' ? <Activity size={20} /> :
                                                                <Bell size={20} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className={`text-xs font-black uppercase tracking-widest ${n.type === 'SOS' ? 'text-rose-600' : 'text-slate-400'}`}>
                                                            {n.type} Alert
                                                        </p>
                                                        <span className="text-[10px] font-bold text-slate-300">
                                                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm font-bold leading-relaxed ${n.type === 'SOS' ? 'text-rose-900' : 'text-slate-800'}`}>
                                                        {n.message}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center bg-white/20 backdrop-blur-sm rounded-3xl border-2 border-dashed border-white/20">
                                            <Bell size={48} className="mx-auto mb-4 text-slate-100" />
                                            <p className="text-slate-400 font-bold">No clinical notifications found.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="glass p-8 rounded-3xl w-64 bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-2xl shadow-brand-200">
                                        <h3 className="text-xl font-black mb-4">Care Instructions</h3>
                                        <div className="space-y-4 text-sm font-medium text-brand-50 opacity-90">
                                            <div className="flex gap-3">
                                                <div className="w-2 h-2 rounded-full bg-white mt-1.5 shrink-0"></div>
                                                <p>Maintain your 2-hourly water intake for optimal hydration.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="w-2 h-2 rounded-full bg-white mt-1.5 shrink-0"></div>
                                                <p>Notifications will appear here when your doctor sets a medicine schedule.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div >
                        </motion.div >
                    )
                }

                {
                    activeTab === 'overview' && (
                        <>                            {role === 'doctor' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div
                                            onClick={() => { setPatientFilter('urgent'); setActiveTab('patients-list'); }}
                                            className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/60 shadow-xl shadow-rose-500/5 cursor-pointer hover:shadow-2xl hover:bg-white/80 transition-all duration-300 group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50 rounded-full -mr-10 -mt-10 opacity-40 group-hover:scale-125 transition-transform duration-500"></div>
                                            <div className="flex items-center gap-3 mb-4 relative z-10">
                                                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                                                    <AlertTriangle size={18} />
                                                </div>
                                                <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">Critical Care</p>
                                            </div>
                                            <h4 className="text-4xl font-black text-slate-900 mb-1 relative z-10 tabular-nums">{riskStats.high}</h4>
                                            <p className="text-xs text-slate-400 font-bold relative z-10">High Priority Cases</p>
                                        </div>
                                        <div
                                            onClick={() => { setPatientFilter('help'); setActiveTab('patients-list'); }}
                                            className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/60 shadow-xl shadow-amber-500/5 cursor-pointer hover:shadow-2xl hover:bg-white/80 transition-all duration-300 group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-full -mr-10 -mt-10 opacity-40 group-hover:scale-125 transition-transform duration-500"></div>
                                            <div className="flex items-center gap-3 mb-4 relative z-10">
                                                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                                                    <Activity size={18} />
                                                </div>
                                                <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Clinical Review</p>
                                            </div>
                                            <h4 className="text-4xl font-black text-slate-900 mb-1 relative z-10 tabular-nums">{riskStats.medium}</h4>
                                            <p className="text-xs text-slate-400 font-bold relative z-10">Moderate Monitoring</p>
                                        </div>
                                        <div
                                            onClick={() => { setPatientFilter('normal'); setActiveTab('patients-list'); }}
                                            className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/60 shadow-xl shadow-teal-500/5 cursor-pointer hover:shadow-2xl hover:bg-white/80 transition-all duration-300 group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-teal-50 rounded-full -mr-10 -mt-10 opacity-40 group-hover:scale-125 transition-transform duration-500"></div>
                                            <div className="flex items-center gap-3 mb-4 relative z-10">
                                                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-500">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                                <p className="text-[10px] text-teal-500 font-black uppercase tracking-widest">Optimal Stability</p>
                                            </div>
                                            <h4 className="text-4xl font-black text-slate-900 mb-1 relative z-10 tabular-nums">{riskStats.low}</h4>
                                            <p className="text-xs text-slate-400 font-bold relative z-10">Low Risk Registry</p>
                                        </div>
                                    </div>

                                    <div className="bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col xl:flex-row items-center gap-6 relative overflow-hidden">
                                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -mr-16 -mb-16 blur-3xl"></div>
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-teal-400 border border-white/10 relative z-10">
                                            <Sparkles size={26} className="animate-pulse" />
                                        </div>
                                        <div className="flex-1 text-center xl:text-left relative z-10">
                                            <h3 className="text-xl font-black text-white mb-1 tracking-tight">Active Clinical Intelligence</h3>
                                            <p className="text-slate-400 text-sm leading-relaxed">
                                                {riskStats.high > 0
                                                    ? `${riskStats.high} patients requiring clinical intervention — review their latest clinical streams.`
                                                    : "All clinical streams reporting within optimal thresholds."}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => { setPatientFilter('all'); setActiveTab('patients-list'); }} 
                                            className="px-6 py-3 bg-teal-500 text-[#0f172a] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all duration-300 flex items-center gap-2 relative z-10"
                                        >
                                            Audit Registry <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}


                            {role !== 'doctor' && (
                                <>
                                    {/* Welcome banner for new users with no logs */}
                                    {/* Premium Greeting & Status */}
                                    {logs.length === 0 && role === 'patient' ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="relative overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] p-6 rounded-2xl mb-6 shadow-lg"
                                        >
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                                                <div className="text-3xl bg-white/5 w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10">✨</div>
                                                <div>
                                                    <p className="font-black text-white text-xl mb-1 tracking-tight">
                                                        Welcome, <span className="text-teal-400">{currentUser?.name?.split(' ')[0] || 'Mama'}</span>
                                                    </p>
                                                    <p className="text-slate-400 text-sm leading-relaxed">
                                                        You are protected by an intelligent care network. Log your first health entry to begin.
                                                    </p>
                                                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-teal-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer">
                                                        Initialize Clinical Log <ArrowRight size={12} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`p-5 rounded-2xl mb-6 flex flex-col md:flex-row items-center gap-5 border transition-all duration-700 ${alert.includes('Monitoring active')
                                                ? 'bg-teal-50/60 border-teal-100'
                                                : 'bg-rose-50/60 border-rose-100'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${alert.includes('Monitoring active')
                                                ? 'bg-teal-500 text-white'
                                                : 'bg-rose-500 text-white animate-pulse'
                                                }`}>
                                                <Bell size={22} className={alert.includes('Monitoring active') ? "animate-pulse" : "animate-bounce"} />
                                            </div>
                                            <div className="flex-1 text-center md:text-left">
                                                {alert.includes('Monitoring active') ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center justify-center md:justify-start gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></div>
                                                            <p className="font-black text-teal-700 text-[10px] uppercase tracking-widest">Clinical Network: Active</p>
                                                        </div>
                                                        <p className="font-semibold text-slate-700 text-base">{alert}</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center justify-center md:justify-start gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                                                            <p className="font-black text-rose-600 text-[10px] uppercase tracking-widest">Alert</p>
                                                        </div>
                                                        <p className="font-semibold text-slate-900 text-base">{alert}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                                        {stats.map((stat, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                whileHover={{ y: -8, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)" }}
                                                 transition={{ delay: i * 0.1 }}
                                                className="bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-white/40 shadow-xl shadow-brand-500/5 hover:shadow-2xl hover:bg-white/60 transition-all cursor-pointer group relative overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                                                    <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300 flex items-center justify-center">
                                                        <Activity size={16} />
                                                    </div>
                                                </div>
                                                <h3 className="text-3xl font-black tracking-tight mb-3 text-slate-900 tabular-nums">{stat.value}</h3>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border ${stat.color} bg-white shadow-sm`}>
                                                        {stat.status}
                                                    </span>
                                                    {stat.status === 'Active' && (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 rounded-full border border-teal-100">
                                                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-teal-600">Syncing</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        <div className="bg-white/40 backdrop-blur-sm p-8 rounded-3xl border border-white/40 shadow-xl shadow-brand-500/5 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                                            <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-6 flex items-center gap-3 relative z-10">
                                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                                                    <Droplets size={20} />
                                                </div>
                                                Clinical Streams
                                            </h3>
                                            {(role === 'guardian' && guardianConnectionStatus !== 'accepted') ? (
                                                <div className="h-full py-12 text-center text-slate-300 relative z-10">
                                                    <Lock size={48} className="mx-auto mb-4 opacity-10" />
                                                    <p className="font-bold uppercase tracking-widest text-[10px]">Authorization Required</p>
                                                    <p className="text-slate-400 mt-1 text-xs">Awaiting care-giver approval.</p>
                                                </div>
                                            ) : logs.length > 0 ? (
                                                <div className="space-y-6 relative z-10">
                                                    {logs.slice(0, 2).map((log) => (
                                                        <div key={log.id} className="relative pl-8 border-l-2 border-slate-100 pb-1">
                                                            <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-slate-900 border-2 border-white shadow-sm"></div>
                                                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                                                                    Telemetry Sync • {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                                <div className="grid grid-cols-3 gap-4">
                                                                    <div>
                                                                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Rate</p>
                                                                        <p className="font-bold text-lg tabular-nums text-slate-900">{log.heartRate}<span className="text-[8px] ml-0.5 opacity-40">bpm</span></p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Gauge</p>
                                                                        <p className="font-bold text-lg tabular-nums text-slate-900">{log.systolic}/{log.diastolic}<span className="text-[8px] ml-0.5 opacity-40">BP</span></p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Index</p>
                                                                        <p className="font-bold text-lg tabular-nums text-slate-900">{log.glucose}<span className="text-[8px] ml-0.5 opacity-40">mg/dL</span></p>
                                                                    </div>
                                                                </div>
                                                                {log.symptoms && (
                                                                    <div className="mt-3 p-3 bg-white/60 rounded-xl border border-white/80 text-[11px] text-slate-500 font-medium italic">
                                                                        "{log.symptoms}"
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="h-full py-12 text-center text-slate-200 relative z-10">
                                                    <Activity size={48} className="mx-auto mb-4 opacity-5" />
                                                    <p className="font-bold uppercase tracking-widest text-[10px]">No Stream Data</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-6">
                                            <div className="bg-white/40 backdrop-blur-md p-8 rounded-3xl border border-white/40 shadow-xl shadow-brand-500/5 relative overflow-hidden group">
                                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-50 rounded-full -ml-32 -mb-32 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                                                <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-8 flex items-center gap-3 relative z-10">
                                                    <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/10">
                                                        <TrendingUp size={20} />
                                                    </div>
                                                    Stability Matrix
                                                </h3>
                                                {(role === 'guardian' && guardianConnectionStatus !== 'accepted') ? (
                                                    <div className="h-full py-12 text-center text-slate-300 relative z-10">
                                                        <Lock size={48} className="mx-auto mb-4 opacity-10" />
                                                        <p className="font-bold uppercase tracking-widest text-[10px]">Access Encrypted</p>
                                                    </div>
                                                ) : (selectedPatient || role === 'patient') ? (
                                                    <div className={`p-6 rounded-2xl border-2 relative overflow-hidden transition-all duration-300 z-10 bg-white/30 backdrop-blur-sm ${getRiskStatus(logs[0]).border}`}>
                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <div className="relative flex items-center justify-center">
                                                                    <div className={`w-2 h-2 rounded-full bg-current animate-ping opacity-50 ${getRiskStatus(logs[0]).color}`}></div>
                                                                    <div className={`w-1.5 h-1.5 rounded-full bg-current absolute ${getRiskStatus(logs[0]).color}`}></div>
                                                                </div>
                                                                <p className={`${getRiskStatus(logs[0]).color} font-bold text-[9px] uppercase tracking-widest`}>
                                                                    Computational Analytics: {getRiskStatus(logs[0]).label}
                                                                </p>
                                                            </div>
                                                            <h4 className="text-2xl font-black text-slate-900 mb-4 leading-tight">
                                                                {getRiskStatus(logs[0]).level === 'urgent' ? 'Action Required' :
                                                                    getRiskStatus(logs[0]).level === 'help' ? 'Enhanced Monitoring' :
                                                                        'Condition Stable'}
                                                            </h4>
                                                            <div className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                                                                {logs[0]?.symptoms ? (
                                                                    <div className="mb-4 p-4 bg-white/80 rounded-xl border border-white shadow-sm">
                                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Feedback</p>
                                                                        <p className="italic text-rose-500 text-base">"{logs[0].symptoms}"</p>
                                                                    </div>
                                                                ) : null}
                                                                <p className="opacity-80">
                                                                    "Telemetry suggests sticking to the established care protocol."
                                                                </p>
                                                            </div>
                                                            {role === 'doctor' ? (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedPatientForAppointment(selectedPatient);
                                                                        setIsAppointmentModalOpen(true);
                                                                        setAppointmentStep('date');
                                                                    }}
                                                                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                                                                >
                                                                    Schedule Intervention <Calendar size={16} />
                                                                </button>
                                                            ) : (
                                                                <button className={`w-full py-5 rounded-2xl border-2 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${getRiskStatus(logs[0]).color} ${getRiskStatus(logs[0]).border} bg-white/60 backdrop-blur-sm hover:bg-white/80 shadow-lg shadow-brand-500/5`}>
                                                                    Full Clinical Assessment <ChevronRight size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <Heart className={`absolute -right-20 -bottom-20 w-80 h-80 -rotate-12 opacity-[0.05] ${getRiskStatus(logs[0]).color}`} fill="currentColor" />
                                                    </div>
                                                ) : (
                                                    <div className="bg-slate-50/50 p-12 rounded-3xl border border-dashed border-slate-100 text-center py-12 relative z-10">
                                                        <Activity className="mx-auto mb-6 text-slate-200" size={64} />
                                                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Awaiting Subject Selection</p>
                                                    </div>
                                                )}
                                            </div>


                                            {/* Upcoming Appointments Directly Under Stable Condition */}
                                            {role === 'patient' && (
                                                <div className="bg-white/30 backdrop-blur-sm p-4 rounded-3xl border border-white/40">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-1.5 px-1">
                                                        <Calendar size={10} className="text-brand-500" /> Next Visits
                                                    </h3>
                                                    {appointments.length > 0 ? (
                                                        <div className="space-y-1.5">
                                                            {appointments.slice(0, 2).map(apt => (
                                                                <div key={apt.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/40 transition-colors">
                                                                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 shrink-0">
                                                                        <Calendar size={12} />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="font-bold text-slate-900 text-[11px] truncate">Dr. {apt.doctor_name || apt.doctor_email.split('@')[0]}</p>
                                                                        <p className="text-[9px] font-medium text-slate-500 truncate">
                                                                            {new Date(apt.appointment_time).toLocaleDateString([], { month: 'short', day: 'numeric' })} — {new Date(apt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-[10px] text-slate-400 font-medium px-1">No visits scheduled.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )
                }

                {
                    activeTab === 'analytics' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
                            {role === 'doctor' && !selectedPatient ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 mb-2">Patient Select</h2>
                                            <p className="text-slate-500 font-medium">Select a patient below to view their real-time clinical vitals and analytics.</p>
                                        </div>
                                        <div className="flex bg-white/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/40 shadow-xl">
                                            {[
                                                { id: 'all', label: 'All Patients' },
                                                { id: 'urgent', label: 'High Risk', color: 'text-rose-600' },
                                                { id: 'help', label: 'Moderate', color: 'text-amber-600' },
                                            ].map(f => (
                                                <button
                                                    key={f.id}
                                                    onClick={() => setPatientFilter(f.id)}
                                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${patientFilter === f.id
                                                        ? 'bg-brand-600 text-white shadow-lg'
                                                        : `text-slate-400 hover:text-slate-600`
                                                        }`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>                                    <div className="flex flex-col gap-4">
                                        {patients
                                            .filter(p => {
                                                if (patientFilter === 'all') return true;
                                                const pData = patientHealthData[p.email];
                                                return pData?.risk?.level === patientFilter;
                                            })
                                            .map((p) => {
                                                const pData = patientHealthData[p.email] || { latestLog: null, risk: getRiskStatus(null) };
                                                const risk = pData.risk;
                                                return (
                                                    <div key={p.email} className="relative group/card">
                                                        <button
                                                            onClick={() => handleSelectPatient(p)}
                                                            className={`p-5 rounded-2xl text-left transition-all border border-white/40 w-full flex flex-col md:flex-row items-center gap-6 shadow-2xl hover:shadow-brand-200/50 bg-white/40 backdrop-blur-xl text-slate-600`}
                                                        >
                                                            <div className="flex items-center gap-6 flex-1 w-full">
                                                                <div className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl font-black border-2 bg-brand-50 text-brand-600 border-brand-100 shadow-inner overflow-hidden`}>
                                                                    {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : (p.name?.[0]?.toUpperCase() || 'P')}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-3 mb-1">
                                                                        <p className="font-black text-xl leading-tight truncate">{p.name || 'Anonymous'}</p>
                                                                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${risk.bg} ${risk.color} border ${risk.border}`}>
                                                                            {risk.label}
                                                                        </div>
                                                                    </div>
                                                                    <p className={`text-sm font-medium text-slate-400`}>
                                                                        Registry ID: {p.email} • Age {p.age} • {p.pregnancyType}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-8 px-6 border-l border-slate-100 h-10">
                                                                <div className="text-center">
                                                                    <p className={`text-[10px] font-black uppercase tracking-widest text-slate-400`}>Latest HR</p>
                                                                    <p className="font-bold text-lg">{pData.latestLog?.heartRate || '--'} <span className="text-[10px] opacity-70">bpm</span></p>
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className={`text-[10px] font-black uppercase tracking-widest text-slate-400`}>BP Gauge</p>
                                                                    <p className="font-bold text-lg">{pData.latestLog ? `${pData.latestLog.systolic}/${pData.latestLog.diastolic}` : '--/--'}</p>
                                                                </div>
                                                                <div className="hidden lg:block text-center">
                                                                    <p className={`text-[10px] font-black uppercase tracking-widest text-slate-400`}>Last Assessment</p>
                                                                    <p className="font-bold text-lg">{pData.latestLog ? new Date(pData.latestLog.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Never'}</p>
                                                                </div>
                                                            </div>

                                                            <div className={`ml-4 p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover/card:bg-brand-50 group-hover/card:text-brand-600 transition-all`}>
                                                                <ChevronRight size={20} />
                                                            </div>
                                                        </button>
                                                    </div>
                                                );
                                            })}

                                        {patients.length === 0 && (
                                            <div className="col-span-full py-20 text-center bg-white/30 backdrop-blur-xl rounded-3xl border-2 border-dashed border-white/40">
                                                <UsersIcon size={48} className="mx-auto mb-4 text-slate-200" />
                                                <p className="text-slate-400 font-bold">Your patient directory is empty.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-10">
                                     {/* Patient Profile Header - Elegant & Empathetic */}
                                    <div className="bg-white/40 backdrop-blur-xl p-8 rounded-3xl border border-white/40 shadow-2xl flex flex-col xl:flex-row items-center justify-between gap-10 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 w-full xl:w-auto">
                                            <div className="relative">
                                                <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 text-3xl font-black shadow-inner overflow-hidden">
                                                    {(role === 'doctor' ? selectedPatient?.photo : currentUser?.photo) ? (
                                                        <img
                                                            src={(role === 'doctor' ? selectedPatient?.photo : currentUser?.photo)}
                                                            alt="Profile"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : ((role === 'doctor' ? selectedPatient?.name : currentUser?.name)?.[0] || 'P')}
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-lg">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                            </div>
                                            <div className="text-center md:text-left">
                                                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                                        {(role === 'doctor' ? selectedPatient?.name : currentUser?.name) || "Clinical File"}
                                                    </h2>
                                                    {role === 'doctor' && (
                                                        <span className="px-3 py-1 bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-100">
                                                            Active Patient
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-slate-500 font-bold text-sm">
                                                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                        <Calendar size={14} className="text-slate-400" />
                                                        {(role === 'doctor' ? selectedPatient : currentUser)?.age} Years
                                                    </span>
                                                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                        <Activity size={14} className="text-slate-400" />
                                                        {(role === 'doctor' ? selectedPatient : currentUser)?.pregnancyType}
                                                    </span>
                                                    {role === 'doctor' && (
                                                        <button
                                                            onClick={() => setSelectedPatient(null)}
                                                            className="text-brand-500 hover:text-brand-600 transition-colors flex items-center gap-1 font-black uppercase text-[10px] tracking-widest ml-2"
                                                        >
                                                            <ChevronRight size={14} className="rotate-180" /> Change Patient
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-center gap-6 relative z-10 w-full xl:w-auto">
                                            <div className="flex items-center gap-4 mr-4 pb-4 md:pb-0 border-b md:border-b-0 md:border-r border-slate-100 pr-6">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-1">Risk Score</p>
                                                    <p className="text-2xl font-black text-slate-900">
                                                        {((isDemoMode ? demoRiskPercent : (getRiskStatus(logs[0])?.score || 0.2)) * 100).toFixed(0)}%
                                                    </p>
                                                </div>
                                                <div className="w-24 h-12">
                                                    <GaugeChart
                                                        id="risk-gauge-header"
                                                        nrOfLevels={30}
                                                        colors={['#10b981', '#f59e0b', '#ef4444']}
                                                        arcWidth={0.3}
                                                        percent={isDemoMode ? demoRiskPercent : (getRiskStatus(logs[0])?.score || 0.2)}
                                                        hideText={true}
                                                        style={{ width: '100px' }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setIsDemoMode(!isDemoMode)}
                                                    className={`h-14 px-6 rounded-2xl font-black transition-all flex items-center gap-3 ${isDemoMode
                                                        ? 'bg-rose-500 text-white shadow-xl shadow-rose-200'
                                                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    {isDemoMode ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                                    <span className="uppercase text-[10px] tracking-widest">{isDemoMode ? 'Stop Demo' : 'Live Demo'}</span>
                                                </button>

                                                <button
                                                    onClick={handleGenerateReport}
                                                    className="h-14 px-6 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-900 transition-all flex items-center gap-3 group"
                                                >
                                                    <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                                                    Clinical Report
                                                </button>

                                                {role === 'doctor' && (
                                                    <button
                                                        onClick={() => setIsAppointmentModalOpen(true)}
                                                        className="h-14 w-14 bg-brand-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-brand-100 hover:bg-brand-600 transition-all"
                                                        title="Schedule Appointment"
                                                    >
                                                        <Calendar size={22} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>


                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Blood Pressure Card - Redesigned */}
                                        <motion.div whileHover={{ y: -10, scale: 1.01 }} className="bg-white/40 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-2xl transition-all duration-500 group relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="flex items-start justify-between mb-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                                                            <Heart size={14} fill="currentColor" />
                                                        </div>
                                                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Hemodynamics</p>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Blood Pressure</h3>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">145<span className="text-sm text-slate-300 font-bold ml-1">/92</span></p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">mmHg  Latest</p>
                                                </div>
                                            </div>
                                            <div className="h-[200px] w-full relative group/chart">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={weeklyTrends}>
                                                        <defs>
                                                            <linearGradient id="colorSysRedesign" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                            </linearGradient>
                                                            <filter id="glow">
                                                                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                                                <feMerge>
                                                                    <feMergeNode in="coloredBlur"/>
                                                                    <feMergeNode in="SourceGraphic"/>
                                                                </feMerge>
                                                            </filter>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis 
                                                            dataKey="day" 
                                                            axisLine={false} 
                                                            tickLine={false} 
                                                            tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 900 }} 
                                                        />
                                                        <YAxis hide={false} domain={['dataMin - 10', 'dataMax + 10']} tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 900 }} axisLine={false} tickLine={false} />
                                                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }} />
                                                        <Tooltip
                                                            cursor={{ stroke: '#f43f5e', strokeWidth: 2, strokeDasharray: '5 5' }}
                                                            contentStyle={{ 
                                                                borderRadius: '20px', 
                                                                border: '1px solid rgba(244, 63, 94, 0.1)', 
                                                                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                                                                padding: '16px',
                                                                backdropFilter: 'blur(10px)',
                                                                backgroundColor: 'rgba(255,255,255,0.9)'
                                                            }}
                                                            itemStyle={{ fontWeight: '900', fontSize: '14px', color: '#1e293b' }}
                                                        />
                                                        <Area 
                                                            type="monotone" 
                                                            dataKey="sys" 
                                                            name="Systolic (SYS)"
                                                            stroke="#f43f5e" 
                                                            strokeWidth={4} 
                                                            fill="url(#colorSysRedesign)" 
                                                            filter="url(#glow)"
                                                            connectNulls={true}
                                                            animationBegin={0}
                                                            animationDuration={3000}
                                                            animationEasing="ease-in-out"
                                                        />
                                                        <Area 
                                                            type="monotone" 
                                                            dataKey="dia" 
                                                            name="Diastolic (DIA)"
                                                            stroke="#f43f5e" 
                                                            strokeWidth={2} 
                                                            strokeDasharray="5 5"
                                                            fill="none" 
                                                            connectNulls={true}
                                                            animationBegin={0}
                                                            animationDuration={3000}
                                                            animationEasing="ease-in-out"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                                {isDemoMode && (
                                                    <motion.div 
                                                        animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
                                                        transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
                                                        className="absolute top-0 bottom-0 w-[2px] bg-rose-500 shadow-[0_0_15px_#f43f5e] z-10 pointer-events-none"
                                                    />
                                                )}
                                            </div>
                                        </motion.div>

                                        {/* Risk Score Card - Redesigned */}
                                        <motion.div whileHover={{ y: -10, scale: 1.01 }} className="bg-white/40 backdrop-blur-xl border border-white/40 p-8 rounded-3xl shadow-2xl transition-all duration-500 flex flex-col items-center justify-center relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-1000"></div>
                                            <div className="absolute top-8 left-8">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 shadow-sm">
                                                        <Activity size={18} />
                                                    </div>
                                                    <p className="text-[11px] font-black text-brand-500 uppercase tracking-widest">Safety Index</p>
                                                </div>
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Risk Assessment</h3>
                                            </div>
                                            <div className="w-full max-w-[280px] mt-16 relative">
                                                <GaugeChart
                                                    id="risk-gauge-analytics"
                                                    nrOfLevels={40}
                                                    colors={['#10b981', '#f59e0b', '#ef4444']}
                                                    arcWidth={0.12}
                                                    percent={isDemoMode ? demoRiskPercent : (getRiskStatus(logs[0])?.score || 0.2)}
                                                    textColor="#1e293b"
                                                    needleColor="#0f172a"
                                                    needleBaseColor="#0f172a"
                                                    hideText={true}
                                                    animate={true}
                                                    animDelay={500}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center pt-16">
                                                    <div className="text-center">
                                                        <motion.p 
                                                            key={demoRiskPercent}
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            className="text-6xl font-black text-slate-900 tracking-tighter"
                                                        >
                                                            {((isDemoMode ? demoRiskPercent : (getRiskStatus(logs[0])?.score || 0.2)) * 100).toFixed(0)}<span className="text-2xl text-slate-300 ml-1">%</span>
                                                        </motion.p>
                                                        <div className="mt-4 px-6 py-2 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] inline-block shadow-xl shadow-slate-200">
                                                            {getRiskStatus(logs[0])?.label || 'Normal'} Stability
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Heart Rate Card - Redesigned */}
                                        <motion.div whileHover={{ y: -10, scale: 1.01 }} className="bg-white/40 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-2xl transition-all duration-500 group relative">
                                            <div className="flex items-start justify-between mb-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center text-teal-500">
                                                            <Activity size={14} />
                                                        </div>
                                                        <p className="text-[9px] font-black text-teal-500 uppercase tracking-widest">Chronometry</p>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Heart Rate</h3>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">78<span className="text-sm text-slate-300 font-bold ml-1">bpm</span></p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Resting  Optimized</p>
                                                </div>
                                            </div>
                                            <div className="h-[200px] w-full relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={weeklyTrends}>
                                                        <defs>
                                                            <filter id="glowTeal">
                                                                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                                                <feMerge>
                                                                    <feMergeNode in="coloredBlur"/>
                                                                    <feMergeNode in="SourceGraphic"/>
                                                                </feMerge>
                                                            </filter>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis 
                                                            dataKey="day" 
                                                            axisLine={false} 
                                                            tickLine={false} 
                                                            tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 900 }} 
                                                        />
                                                        <YAxis hide={false} domain={['dataMin - 5', 'dataMax + 5']} tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 900 }} axisLine={false} tickLine={false} />
                                                        <Tooltip 
                                                            contentStyle={{ 
                                                                borderRadius: '20px', 
                                                                border: '1px solid rgba(20, 184, 166, 0.1)', 
                                                                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                                                                backdropFilter: 'blur(10px)',
                                                                backgroundColor: 'rgba(255,255,255,0.9)'
                                                            }} 
                                                        />
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey="hr" 
                                                            name="Pulse Rate (BPM)"
                                                            stroke="#14b8a6" 
                                                            strokeWidth={5} 
                                                            dot={{ r: 4, fill: '#14b8a6', strokeWidth: 0 }} 
                                                            activeDot={{ r: 8, strokeWidth: 4, stroke: 'rgba(20, 184, 166, 0.2)', fill: '#14b8a6' }} 
                                                            filter="url(#glowTeal)"
                                                            connectNulls={true}
                                                            animationBegin={0}
                                                            animationDuration={3000}
                                                            animationEasing="ease-in-out"
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                                {isDemoMode && (
                                                    <motion.div 
                                                        animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
                                                        transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
                                                        className="absolute top-0 bottom-0 w-[2px] bg-teal-500 shadow-[0_0_15px_#14b8a6] z-10 pointer-events-none"
                                                    />
                                                )}
                                            </div>
                                        </motion.div>

                                        {/* Blood Sugar Card - Redesigned */}
                                        <motion.div whileHover={{ y: -10, scale: 1.01 }} className="bg-white/40 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-2xl transition-all duration-500 group relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="flex items-start justify-between mb-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                                            <Droplets size={14} fill="currentColor" />
                                                        </div>
                                                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Metabolic</p>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Glucose Level</h3>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">92<span className="text-sm text-slate-300 font-bold ml-1">mg/dL</span></p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Target  95</p>
                                                </div>
                                            </div>
                                            <div className="h-[200px] w-full relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={weeklyTrends}>
                                                        <defs>
                                                            <filter id="glowIndigo">
                                                                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                                                <feMerge>
                                                                    <feMergeNode in="coloredBlur"/>
                                                                    <feMergeNode in="SourceGraphic"/>
                                                                </feMerge>
                                                            </filter>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis 
                                                            dataKey="day" 
                                                            axisLine={false} 
                                                            tickLine={false} 
                                                            tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 900 }} 
                                                        />
                                                        <YAxis hide={false} domain={['dataMin - 5', 'dataMax + 5']} tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 900 }} axisLine={false} tickLine={false} />
                                                        <Tooltip 
                                                            contentStyle={{ 
                                                                borderRadius: '20px', 
                                                                border: '1px solid rgba(99, 102, 241, 0.1)', 
                                                                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                                                                backdropFilter: 'blur(10px)',
                                                                backgroundColor: 'rgba(255,255,255,0.9)'
                                                            }} 
                                                        />
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey="g" 
                                                            name="Blood Glucose (mg/dL)"
                                                            stroke="#6366f1" 
                                                            strokeWidth={4} 
                                                            dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} 
                                                            activeDot={{ r: 8, strokeWidth: 0, fill: '#6366f1' }}
                                                            filter="url(#glowIndigo)"
                                                            connectNulls={true}
                                                            animationBegin={0}
                                                            animationDuration={3000}
                                                            animationEasing="ease-in-out"
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                                {isDemoMode && (
                                                    <motion.div 
                                                        animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
                                                        transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
                                                        className="absolute top-0 bottom-0 w-[2px] bg-indigo-500 shadow-[0_0_15px_#6366f1] z-10 pointer-events-none"
                                                    />
                                                )}
                                            </div>
                                        </motion.div>

                                        {/* Symptoms Card - Redesigned */}
                                        <motion.div whileHover={{ y: -10, scale: 1.01 }} className="bg-white/40 backdrop-blur-xl border border-white/40 p-8 rounded-3xl shadow-2xl transition-all duration-500 group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-1000"></div>
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                                                    <Sparkles size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Physical Status</p>
                                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Symptoms Tracking</h3>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {[
                                                    { id: 'swelling', label: 'Peripheral Swelling', icon: Droplets },
                                                    { id: 'headache', label: 'Acute Headache', icon: Zap },
                                                    { id: 'vision', label: 'Visual Disturbances', icon: Sparkles },
                                                    { id: 'nausea', label: 'Persistent Nausea', icon: Activity }
                                                ].map((s) => (
                                                    <label key={s.id} className="flex items-center gap-4 cursor-pointer group p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 hover:border-white/40 hover:bg-white/30 transition-all duration-300">
                                                        <div className="relative flex items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                className="peer appearance-none w-6 h-6 rounded-xl border-2 border-slate-200 checked:bg-brand-500 checked:border-brand-500 transition-all cursor-pointer shadow-sm"
                                                                defaultChecked={s.id === 'swelling'}
                                                            />
                                                            <CheckCircle2 size={14} className="absolute text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-black text-slate-600 peer-checked:text-slate-900 transition-colors uppercase tracking-tight block">{s.label}</span>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Select to Log</span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </motion.div>

                                        {/* Quick Actions Card - Redesigned */}
                                        <motion.div whileHover={{ y: -10, scale: 1.01 }} className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl text-white flex flex-col justify-between relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                                            <div>
                                                <h3 className="text-lg font-bold mb-1 tracking-tight">Clinical Decision Support</h3>
                                                <p className="text-slate-400 text-xs font-medium">Execute neurological and hemodynamic assessments.</p>
                                            </div>

                                            <div className="mt-6 flex flex-col gap-2">
                                                <button
                                                    onClick={handleGenerateReport}
                                                    disabled={isGeneratingReport}
                                                    className="w-full h-12 bg-white text-slate-950 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-95 transition-all"
                                                >
                                                    {isGeneratingReport ? (
                                                        <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                                                    ) : <Activity size={16} />}
                                                    {isGeneratingReport ? 'Processing...' : 'Generate Clinical Review'}
                                                </button>
                                                <div className="flex gap-2">
                                                    <button className="flex-1 h-12 bg-white/10 rounded-xl border border-white/10 font-bold text-[10px] hover:bg-white/20 transition-all uppercase">Protocol</button>
                                                    <button className="flex-1 h-12 bg-white/10 rounded-xl border border-white/10 font-bold text-[10px] hover:bg-white/20 transition-all uppercase">Peer Review</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>


                                    {/* Clinical Insight Banner - High-End Medical AI */}
                                    <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/10 text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl mt-8 group">
                                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-500/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
                                        <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-8">
                                            <div className="max-w-2xl">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-sm text-teal-400 rounded-xl border border-white/10 mb-6">
                                                    <Sparkles size={14} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Analytical Insight Engine</span>
                                                </div>
                                                <h3 className="text-2xl font-bold mb-4 tracking-tight">
                                                    Intelligent Clinical <span className="text-teal-400">Insight Analytics</span>
                                                </h3>
                                                <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                                                    {logs.length > 0 ? (
                                                        getRiskStatus(logs[0]).level === 'normal'
                                                            ? "Current neural telemetry demonstrates optimal maternal stability. Predictive modeling suggests maintaining the current clinical protocol."
                                                            : "Heuristic variance in hemodynamic markers detected. Computational analysis indicates a priority requirement for closer observation."
                                                    ) : "Initialize clinical log stream to activate the Maatri Shield predictive stability engine."}
                                                </p>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                                                <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/10 text-center min-w-[160px] shadow-2xl">
                                                    <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-teal-400">
                                                        <CheckCircle2 size={20} />
                                                    </div>
                                                    <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-1">Goal</p>
                                                    <p className="text-2xl font-black text-white">92.4%</p>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/10 text-center min-w-[160px] shadow-2xl">
                                                    <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-brand-400">
                                                        <TrendingUp size={20} />
                                                    </div>
                                                    <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-1">Grade</p>
                                                    <p className="text-2xl font-black text-white">Alpha</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </motion.div>
                    )
                }

                {
                    activeTab === 'patients-list' && role === 'doctor' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-12">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                                <div>
                                    <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Patient Registry</h2>
                                    <p className="text-slate-500 font-medium">Comprehensive clinical directory of all connected patient accounts.</p>
                                </div>
                                <div className="flex bg-slate-100/50 backdrop-blur-sm p-1.5 rounded-[1.5rem] border border-slate-200/50">
                                    {[
                                        { id: 'all', label: 'All Cases' },
                                        { id: 'urgent', label: 'Critical', color: 'text-rose-600' },
                                        { id: 'help', label: 'Elevated', color: 'text-amber-600' },
                                        { id: 'normal', label: 'Optimal', color: 'text-teal-600' }
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setPatientFilter(f.id)}
                                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${patientFilter === f.id
                                                ? 'bg-slate-900 text-white shadow-xl'
                                                : `text-slate-400 hover:text-slate-600 hover:bg-white/50`
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {patients
                                    .filter(p => {
                                        if (patientFilter === 'all') return true;
                                        const pData = patientHealthData[p.email];
                                        return pData?.risk?.level === patientFilter;
                                    })
                                    .map((p) => {
                                        const pData = patientHealthData[p.email] || { latestLog: null, risk: getRiskStatus(null) };
                                        const risk = pData.risk;
                                        const isSelected = selectedPatient?.email === p.email;
                                        
                                        return (
                                            <div key={p.email} className="group relative">
                                                <button
                                                    onClick={() => handleSelectPatient(p)}
                                                    className={`w-full p-5 rounded-2xl text-left transition-all duration-300 border flex flex-col xl:flex-row items-center gap-6 shadow-sm ${isSelected
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                                        : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-5 flex-1 w-full">
                                                        <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-xl font-bold border transition-all ${isSelected ? 'bg-white/10 text-white border-white/20' : 'bg-slate-50 text-slate-400 border-slate-100 shadow-inner'} overflow-hidden`}>
                                                            {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : (p.name?.[0]?.toUpperCase() || 'P')}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                                                <p className="font-bold text-lg leading-tight truncate tracking-tight">{p.name || 'Anonymous Patient'}</p>
                                                                <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${isSelected
                                                                    ? 'bg-white/10 text-white border-white/20'
                                                                    : `${risk.bg} ${risk.color} ${risk.border}`
                                                                    }`}>
                                                                    {risk.label}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <span className="text-[10px] font-bold flex items-center gap-1.5 text-slate-400">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-teal-400' : 'bg-teal-500'}`}></div>
                                                                    #{p.email.split('@')[0].toUpperCase()}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                    • {p.age} Years
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                    • {p.pregnancyType}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={`flex flex-wrap items-center justify-between xl:justify-end gap-8 w-full xl:w-auto px-6 xl:border-l ${isSelected ? 'border-white/10' : 'border-slate-100'}`}>
                                                        <div className="text-center">
                                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>Heart Rate</p>
                                                            <p className="font-bold text-lg tabular-nums">{pData.latestLog?.heartRate || '--'}<span className="text-[9px] ml-0.5 opacity-50 uppercase">bpm</span></p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>Blood Pressure</p>
                                                            <p className="font-bold text-lg tabular-nums">{pData.latestLog ? `${pData.latestLog.systolic}/${pData.latestLog.diastolic}` : '--/--'}</p>
                                                        </div>
                                                        <div className="hidden sm:block text-right">
                                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>Last Sync</p>
                                                            <p className="font-bold text-base">{pData.latestLog ? new Date(pData.latestLog.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Pending'}</p>
                                                        </div>
                                                        <div className={`p-3 rounded-xl transition-all ${isSelected ? 'bg-white text-slate-950 shadow-md' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
                                                            <ChevronRight size={18} />
                                                        </div>
                                                    </div>
                                                </button>
                                                
                                                <div className="absolute top-1/2 -right-4 -translate-y-1/2 flex flex-col gap-3 z-20 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-500">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openChat(p);
                                                        }}
                                                        className="w-14 h-14 bg-white text-blue-500 rounded-2xl shadow-2xl border border-slate-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group/btn"
                                                        title="Secure Message"
                                                    >
                                                        <MessageSquare size={20} className="group-hover/btn:rotate-12 transition-transform" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemovePatient(p.email);
                                                        }}
                                                        className="w-14 h-14 bg-white text-rose-500 rounded-2xl shadow-2xl border border-slate-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group/btn"
                                                        title="Terminate Care"
                                                    >
                                                        <Trash2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                {patients.length === 0 && (
                                    <div className="py-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                                            <UsersIcon size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-400 mb-1">No Clinical Records Found</h3>
                                        <p className="text-slate-300 text-sm max-w-xs mx-auto">Patient connections will appear here once care links are established.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )
                }

                {
                    activeTab === 'reports' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
                                        {role === 'doctor' ? 'Clinical Report Center' : 'My Clinical Reports'}
                                    </h2>
                                    <div className="text-slate-500 text-sm flex flex-col md:flex-row md:items-center gap-2 mt-1">
                                        {role === 'doctor'
                                            ? <span>Select a patient to generate a comprehensive AI-powered clinical assessment.</span>
                                            : <>
                                                <span>View your previous clinical assessments or generate a new one based on your latest vitals.</span>
                                                <motion.span
                                                    initial={{ opacity: 0.8, y: -2 }}
                                                    animate={{ opacity: 1, y: 2 }}
                                                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
                                                    className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-blue-200 shadow-sm w-fit"
                                                >
                                                    Every week is progress
                                                </motion.span>
                                            </>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Patient Selection Sidebar for Reports (Doctor Only) */}
                                {role === 'doctor' && (
                                    <div className="lg:col-span-1 space-y-4">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Select Patient</h3>
                                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                            {patients.map((p) => (
                                                <button
                                                    key={p.email}
                                                    onClick={() => handleSelectPatient(p)}
                                                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${selectedPatient?.email === p.email
                                                        ? 'bg-brand-50/50 backdrop-blur-sm border-brand-400 shadow-md'
                                                        : 'bg-white/40 backdrop-blur-sm border-white/40 hover:border-brand-400'
                                                        }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold overflow-hidden border ${selectedPatient?.email === p.email ? 'bg-brand-600 text-white border-brand-400' : 'bg-brand-50 text-brand-600 border-brand-100'}`}>
                                                        {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : (p.name?.[0]?.toUpperCase() || 'P')}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm text-slate-900 truncate">{p.name}</p>
                                                        <p className="text-[10px] text-slate-400 truncate">{p.email}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Report Content Area */}
                                <div className={`${role === 'doctor' ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-8`}>
                                    {role === 'doctor' && selectedPatient && (
                                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                            <button
                                                onClick={() => setSelectedPatient(null)}
                                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
                                            >
                                                <ChevronRight size={14} className="rotate-180" /> Back to Patients
                                            </button>
                                            <span className="text-sm font-bold text-slate-900">{selectedPatient.name}'s Reports</span>
                                        </div>
                                    )}

                                    {/* Reports List - Only show for patient or if patient is selected by doctor */}
                                    {(role === 'patient' || selectedPatient) ? (
                                        <div className="space-y-8">
                                            {(patientReports && patientReports.length > 0) ? (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end px-2">
                                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Report History</h3>
                                                        <span className="text-[10px] font-bold text-slate-300">{patientReports.length} Reports</span>
                                                    </div>
                                                    <div className="flex flex-col gap-3">
                                                        {patientReports.map((report) => (
                                                            <button
                                                                key={report.id}
                                                                onClick={() => {
                                                                    setReportContent(report.content);
                                                                    setSelectedReportTimestamp(report.timestamp);
                                                                    setIsReportModalOpen(true);
                                                                }}
                                                                className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/60 hover:border-brand-500 transition-all text-left shadow-sm group hover:shadow-md flex items-center justify-between gap-6"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="p-3 bg-[#F8F7FF] rounded-xl text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                                                                        <Calendar size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-900 leading-tight">Clinical Health Assessment</p>
                                                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                                            AI Generated • S.O.A.P Format
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-6">
                                                                    <div className="text-right">
                                                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                                                            {new Date(report.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                        </span>
                                                                        <span className="block text-[10px] font-bold text-brand-600">
                                                                            {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-8 h-8 rounded-full border-2 border-slate-50 flex items-center justify-center text-slate-300 group-hover:border-brand-100 group-hover:text-brand-600 transition-colors">
                                                                        <Activity size={14} />
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-white/40 backdrop-blur-sm p-8 rounded-2xl border border-white/40 shadow-xl shadow-brand-500/5 text-center">
                                                    <Activity className="mx-auto mb-4 text-slate-200" size={32} />
                                                    <p className="text-slate-400 font-bold">No reports generated yet.</p>
                                                </div>
                                            )}

                                            {/* Generate Report Button - Premium CTA */}
                                            <div className="bg-gradient-to-br from-white to-brand-50/50 backdrop-blur-sm rounded-3xl border border-white shadow-[0_20px_40px_-15px_rgba(99,102,241,0.1)] p-10 text-center h-fit flex flex-col items-center justify-center group hover:shadow-[0_40px_80px_-20px_rgba(99,102,241,0.2)] transition-all duration-700 max-w-2xl mx-auto relative overflow-hidden">
                                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-500/5 rounded-full blur-3xl group-hover:bg-brand-500/10 transition-colors"></div>
                                                <div className="flex flex-col items-center relative z-10">
                                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-600 shadow-xl shadow-brand-100 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                                        <Sparkles size={32} />
                                                    </div>
                                                    <h3 className="text-2xl font-black text-slate-900 leading-none mb-3">Generate Fresh Clinical Assessment</h3>
                                                    <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto mb-8">
                                                        {role === 'doctor'
                                                            ? `Our AI will synthesize ${selectedPatient.name}'s latest vitals and interaction history into a professional S.O.A.P note.`
                                                            : "Initiate our proprietary clinical engine to analyze your recent health metrics and provide actionable advice."
                                                        }
                                                    </p>
                                                    <button
                                                        onClick={handleGenerateReport}
                                                        disabled={isGeneratingReport}
                                                        className={`relative overflow-hidden group bg-slate-950 text-white h-14 px-10 rounded-2xl flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-300 transition-all active:scale-95 ${isGeneratingReport ? 'opacity-50' : 'hover:bg-brand-600 hover:shadow-brand-200'}`}
                                                    >
                                                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                                        {isGeneratingReport ? (
                                                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                                                        ) : (
                                                            <><Activity size={18} /> Run AI Analysis</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-2xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4">
                                                <UsersIcon size={32} />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-400 mb-1">Patient Select Required</h3>
                                            <p className="text-slate-300 text-sm font-medium max-w-xs mx-auto">Please select a patient from the sidebar to view their clinical history and generate reports.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                }
            </main >

            <AnimatePresence>
                 {
                     activeTab === 'settings' && (
                         <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 pb-12 relative z-10 max-w-2xl mx-auto">
                             <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                 <div>
                                     <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600">Account Settings</h2>
                                     <p className="text-slate-500 font-medium italic border-l-4 border-brand-500 pl-4 py-1 text-sm">Manage your clinical profile identity and system preferences.</p>
                                 </div>
                             </div>
 
                             <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20">
                                 <form id="profileForm" onSubmit={handleUpdateProfile} className="space-y-12">
                                     <div className="flex flex-col md:flex-row gap-12 items-start">
                                         {/* Photo Section */}
                                         <div className="flex flex-col items-center gap-4 w-full md:w-auto">
                                             <div className="relative group">
                                                 <div className={`w-40 h-40 rounded-3xl border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden transition-all group-hover:scale-[1.02] ${role === 'doctor' ? 'bg-blue-600' : role === 'guardian' ? 'bg-purple-600' : 'bg-brand-600'}`}>
                                                     {profileForm.photo ? (
                                                         <img src={profileForm.photo} alt="Preview" className="w-full h-full object-cover" />
                                                     ) : (
                                                         <span className="text-white text-5xl font-black">
                                                             {profileForm.name?.[0]?.toUpperCase() || 'U'}
                                                         </span>
                                                     )}
                                                 </div>
                                                 <label className="absolute -right-3 -bottom-3 p-4 bg-white text-brand-600 rounded-2xl shadow-xl cursor-pointer hover:bg-brand-50 transition-all border border-brand-100 group-hover:rotate-6">
                                                     <Camera size={24} />
                                                     <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                                 </label>
                                             </div>
                                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Clinical Identity Image</p>
                                         </div>
 
                                         {/* Fields Section */}
                                         <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                                             <div>
                                                 <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest px-1">Full Legal Name</label>
                                                 <input type="text" className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-brand-500 transition-all shadow-sm" placeholder="Full Name" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
                                             </div>
                                             <div>
                                                 <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest px-0.5">Clinical Age</label>
                                                 <input type="number" className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-brand-500 transition-all shadow-sm" placeholder="Age" value={profileForm.age} onChange={e => setProfileForm({ ...profileForm, age: e.target.value })} required />
                                             </div>
                                             <div>
                                                 <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest px-0.5 flex justify-between">
                                                     <span>Mobile Primary</span>
                                                     <span className={`${profileForm.mobile && !profileForm.mobile.startsWith('+') ? 'text-rose-500 animate-pulse' : 'text-slate-300'} font-black italic`}>Prefix with +</span>
                                                 </label>
                                                 <input
                                                     type="tel"
                                                     placeholder="+1234567890"
                                                     className={`w-full h-14 px-6 bg-slate-50 border rounded-2xl font-bold text-slate-700 transition-all shadow-sm ${profileForm.mobile && !profileForm.mobile.startsWith('+') ? 'border-rose-400 bg-rose-50' : 'border-slate-100 focus:bg-white focus:border-brand-500'}`}
                                                     value={profileForm.mobile}
                                                     onChange={e => setProfileForm({ ...profileForm, mobile: e.target.value })}
                                                     required
                                                 />
                                             </div>
                                             <div>
                                                 <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest px-0.5 flex justify-between">
                                                     <span>SOS Emergency Contact</span>
                                                      <span className={`${profileForm.emergencyContact && !profileForm.emergencyContact.startsWith('+') ? 'text-rose-500 animate-pulse' : 'text-slate-300'} font-black italic`}>Prefix with +</span>
                                                 </label>
                                                 <input
                                                     type="tel"
                                                     placeholder="+1234567890"
                                                     className={`w-full h-14 px-6 bg-slate-50 border rounded-2xl font-bold text-slate-700 transition-all shadow-sm ${profileForm.emergencyContact && !profileForm.emergencyContact.startsWith('+') ? 'border-rose-400 bg-rose-50' : 'border-slate-100 focus:bg-white focus:border-brand-500'}`}
                                                     value={profileForm.emergencyContact}
                                                     onChange={e => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                                                  />
                                              </div>
                                          </div>
                                     </div>
 
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                                         <div>
                                             <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest px-0.5">Medicine Intake Schedule (24h)</label>
                                             <input type="text" className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-brand-500 transition-all shadow-sm" value={profileForm.medicineTimes} onChange={e => setProfileForm({ ...profileForm, medicineTimes: e.target.value })} placeholder="08:00, 14:00, 20:00" />
                                         </div>
                                         {role === 'patient' && (
                                             <div>
                                                 <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest px-0.5">Biological Pregnancy Stage</label>
                                                 <select className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-500 transition-all shadow-sm" value={profileForm.pregnancyType} onChange={e => setProfileForm({ ...profileForm, pregnancyType: e.target.value })}>
                                                     <option value="first">First Full-Term Pregnancy</option>
                                                     <option value="second">Multipara (Second+ Pregnancy)</option>
                                                     <option value="other">Clinical Variance / Other</option>
                                                 </select>
                                             </div>
                                         )}
                                         {role === 'doctor' && (
                                             <div>
                                                 <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest px-0.5">Clinical Facility Name</label>
                                                 <input type="text" className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-brand-500 transition-all shadow-sm" placeholder="E.g. City Life Medical Center" value={profileForm.hospitalName} onChange={e => setProfileForm({ ...profileForm, hospitalName: e.target.value })} />
                                             </div>
                                         )}
                                     </div>
                                     <div className="pb-4">
                                        <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest px-0.5">{role === 'patient' ? 'Residential Address' : 'Professional Address'}</label>
                                        <textarea className="w-full min-h-[100px] px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-brand-500 transition-all" placeholder="Street, City, Postal Code" value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} />
                                    </div>
 
                                     <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-10 border-t border-slate-50">
                                         <button
                                             type="button"
                                             onClick={() => {
                                                 storage.logout();
                                                 navigate('/');
                                             }}
                                             className="h-14 px-8 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95 flex items-center gap-3 w-full sm:w-auto order-2 sm:order-1"
                                         >
                                             <LogOut size={18} />
                                             Logout System
                                         </button>
                                         <button type="submit" className="h-14 px-10 bg-slate-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-slate-200 hover:bg-brand-600 transition-all active:scale-95 flex items-center gap-4 w-full sm:w-auto order-1 sm:order-2">
                                             <Zap size={18} fill="currentColor" />
                                             Update Credentials
                                         </button>
                                     </div>
                                 </form>
                             </div>
                         </motion.div>
                     )
                 }
            </AnimatePresence>

            <AnimatePresence>
                {isLogModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLogModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold tracking-tight">Add Health Log</h3>
                                <button onClick={() => setIsLogModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSaveLog} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 transition-all hover:border-rose-200 group">
                                        <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase px-1 flex items-center gap-2">
                                            <div className="p-1 bg-rose-100 text-rose-600 rounded-lg group-hover:scale-110 transition-transform"><Activity size={14} /></div> Heart Rate
                                        </label>
                                        <input type="number" placeholder="72" className="input-field bg-white border-none shadow-none focus:ring-0 py-1" value={logForm.heartRate} onChange={e => setLogForm({ ...logForm, heartRate: e.target.value })} required />
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 transition-all hover:border-indigo-200 group">
                                        <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase px-1 flex items-center gap-2">
                                            <div className="p-1 bg-indigo-100 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform"><Droplets size={14} /></div> Glucose
                                        </label>
                                        <input type="number" placeholder="95" className="input-field bg-white border-none shadow-none focus:ring-0 py-1" value={logForm.glucose} onChange={e => setLogForm({ ...logForm, glucose: e.target.value })} required />
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 transition-all hover:border-brand-200 group">
                                        <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase px-1 flex items-center gap-2">
                                            <div className="p-1 bg-brand-100 text-brand-600 rounded-lg group-hover:scale-110 transition-transform"><Heart size={14} /></div> BP (Sys)
                                        </label>
                                        <input type="number" placeholder="120" className="input-field bg-white border-none shadow-none focus:ring-0 py-1" value={logForm.systolic} onChange={e => setLogForm({ ...logForm, systolic: e.target.value })} required />
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 transition-all hover:border-brand-200 group">
                                        <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase px-1 flex items-center gap-2">
                                            <div className="p-1 bg-brand-100 text-brand-400 rounded-lg group-hover:scale-110 transition-transform"><Heart size={14} /></div> BP (Dia)
                                        </label>
                                        <input type="number" placeholder="80" className="input-field bg-white border-none shadow-none focus:ring-0 py-1" value={logForm.diastolic} onChange={e => setLogForm({ ...logForm, diastolic: e.target.value })} required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase px-1">Symptoms</label>
                                    <textarea placeholder="e.g. Mild headache, swelling..." className="input-field min-h-[80px]" value={logForm.symptoms} onChange={e => setLogForm({ ...logForm, symptoms: e.target.value })} />
                                </div>
                                <button type="submit" className="btn-primary w-full py-4 text-lg">Save & Sync</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Doctor Details Modal */}
            <AnimatePresence>
                {isDoctorModalOpen && selectedViewDoctor && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDoctorModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
                            <div className="absolute right-4 top-4 z-10">
                                <button onClick={() => setIsDoctorModalOpen(false)} className="p-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl shadow-sm transition-colors"><X size={20} /></button>
                            </div>

                            <div className="bg-brand-600 p-6 text-center text-white relative">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
                                    <Activity className="absolute -top-10 -left-10 w-48 h-48 rotate-12" />
                                    <Heart className="absolute -bottom-10 -right-10 w-48 h-48 -rotate-12" />
                                </div>

                                <div className="relative inline-block mb-3">
                                    <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-2xl">
                                        <div className="w-full h-full rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-2xl font-black overflow-hidden uppercase">
                                            {selectedViewDoctor.photo ? <img src={selectedViewDoctor.photo} alt={selectedViewDoctor.name} className="w-full h-full object-cover" /> : (selectedViewDoctor.name?.[0] || 'D')}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-lg flex items-center justify-center text-white shadow-lg">
                                        <Activity size={12} />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold tracking-tight leading-tight mb-0.5">{selectedViewDoctor.name}</h3>
                                <p className="text-brand-100 font-bold uppercase tracking-widest text-[9px] mb-1">Medical Specialist</p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                        <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5 tracking-widest">Clinical Affiliation</p>
                                        <p className="font-bold text-slate-800 text-xs">{selectedViewDoctor.hospitalName || 'Independent Practice'}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                        <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5 tracking-widest">Mobile Contact</p>
                                        <p className="font-bold text-slate-800 text-xs">{selectedViewDoctor.mobile || 'Confidential'}</p>
                                    </div>
                                    {selectedViewDoctor.address && (
                                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 sm:col-span-2">
                                            <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5 tracking-widest">Professional Address</p>
                                            <p className="font-bold text-slate-800 text-xs">{selectedViewDoctor.address}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-brand-50/50 p-6 rounded-3xl border border-brand-100/50">
                                    <h4 className="text-[10px] font-black text-brand-600 uppercase mb-2 flex items-center gap-2 tracking-widest">
                                        <Activity size={14} /> Data Access Privacy
                                    </h4>
                                    <p className="text-slate-600 text-[13px] leading-relaxed">
                                        Connecting allows real-time data sharing. Revoke at any time.
                                    </p>
                                </div>

                                {searchStatuses[selectedViewDoctor.email] === 'accepted' ? (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setIsDoctorModalOpen(false);
                                                openChat(selectedViewDoctor);
                                            }}
                                            className="flex-1 py-4 bg-brand-50 text-brand-600 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 border border-brand-100 hover:bg-brand-100 transition-all active:scale-95 text-xs"
                                        >
                                            <Bell size={16} /> Open Chat
                                        </button>
                                        <div className="flex-1 py-4 bg-green-50 text-green-600 rounded-2xl font-black text-center uppercase tracking-widest flex items-center justify-center gap-3 shadow-sm border border-green-100 text-xs">
                                            <Heart fill="currentColor" size={16} /> Connected
                                        </div>
                                    </div>
                                ) : searchStatuses[selectedViewDoctor.email] === 'pending' ? (
                                    <div className="py-4 bg-orange-50 text-orange-600 rounded-2xl font-black text-center uppercase tracking-widest shadow-sm border border-orange-100 text-xs">
                                        Request Pending
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            handleSendFollowRequest(selectedViewDoctor.email);
                                            setIsDoctorModalOpen(false);
                                        }}
                                        className="btn-primary w-full py-4 text-base rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 group"
                                    >
                                        <Activity size={20} className="group-hover:animate-pulse" /> Connect & Share
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Patient Details Modal (For Doctors) */}
            <AnimatePresence>
                {isPatientModalOpen && selectedPatient && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPatientModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
                            <div className="absolute right-4 top-4 z-10">
                                <button onClick={() => setIsPatientModalOpen(false)} className="p-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl shadow-sm transition-colors"><X size={20} /></button>
                            </div>

                             {/* Sidebar Info */}
                             <div className="w-full md:w-72 bg-slate-50 p-6 border-r border-slate-200 flex flex-col items-center text-center overflow-y-auto">
                                <div className="w-24 h-24 shrink-0 mb-4">
                                    <div className="w-full h-full rounded-2xl bg-brand-50 border-2 border-white shadow-xl flex items-center justify-center text-brand-600 text-3xl font-black overflow-hidden relative">
                                        {selectedPatient.photo ? <img src={selectedPatient.photo} alt={selectedPatient.name} className="w-full h-full object-cover" /> : (selectedPatient.name?.[0] || 'P')}
                                        <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white ${getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).bg} animate-pulse shadow-sm`} />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-0.5">{selectedPatient.name}</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px] mb-4">Patient Profile</p>

                                <div className="w-full space-y-2">
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs shadow-sm">
                                        <span className="text-slate-400 font-bold uppercase text-[8px]">Age</span>
                                        <span className="text-slate-900 font-bold">{selectedPatient.age} Years</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-start gap-0.5 text-xs shadow-sm text-left">
                                        <span className="text-slate-400 font-bold uppercase text-[8px]">Pregnancy Stage</span>
                                        <span className="text-slate-900 font-bold capitalize">{selectedPatient.pregnancyType}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-start gap-0.5 text-xs shadow-sm text-left">
                                        <span className="text-slate-400 font-bold uppercase text-[8px]">Contact</span>
                                        <span className="text-slate-900 font-bold">{selectedPatient.mobile || 'Private'}</span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 w-full text-left">
                                    <div className={`p-4 rounded-2xl border ${getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).bg} ${getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).border}`}>
                                        <p className={`${getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).color} font-bold text-[8px] uppercase mb-0.5`}>Status</p>
                                        <p className="font-bold text-slate-900 text-sm">{getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).label}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-8">
                                {/* Risk Assessment */}
                                <section>
                                    <div className={`p-6 rounded-2xl border relative overflow-hidden ${getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).bg} ${getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).border}`}>
                                        <div className="relative z-10">
                                            <h4 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                                                <AlertTriangle className={getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).color} size={20} /> Clinical Assessment
                                            </h4>
                                            <div className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                                                {patientHealthData[selectedPatient.email]?.latestLog?.symptoms && (
                                                    <div className="mb-4 p-5 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm text-slate-800">
                                                        <span className="font-black uppercase text-[10px] text-slate-400 block mb-1">Latest Reported Symptoms:</span>
                                                        <span className="italic">"{patientHealthData[selectedPatient.email].latestLog.symptoms}"</span>
                                                    </div>
                                                )}
                                                <p className="bg-white/30 p-4 rounded-2xl">
                                                    {getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).level === 'urgent' ?
                                                        "CRITICAL: Patient vitals are in the urgent clinical range. Immediate evaluation is required. Recommend direct contact with patient or emergency medical referral." :
                                                        getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).level === 'help' ?
                                                            "ATTENTION: Vitals are outside normal range. This patient requires a follow-up consultation in the next 24-48 hours." :
                                                            "STABLE: Patient vitals are currently within expected ranges. Retain continuous monitoring as scheduled."}
                                                </p>
                                            </div>
                                            <div className="flex gap-4">
                                                <button onClick={() => {
                                                    setIsPatientModalOpen(false);
                                                    openChat(selectedPatient);
                                                }} className="px-6 py-4 bg-brand-50 text-brand-600 rounded-2xl font-bold border border-brand-100 hover:bg-brand-100 transition-all flex items-center gap-2">
                                                    <Bell size={18} /> Chat
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedPatientForAppointment(selectedPatient);
                                                        setAppointmentStep('date');
                                                        setIsPatientModalOpen(false);
                                                        setIsAppointmentModalOpen(true);
                                                    }}
                                                    className={`flex-1 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 text-white shadow-lg transition-all active:scale-95 ${getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).level === 'urgent' ? 'bg-rose-600 hover:bg-rose-700' :
                                                        getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).level === 'help' ? 'bg-orange-500 hover:bg-orange-600' :
                                                            'bg-brand-600 hover:bg-brand-700'
                                                        }`}>
                                                    Take Clinical Action <ChevronRight size={18} />
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                </section>

                                {/* Vital Stats */}
                                <section>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Heart className="text-brand-600" size={16} /> Latest Recorded Vitals
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { label: "Heart Rate", value: patientHealthData[selectedPatient.email]?.latestLog?.heartRate ? `${patientHealthData[selectedPatient.email].latestLog.heartRate} bpm` : '--', icon: Activity, color: "text-rose-500", bg: "bg-rose-50" },
                                            { label: "Blood Pressure", value: patientHealthData[selectedPatient.email]?.latestLog?.systolic ? `${patientHealthData[selectedPatient.email].latestLog.systolic}/${patientHealthData[selectedPatient.email].latestLog.diastolic}` : '--', icon: Heart, color: "text-brand-600", bg: "bg-brand-50" },
                                            { label: "Glucose", value: patientHealthData[selectedPatient.email]?.latestLog?.glucose ? `${patientHealthData[selectedPatient.email].latestLog.glucose} mg/dL` : '--', icon: Droplets, color: "text-blue-500", bg: "bg-blue-50" }
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center text-center shadow-sm hover:border-brand-400 hover:shadow-md hover:bg-white transition-all cursor-pointer group">
                                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} mb-3 shadow-sm`}>
                                                    <stat.icon size={20} />
                                                </div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-wider">{stat.label}</p>
                                                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Historical Logs */}
                                <section>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <TrendingUp className="text-blue-500" size={16} /> Complete Health History
                                    </h4>
                                    {logs.length > 0 ? (
                                        <div className="space-y-4">
                                            {logs.map((log) => (
                                                <div key={log.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-brand-100 transition-colors group/log">
                                                    <div className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 mb-4">
                                                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                                                            {new Date(log.timestamp).toLocaleDateString(undefined, {
                                                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                                            })} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase ${getRiskStatus(log).bg} ${getRiskStatus(log).color}`}>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                                            {getRiskStatus(log).label}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-8 px-4 mb-6">
                                                        <div className="flex items-center gap-3">
                                                            <Activity size={18} className="text-rose-500" />
                                                            <div><p className="text-[9px] text-slate-400 uppercase font-black mb-1">Heart Rate</p><p className="text-lg font-black text-slate-900">{log.heartRate} <span className="text-[10px] text-slate-400">bpm</span></p></div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Heart size={18} className="text-brand-500" />
                                                            <div><p className="text-[9px] text-slate-400 uppercase font-black mb-1">Blood Pressure</p><p className="text-lg font-black text-slate-900">{log.systolic}/{log.diastolic}</p></div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Droplets size={18} className="text-indigo-500" />
                                                            <div><p className="text-[9px] text-slate-400 uppercase font-black mb-1">Glucose Level</p><p className="text-lg font-black text-slate-900">{log.glucose} <span className="text-[10px] text-slate-400">mg/dL</span></p></div>
                                                        </div>
                                                    </div>
                                                    {log.symptoms && (
                                                        <div className="px-6 py-4 bg-brand-50/20 rounded-2xl border border-brand-50/40">
                                                            <p className="text-[9px] text-brand-600 font-black uppercase mb-1 flex items-center gap-1">
                                                                <Activity size={10} /> Reported Symptoms
                                                            </p>
                                                            <p className="text-sm text-slate-700 italic leading-relaxed">"{log.symptoms}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center text-slate-300 border-2 border-dashed border-slate-200 rounded-2xl">
                                            <Activity size={48} className="mx-auto mb-4 opacity-20" />
                                            <p className="font-bold text-lg">No clinical history records found.</p>
                                        </div>
                                    )}
                                </section>

                                {/* Patient Health Profile */}
                                <section>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Heart className="text-brand-600" size={16} /> Health Profile
                                    </h4>
                                    {patientHealthProfiles[selectedPatient.email] ? (() => {
                                        const hp = patientHealthProfiles[selectedPatient.email];
                                        return (
                                            <div className="space-y-5">
                                                {/* Body Metrics */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[
                                                        { label: 'Weight', value: hp.weight ? `${hp.weight} kg` : null, icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
                                                        { label: 'Height', value: hp.height ? `${hp.height} cm` : null, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
                                                        { label: 'Blood Type', value: hp.blood_type, icon: Droplets, color: 'text-brand-600', bg: 'bg-brand-50' }
                                                    ].map((item, i) => (
                                                        <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
                                                            <div className={`p-3 rounded-2xl ${item.bg} ${item.color} mb-3`}><item.icon size={18} /></div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{item.label}</p>
                                                            <p className="text-lg font-black text-slate-900">{item.value || <span className="text-slate-300 text-sm font-bold">—</span>}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Current Conditions */}
                                                {hp.current_conditions?.length > 0 && (
                                                    <div className="bg-orange-50/60 p-6 rounded-3xl border border-orange-100">
                                                        <p className="text-[9px] text-orange-600 font-black uppercase mb-3 flex items-center gap-1"><AlertTriangle size={10} /> Current Medical Conditions</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {hp.current_conditions.map(c => (
                                                                <span key={c} className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-black rounded-xl border border-orange-200">{c}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Past Conditions, Allergies, Medications, Notes */}
                                                <div className="grid grid-cols-1 gap-3">
                                                    {[
                                                        { label: 'Past Conditions', value: hp.past_conditions },
                                                        { label: 'Allergies', value: hp.allergies },
                                                        { label: 'Current Medications', value: hp.current_medications },
                                                        { label: 'Additional Notes', value: hp.notes }
                                                    ].filter(i => i.value).map((item, i) => (
                                                        <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200">
                                                            <p className="text-[9px] text-slate-400 font-black uppercase mb-1">{item.label}</p>
                                                            <p className="text-sm font-bold text-slate-800">{item.value}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                <p className="text-[9px] text-slate-400 font-bold text-center">
                                                    Last updated: {hp.updated_at ? new Date(hp.updated_at).toLocaleDateString() : 'Unknown'}
                                                </p>
                                            </div>
                                        );
                                    })() : (
                                        <div className="py-12 text-center text-slate-300 border-2 border-dashed border-slate-200 rounded-2xl">
                                            <Heart size={40} className="mx-auto mb-3 opacity-20" />
                                            <p className="font-bold">Patient has not filled their health profile yet.</p>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </motion.div >
                    </div >
                )}
            </AnimatePresence >
            {/* Telemedicine Overlay components */}
            {/* AI Care Assistant � only shown for patients/guardians, not doctors */}
            {
                role !== 'doctor' && (
                    <button
                        onClick={() => setIsAiAssistantOpen(true)}
                        className="fixed bottom-8 left-[17rem] z-50 hover:scale-110 active:scale-95 transition-all group flex items-center gap-3"
                    >
                        <div className="relative">
                            <div className="bg-[linear-gradient(to_bottom,#6A4C93,#7C5BB3,#8E6BBF)] p-4 rounded-full shadow-2xl border-2 border-brand-400/50 text-white group-hover:border-brand-400 transition-all">
                                <Sparkles size={24} />
                            </div>
                            <span className="absolute top-0 right-0 h-3 w-3 bg-rose-500 rounded-full border-2 border-white"></span>
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-[10px] font-extrabold text-brand-600 uppercase tracking-widest">AI powered</p>
                            <p className="text-xs font-bold text-slate-900">Care Assistant</p>
                        </div>
                    </button>
                )
            }

            <AnimatePresence>
                {isAiAssistantOpen && role !== 'doctor' && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/60">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-2xl h-[650px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-white"
                        >
                             {/* AI Header */}
                            <div className="p-6 bg-brand-600 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <Bot size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight">Maatri AI</h3>
                                        {(!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'your_actual_api_key_here') && (
                                            <span className="text-[10px] bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Simulation Mode</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <button
                                        onClick={handleClearAiChat}
                                        className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                        title="Clear History"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <button onClick={() => setIsAiAssistantOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* AI Chat History */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                                {aiChatHistory.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-5 px-10">
                                        <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
                                            <Sparkles size={40} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900 mb-2">How can I support you today?</h4>
                                            <p className="text-slate-500 leading-relaxed">
                                                I have access to your latest vitals and pregnancy stage. Ask me about nutrition, symptoms, or clarifying your latest health logs.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
                                            {[
                                                "Are my heart rate readings normal?",
                                                "Explain my latest BP session.",
                                                "Nutrition tips for this week?"
                                            ].map(q => (
                                                <button
                                                    key={q}
                                                    type="button"
                                                    onClick={() => setAiNewMessage(q)}
                                                    className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:border-brand-500 hover:text-brand-600 transition-all text-left"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    aiChatHistory.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-brand-600 text-white rounded-tr-none shadow-lg'
                                                : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm'
                                                }`}>
                                                {msg.parts[0].text}
                                            </div>
                                        </div>
                                    ))
                                )}
                                {isAiLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white p-6 rounded-[2rem] rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-3">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce" />
                                                <div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                <div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Assistant is thinking...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={aiChatEndRef} />
                            </div>

                             {/* AI Input */}
                            <form onSubmit={handleSendAiQuestion} className="p-6 bg-white border-t border-slate-200 flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Ask anything about your health..."
                                    className="flex-1 bg-slate-50 border-none px-6 py-4 rounded-2xl text-base focus:ring-4 focus:ring-brand-50 transition-all font-medium"
                                    value={aiNewMessage}
                                    onChange={e => setAiNewMessage(e.target.value)}
                                    disabled={isAiLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isAiLoading}
                                    className="p-4 bg-brand-600 text-white rounded-2xl shadow-lg hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Clinical Weekly Report Modal */}
            <AnimatePresence>
                {isReportModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsReportModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col border-4 border-white"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-teal-600 rounded-2xl text-white shadow-lg shadow-brand-600/20">
                                        <Download size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900">Clinical Weekly Report</h3>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                                            Registry ID: {role === 'patient' ? currentUser.email : selectedPatient?.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => window.print()}
                                        className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200 shadow-sm flex items-center gap-2 font-bold text-xs"
                                        title="Print Clinical PDF"
                                    >
                                        <Activity size={16} /> Print
                                    </button>
                                    <button
                                        onClick={handleDownloadReport}
                                        className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200 shadow-sm flex items-center gap-2 font-bold text-xs"
                                        title="Download as Document"
                                    >
                                        <Download size={16} /> Download
                                    </button>
                                    <div className="w-px h-10 bg-slate-200 mx-1" />
                                    <button onClick={() => setIsReportModalOpen(false)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-xl shadow-sm transition-all"><X size={20} /></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 print:p-0">
                                <div className="prose prose-slate max-w-none print:shadow-none">
                                    <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-sm">
                                        {reportContent || "No clinical data available for this period."}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-teal-900 text-white flex items-center justify-between rounded-t-[2.5rem]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-xl"><Sparkles size={20} className="text-teal-300" /></div>
                                    <p className="text-xs font-medium opacity-100 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                        Saved to My Reports  Data as of {selectedReportTimestamp ? new Date(selectedReportTimestamp).toLocaleString() : new Date().toLocaleString()}
                                    </p>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Confidential Medical Document</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isChatOpen && activeChatPartner && (
                    <div className="fixed bottom-6 right-6 z-[60] w-full max-w-md h-[650px] pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
                            className="w-full h-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden flex flex-col pointer-events-auto border border-slate-100"
                        >
                            {/* Instagram Header */}
                            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-50 shrink-0 bg-white">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setIsChatOpen(false)} className="md:hidden p-2 -ml-2 text-slate-900 hover:bg-slate-50 rounded-full transition-colors">
                                        <ChevronRight size={24} className="rotate-180" />
                                    </button>
                                    <div className="relative shrink-0">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white text-lg font-black border-2 overflow-hidden transition-transform group-hover:scale-105 ${activeChatPartner.role === 'doctor' ? 'bg-blue-600 border-blue-100' : 'bg-brand-600 border-brand-100'}`}>
                                            {activeChatPartner.photo ? <img src={activeChatPartner.photo} alt={activeChatPartner.name} className="w-full h-full object-cover" /> : (activeChatPartner.name?.[0] || 'P')}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900 leading-tight">{activeChatPartner.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold">Active now</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleCallAction('audio')} className="p-2.5 text-slate-900 hover:bg-slate-50 rounded-full transition-colors"><Activity size={20} /></button>
                                    <button onClick={() => handleCallAction('video')} className="p-2.5 text-slate-900 hover:bg-slate-50 rounded-full transition-colors"><Camera size={20} /></button>
                                    <button
                                        onClick={handleDeleteClinicalChat}
                                        title="Delete Conversation"
                                        className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <button onClick={() => setIsChatOpen(false)} className="hidden md:block p-2.5 text-slate-900 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
                                </div>
                            </div>

                            {/* Messages Area - Instagram Style */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white scroll-smooth custom-scrollbar">
                                <div className="py-12 flex flex-col items-center text-center">
                                    <div className="shrink-0 mb-4">
                                        <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-white text-4xl font-black border-4 shadow-xl overflow-hidden ${activeChatPartner.role === 'doctor' ? 'bg-blue-600 border-blue-100' : 'bg-brand-600 border-brand-100'}`}>
                                            {activeChatPartner.photo ? <img src={activeChatPartner.photo} alt={activeChatPartner.name} className="w-full h-full object-cover" /> : (activeChatPartner.name?.[0] || 'P')}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">{activeChatPartner.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1">{activeChatPartner.role === 'doctor' ? activeChatPartner.hospitalName : `Registry ID: ${activeChatPartner.email}`}</p>
                                    <button className="mt-4 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-lg transition-colors">View Profile</button>
                                </div>

                                {chatMessages.map((msg, idx) => {
                                    const isMine = msg.from_email?.toLowerCase() === currentUser?.email?.toLowerCase();

                                    return (
                                        <div key={msg.id} className={`flex items-end gap-3 ${isMine ? 'justify-end' : 'justify-start'} w-full`}>
                                            {!isMine && (
                                                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-[10px] font-black overflow-hidden border transition-all ${activeChatPartner.role === 'doctor' ? 'bg-blue-600 border-blue-100' : 'bg-brand-600 border-brand-100'}`}>
                                                    {activeChatPartner.photo ? <img src={activeChatPartner.photo} alt={activeChatPartner.name} className="w-full h-full object-cover" /> : (activeChatPartner.name?.[0] || 'P')}
                                                </div>
                                            )}
                                            <div className={`max-w-[80%] group relative flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                                {isMine && (
                                                    <button
                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                        className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full"
                                                        title="Delete message"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                                <div className={`rounded-[1.5rem] text-sm leading-relaxed transition-all shadow-sm ${isMine
                                                    ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-br-[0.3rem]'
                                                    : 'bg-slate-100 text-slate-900 rounded-bl-[0.3rem]'
                                                    } ${msg.type === 'image' || msg.type === 'voice' ? 'p-1 overflow-hidden' : 'px-4 py-2.5'}`}>
                                                    {msg.type === 'image' ? (
                                                        <img src={msg.text} className="max-w-full rounded-[1.2rem] block" alt="Shared photo" />
                                                    ) : msg.type === 'voice' ? (
                                                        <div className="flex items-center gap-3 p-2 min-w-[200px]">
                                                            <button
                                                                onClick={(e) => {
                                                                    const audio = e.currentTarget.nextElementSibling;
                                                                    if (audio.paused) {
                                                                        audio.play();
                                                                    } else {
                                                                        audio.pause();
                                                                    }
                                                                }}
                                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMine ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-brand-600 hover:bg-brand-700 text-white shadow-md'}`}
                                                            >
                                                                <Play size={18} fill="currentColor" />
                                                            </button>
                                                            <audio src={msg.text} className="hidden" onPlay={(e) => {
                                                                e.target.previousElementSibling.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
                                                            }} onPause={(e) => {
                                                                e.target.previousElementSibling.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
                                                            }} onEnded={(e) => {
                                                                e.target.previousElementSibling.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
                                                            }} />
                                                            <div className="flex-1 space-y-1">
                                                                <div className="h-1.5 w-full bg-slate-200/30 rounded-full overflow-hidden">
                                                                    <div className={`h-full animate-pulse ${isMine ? 'bg-white' : 'bg-brand-500'}`} style={{ width: '40%' }}></div>
                                                                </div>
                                                                <p className={`text-[9px] font-bold ${isMine ? 'text-white/70' : 'text-slate-400'}`}>Voice Message</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        msg.text
                                                    )}
                                                </div>
                                                <p className={`text-[9px] mt-1 font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Instagram Input */}
                            <div className="p-4 bg-white border-t border-slate-50 shrink-0">
                                <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-white border border-slate-200 rounded-full px-5 py-2 group focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <label className="hover:text-brand-600 transition-colors cursor-pointer">
                                            <ImageIcon size={20} />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleChatImageUpload} />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={isRecording ? stopRecording : startRecording}
                                            className={`transition-all ${isRecording ? 'text-rose-500 animate-pulse' : 'hover:text-brand-600 text-slate-400'}`}
                                        >
                                            <Mic size={20} />
                                        </button>
                                        <button type="button" className="hover:text-brand-600 transition-colors"><Activity size={20} /></button>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Message..."
                                        className="flex-1 bg-transparent border-none py-2 text-sm focus:ring-0 placeholder:text-slate-400"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className={`font-bold text-sm transition-all ${newMessage.trim() ? 'text-brand-600 scale-100' : 'text-brand-300 scale-95 cursor-default'}`}
                                    >
                                        Send
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}

                {
                    incomingCall && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/60">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-xs rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 animate-[loading_2s_infinite]" />
                                <div className="w-20 h-20 rounded-2xl bg-brand-50 mx-auto mb-4 flex items-center justify-center relative">
                                    <div className="absolute inset-0 rounded-2xl border-4 border-brand-500 animate-ping opacity-20" />
                                    <Activity className="text-brand-600" size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Doctor Calling...</h3>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-10">Incoming {incomingCall.callType} call</p>

                                <div className="flex gap-4">
                                    <button onClick={async () => {
                                        await storage.updateMessageStatus(incomingCall.id, 'declined');
                                        setIncomingCall(null);
                                    }} className="flex-1 py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold flex items-center justify-center gap-2 border border-rose-100 hover:bg-rose-100 transition-colors">
                                        <X size={20} /> Decline
                                    </button>
                                    <button onClick={acceptCall} className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-brand-700 active:scale-95 transition-all">
                                        <Heart size={20} fill="white" /> Accept
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }

                {/* Delete Chat Confirmation Modal */}
                <AnimatePresence>
                    {isDeleteChatConfirmOpen && activeChatPartner && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-5 text-rose-500">
                                        <Trash2 size={28} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2">Delete Conversation?</h3>
                                    <p className="text-slate-500 text-sm mb-1">
                                        All messages with <span className="font-bold text-slate-700">{activeChatPartner.name}</span> will be permanently deleted.
                                    </p>
                                    <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-8">This cannot be undone.</p>
                                    <div className="flex gap-3 w-full">
                                        <button
                                            onClick={() => setIsDeleteChatConfirmOpen(false)}
                                            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmDeleteChat}
                                            className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-200"
                                        >
                                            Delete All
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {
                    isCalling && (
                        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-between p-12 text-white">
                            <div className="text-center space-y-4">
                                <div className="w-28 h-28 rounded-3xl bg-white/10 p-1 mx-auto backdrop-blur-sm">
                                    <div className="w-full h-full rounded-2xl bg-brand-600 flex items-center justify-center text-4xl font-black">
                                        {activeChatPartner?.name?.[0] || '?'}
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black">{activeChatPartner?.name}</h3>
                                <p className="text-brand-400 font-black uppercase text-xs tracking-[0.3em]">{callStatus === 'ringing' ? 'Ringing...' : '04:12'}</p>
                            </div>

                            {callType === 'video' && (
                                <div className="absolute inset-0 z-[-1] opacity-40">
                                    <div className="w-full h-full bg-gradient-to-br from-brand-900 to-slate-900" />
                                    <div className="absolute bottom-10 right-10 w-48 h-72 bg-slate-800 rounded-3xl border-2 border-white/20 shadow-2xl flex items-center justify-center">
                                        <User className="text-white/20" size={48} />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-6 bg-white/10 backdrop-blur-2xl p-5 rounded-3xl border border-white/10 shadow-2xl">
                                <button className="p-5 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90"><Settings size={28} /></button>
                                <button className="p-5 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90"><Activity size={28} /></button>
                                <button onClick={endCall} className="p-8 bg-rose-600 hover:bg-rose-700 rounded-full shadow-2xl shadow-rose-900/40 transition-all active:scale-90 scale-110">
                                    <X size={32} />
                                </button>
                                <button className="p-5 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90"><Camera size={28} /></button>
                                <button className="p-5 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90"><LogOut size={28} /></button>
                            </div>
                        </div>
                    )
                }
                {/* Simulation Log Overlay */}
                {showSimLogs && simMessages.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="fixed bottom-6 right-6 w-80 max-h-[400px] z-50 flex flex-col"
                    >
                        <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                            <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Simulation Logs</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSimMessages([])}
                                        className="text-slate-500 hover:text-white transition-colors p-1"
                                        title="Clear Logs"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    <button
                                        onClick={() => setShowSimLogs(false)}
                                        className="text-slate-500 hover:text-white transition-colors p-1"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-[100px]">
                                <AnimatePresence initial={false}>
                                    {simMessages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ x: 20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-2xl relative group"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${msg.type === 'WhatsApp' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {msg.type}
                                                </span>
                                                <span className="text-[8px] text-slate-500 font-bold">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold mb-1">To: {msg.to}</p>
                                            <p className="text-[11px] text-slate-200 leading-relaxed italic">"{msg.message}"</p>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <div className="p-3 bg-slate-800/30 text-center">
                                <p className="text-[9px] text-slate-500 font-medium">
                                    Simulating outgoing clinical alerts in real-time.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Appointment Modal */}
                {isAppointmentModalOpen && (role === 'doctor' || activeTab === 'calendar') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ y: 50, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 50, scale: 0.95 }}
                            className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsAppointmentModalOpen(false)}
                                className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-brand-50 text-brand-600 rounded-2xl">
                                    <Calendar size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">Schedule</h3>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Clinical Visit</p>
                                </div>
                            </div>

                            <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-50 border-2 border-white shadow-sm flex items-center justify-center text-brand-600 font-black overflow-hidden shrink-0">
                                        {selectedPatient?.photo ? <img src={selectedPatient.photo} alt={selectedPatient?.name} className="w-full h-full object-cover" /> : (selectedPatient?.name?.[0] || 'P')}
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Patient</p>
                                        <p className="font-bold text-slate-800 leading-tight">{selectedPatient?.name}</p>
                                    </div>
                                </div>
                                {appointmentStep === 'time' && (
                                    <button
                                        onClick={() => setAppointmentStep('date')}
                                        className="text-xs font-black text-brand-600 uppercase hover:underline"
                                    >
                                        Change Date
                                    </button>
                                )}
                            </div>

                            {appointmentStep === 'date' ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">
                                            {viewDate.toLocaleString('default', { month: 'long' })} {viewDate.getFullYear()}
                                        </h4>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                                                className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200"
                                            >
                                                <ChevronRight size={18} className="rotate-180" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                                                className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200"
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-2 text-center">
                                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                            <div key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{day}</div>
                                        ))}
                                        {generateCalendarDays().map((day, i) => {
                                            const isToday = day && day.toDateString() === new Date().toDateString();
                                            const isPast = day && day < new Date(new Date().setHours(0, 0, 0, 0));

                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    disabled={!day || isPast}
                                                    onClick={() => {
                                                        setSelectedDate(day);
                                                        setAppointmentStep('time');
                                                        setAppointmentForm(prev => ({ ...prev, date: day.toISOString().split('T')[0] }));
                                                    }}
                                                    className={`h-11 rounded-2xl flex flex-col items-center justify-center text-sm font-black transition-all relative
                                                        ${!day ? 'invisible' : ''}
                                                        ${isPast ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-brand-50 hover:text-brand-600 transform active:scale-90'}
                                                        ${selectedDate && day && day.toDateString() === selectedDate.toDateString() ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' : 'text-slate-700'}
                                                    `}
                                                >
                                                    {day ? day.getDate() : ''}
                                                    {isToday && !selectedDate && <div className="absolute bottom-1.5 w-1 h-1 bg-brand-500 rounded-full" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Select a date to see available slots</p>
                                </div>
                            ) : (
                                <form onSubmit={handleBookAppointment} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="bg-brand-50/50 border border-brand-100 p-4 rounded-3xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-600 shadow-sm">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-black text-brand-600">Selected Date</p>
                                                <p className="font-black text-slate-900">{selectedDate?.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider px-2">Choose Visiting Hours</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map(time => (
                                                <button
                                                    key={time}
                                                    type="button"
                                                    onClick={() => setAppointmentForm(prev => ({ ...prev, time }))}
                                                    className={`py-3 rounded-2xl text-xs font-black transition-all border-2
                                                        ${appointmentForm.time === time
                                                            ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-100'
                                                            : 'bg-white border-slate-100 text-slate-600 hover:border-brand-200 hover:text-brand-600'}
                                                    `}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                            <div className="col-span-3 mt-2 relative">
                                                <input
                                                    type="time"
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                                                    value={appointmentForm.time}
                                                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, time: e.target.value }))}
                                                />
                                                <p className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">Custom Time</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider px-2">Clinical Objective / Reason</label>
                                        <textarea
                                            required
                                            rows="3"
                                            placeholder="e.g. Monthly prenatal screening, reporting dizziness, etc."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none resize-none"
                                            value={appointmentForm.reason}
                                            onChange={(e) => setAppointmentForm(prev => ({ ...prev, reason: e.target.value }))}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-slate-800 active:scale-95 transition-all shadow-2xl flex justify-center items-center gap-3"
                                    >
                                        Finalize Appointment <ChevronRight size={20} />
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence >
            
            {/* Patient Health Profile Modal */}
            <AnimatePresence>
                {isHealthProfileOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHealthProfileOpen(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="p-8 bg-gradient-to-r from-brand-600 to-brand-700 text-white flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                        <Heart size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight">Health Profile</h3>
                                        <p className="text-brand-200 text-xs font-bold">Your complete medical background</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsHealthProfileOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><X size={24} /></button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSaveHealthProfile} className="flex-1 overflow-y-auto p-8 space-y-6">
                                {/* Body Metrics */}
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={14} className="text-brand-500" /> Body Metrics</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Weight (kg)</label>
                                            <input type="number" placeholder="65" className="input-field bg-white border-none shadow-none focus:ring-0 text-lg font-black" value={healthProfileForm.weight} onChange={e => setHealthProfileForm({ ...healthProfileForm, weight: e.target.value })} />
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Height (cm)</label>
                                            <input type="number" placeholder="162" className="input-field bg-white border-none shadow-none focus:ring-0 text-lg font-black" value={healthProfileForm.height} onChange={e => setHealthProfileForm({ ...healthProfileForm, height: e.target.value })} />
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Blood Type</label>
                                            <select className="input-field bg-white border-none shadow-none focus:ring-0 text-lg font-black" value={healthProfileForm.bloodType} onChange={e => setHealthProfileForm({ ...healthProfileForm, bloodType: e.target.value })}>
                                                <option value="">Select</option>
                                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Current Medical Conditions */}
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><AlertTriangle size={14} className="text-orange-400" /> Current Medical Conditions</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['Thyroid', 'Diabetes', 'Hypertension', 'Anaemia', 'PCOS', 'Gestational Diabetes', 'Preeclampsia', 'Asthma', 'Heart Disease', 'Depression/Anxiety', 'Other'].map(cond => (
                                            <button
                                                key={cond}
                                                type="button"
                                                onClick={() => toggleCondition(cond)}
                                                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all border ${healthProfileForm.currentConditions.includes(cond)
                                                    ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'
                                                }`}
                                            >
                                                {cond}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Past Conditions */}
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-blue-400" /> Past Medical Conditions</p>
                                    <textarea rows={2} placeholder="e.g. Surgery in 2019, Dengue in 2022..." className="input-field min-h-[60px] resize-none" value={healthProfileForm.pastConditions} onChange={e => setHealthProfileForm({ ...healthProfileForm, pastConditions: e.target.value })} />
                                </div>

                                {/* Allergies */}
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Thermometer size={14} className="text-rose-400" /> Allergies</p>
                                    <input type="text" placeholder="e.g. Penicillin, Peanuts, Pollen..." className="input-field" value={healthProfileForm.allergies} onChange={e => setHealthProfileForm({ ...healthProfileForm, allergies: e.target.value })} />
                                </div>

                                {/* Current Medications */}
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Droplets size={14} className="text-indigo-400" /> Current Medications</p>
                                    <input type="text" placeholder="e.g. Folic Acid 5mg, Iron supplement, T4..." className="input-field" value={healthProfileForm.currentMedications} onChange={e => setHealthProfileForm({ ...healthProfileForm, currentMedications: e.target.value })} />
                                </div>

                                {/* Notes */}
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Edit size={14} className="text-slate-400" /> Additional Notes</p>
                                    <textarea rows={2} placeholder="Any other relevant health info for your doctor..." className="input-field min-h-[60px] resize-none" value={healthProfileForm.notes} onChange={e => setHealthProfileForm({ ...healthProfileForm, notes: e.target.value })} />
                                </div>

                                <button type="submit" disabled={isSavingHealthProfile} className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
                                    {isSavingHealthProfile ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</> : <><CheckCircle2 size={20} /> Save Health Profile</>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Dashboard;
