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
    Mic, Pause, UserPlus, Lock
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

        const totalDuration = 5000;
        const intervalTime = totalDuration / fullDemoData.length;

        const timer = setInterval(() => {
            if (currentIndex < fullDemoData.length) {
                const currentPoint = fullDemoData[currentIndex];
                setDemoDataPoints(prev => {
                    const next = [...prev];
                    next[currentIndex] = { ...currentPoint };
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
        const msg = `?? EMERGENCY: Maatri Shield detected critical vitals (BP: ${vitals.sys}/${vitals.dia}). Location: ${currentUser?.address || 'Saved Home Address'}. Help is being dispatched.`;

        // Browser notification
        browserNotifications.send("CRITICAL EMERGENCY", msg);

        // Storage Notification
        await storage.addNotification(currentUser.email, 'SOS', msg);

        // Twilio SMS
        if (currentUser?.mobile) {
            twilioMock.sendSMS(currentUser.mobile, msg);
        }
        if (currentUser?.emergencyContact) {
            twilioMock.sendSMS(currentUser.emergencyContact, `?? EMERGENCY ALERT for ${currentUser.name}: Critical vitals detected. ${msg}`);
            twilioMock.sendWhatsApp(currentUser.emergencyContact, `?? EMERGENCY: ${currentUser.name} needs immediate help. Live Location: https://maps.google.com/?q=current+location. [ REPLY 'SAFE' TO CANCEL ]`);
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

            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
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
                const requests = await storage.getPendingRequests(user.email);
                // Pre-resolve sender names for pending requests
                const requestsWithNames = await Promise.all(requests.map(async r => {
                    const sender = await storage.getUserByEmail(r.from_email);
                    return { ...r, senderName: sender?.name || r.from_email.split('@')[0] };
                }));
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

                // Fetch initial pending requests instantly so user doesn't wait 5s
                const pending = await storage.getPendingRequests(user.email);
                const requestsWithNames = await Promise.all(pending.map(async r => {
                    const sender = await storage.getUserByEmail(r.from_email);
                    return { ...r, senderName: sender?.name || r.from_email.split('@')[0] };
                }));
                setPendingRequests(requestsWithNames);

                // Fetch connected partners (doctors) for chat
                const allUsers = await storage.getUsers();
                const partners = [];
                for (const u of allUsers) {
                    if (u.role === 'doctor') {
                        const status = await storage.getConnectionStatus(user.email, u.email);
                        if (status === 'accepted') partners.push(u);
                    }
                }
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
                const pending = await storage.getPendingRequests(user.email);
                const requestsWithNames = await Promise.all(pending.map(async r => {
                    const sender = await storage.getUserByEmail(r.from_email);
                    return { ...r, senderName: sender?.name || r.from_email.split('@')[0] };
                }));
                setPendingRequests(requestsWithNames);

                if (user.role === 'patient') {
                    const allUsers = await storage.getUsers();
                    const partners = [];
                    for (const u of allUsers) {
                        if (u.role === 'doctor') {
                            const status = await storage.getConnectionStatus(user.email, u.email);
                            if (status === 'accepted') partners.push(u);
                        }
                    }
                    setConnectedPartners(partners);
                }

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
        }, 5000);
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
                        const message = "?? Time for your hydration! Staying consistent helps keep your Maatri Shield score in the green.";
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
                        const message = "?? Time for your medicine! Staying consistent helps keep your Maatri Shield score in the green.";
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
            if (role === 'doctor' && activeTab === 'reports' && selectedPatient) {
                const reports = await storage.getClinicalReports(selectedPatient.email);
                setPatientReports(reports);
            }
        };
        fetchReports();
    }, [role, activeTab, selectedPatient]);

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
        const pending = await storage.getPendingRequests(currentUser.email);
        // Pre-resolve sender names for pending requests
        const requestsWithNames = await Promise.all(pending.map(async r => {
            const sender = await storage.getUserByEmail(r.from_email);
            return { ...r, senderName: sender?.name || r.from_email.split('@')[0] };
        }));
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
            const msg = `?? EMERGENCY: ${currentUser.name} is requesting immediate help via SOS Trigger.`;
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
                text: `?? Started a ${type} call`,
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
                    const msg = `? Hello ${fixedForm.name || 'User'}, your Maatri Shield profile has been updated successfully. Your mobile notifications are now active.`;
                    twilioMock.sendSMS(fixedForm.mobile, msg);
                    twilioMock.sendWhatsApp(fixedForm.mobile, msg);
                }
                if (fixedForm.emergencyContact) {
                    const msg = `?? Alert: You have been set as the Emergency Contact for ${fixedForm.name || 'a Maatri Shield user'}. You will receive alerts in case of clinical emergencies.`;
                    twilioMock.sendSMS(fixedForm.emergencyContact, msg);
                    twilioMock.sendWhatsApp(fixedForm.emergencyContact, msg);
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
            const errorMsg = { role: 'model', parts: [{ text: "?? **System Error**: Something went wrong while processing your request. Please try again or refresh the page." }] };
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

    const handleDeleteClinicalChat = async () => {
        if (window.confirm(`Delete all messages with ${activeChatPartner.name}? This cannot be undone.`)) {
            await storage.clearMessages(currentUser.email, activeChatPartner.email);
            setChatMessages([]);
            alert("Chat history deleted.");
        }
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
                const chatMsg = `?? New Appointment Scheduled:\nDate: ${appointmentForm.date}\nTime: ${appointmentForm.time}\nReason: ${appointmentForm.reason}\n\nPlease be prepared for the consultation.`;
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
                    const smsMsg = `??? MaatriShield Alert: Dr. ${currentUser.name} scheduled an appointment on ${appointmentForm.date} at ${appointmentForm.time}. Reason: ${appointmentForm.reason}.`;
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


    if (!currentUser) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-300">Loading Clinical Interface...</div>;

    return (
        <div className="min-h-screen bg-white flex font-sans relative">
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

            {/* Sidebar */}
            <aside className={`fixed lg:relative w-64 bg-[linear-gradient(to_bottom,#6A4C93,#7C5BB3,#8E6BBF)] h-screen flex flex-col p-4 z-50 transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-2xl`}>
                <div className="p-4 flex flex-col items-center gap-2 mb-8 text-center">
                    <img src={logo} alt="Maatri Shield" className="w-16 h-16 object-contain mix-blend-screen shrink-0" />
                    <span className="hidden md:block font-black text-sm uppercase tracking-[0.3em] text-white/90">Maatri Shield</span>
                </div>

                {/* Emergency SOS Button */}
                {(role === 'patient' || role === 'guardian') && (
                    <div className="px-4 mb-8">
                        <button
                            onClick={handleSOS}
                            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs transition-all shadow-2xl ${isSOSTriggered
                                ? 'bg-red-600 text-white animate-pulse'
                                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(225,29,72,0.6)] border-2 border-transparent'}`}
                        >
                            <AlertTriangle size={18} className={isSOSTriggered ? 'animate-bounce' : ''} />
                            <span className="hidden md:block">Emergency SOS</span>
                        </button>
                    </div>
                )}

                <nav className="flex-1 space-y-2">
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
                                if (item.id === 'settings') handleProfileEdit();
                                else {
                                    setActiveTab(item.id);
                                    if (item.id === 'notifications') {
                                        // Mark as read immediately when switching
                                        setClinicalNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                        if (currentUser) storage.markNotificationsAsRead(currentUser.email);
                                    }
                                    if (item.id === 'patients-list') setPatientFilter('all');
                                    // Clear selected patient when switching to reports or find-doctors to ensure fresh start
                                    if (['reports', 'find-doctors'].includes(item.id) && role === 'doctor') {
                                        setSelectedPatient(null);
                                    }
                                }
                            }}
                            className={`flex items-center gap-4 w-full p-3 rounded-xl transition-all font-medium ${activeTab === item.id
                                ? 'bg-brand-500/20 text-white font-bold border-l-4 border-brand-400'
                                : 'text-white/90 hover:text-white hover:bg-white/10 hover:font-semibold border-l-4 border-transparent'
                                } relative`}
                        >
                            <item.icon size={20} />
                            <span className="hidden md:block">{item.label}</span>
                            {item.id === 'notifications' && clinicalNotifications.filter(n => !n.read && (role !== 'doctor' || n.type !== 'water')).length > 0 && (
                                <span className="absolute top-3 right-3 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-10 px-4 mb-6">
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-3">Clinical System</p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-300">
                                <Zap size={16} />
                            </div>
                            <span className="text-xs font-bold text-white/80">V2.4 Active</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 min-w-0 transition-all duration-500 ${activeTab === 'analytics' ? 'bg-white' : ''} p-4 md:p-8`}>
                <header className="flex justify-between items-center mb-12 gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 bg-slate-100 rounded-xl text-slate-600 shadow-sm"
                        >
                            <Zap size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-purple-600 capitalize">{role} Dashboard</h1>
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
                                                ?? Welcome, {currentUser?.name?.split(' ')[0] || 'Mama'}! Every journey starts with one step.
                                            </motion.span>
                                        ) : (
                                            <>
                                                <span>Your daily health overview.</span>
                                                <motion.span
                                                    initial={{ opacity: 0.8, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
                                                    className="inline-flex items-center gap-1 bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-teal-200 shadow-sm"
                                                >
                                                    ? Healthy today, happy tomorrow
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
                                        className={`p-4 bg-white/50 backdrop-blur-xl rounded-2xl text-slate-400 hover:text-brand-600 hover:bg-white transition-all border border-slate-200 shadow-sm relative ${pendingRequests.length > 0 ? 'animate-pulse text-brand-500 border-brand-200' : ''}`}
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
                                        // Immediate UI feedback for notifications
                                        setClinicalNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                        if (currentUser) await storage.markNotificationsAsRead(currentUser.email);
                                    }}
                                    className={`p-4 bg-white/50 backdrop-blur-xl rounded-2xl text-slate-400 hover:text-brand-600 hover:bg-white transition-all border border-slate-200 shadow-sm relative ${clinicalNotifications.some(n => !n.read) ? 'animate-pulse text-brand-500 border-brand-200' : ''}`}
                                >
                                    <Bell size={24} />
                                    {clinicalNotifications.filter(n => !n.read && (role !== 'doctor' || n.type !== 'water')).length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
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
                                            className="absolute right-0 top-12 w-80 glass p-4 rounded-3xl shadow-2xl z-50 border border-white/40 backdrop-blur-xl"
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
                                        className="absolute right-0 top-16 w-72 glass p-6 rounded-[2.5rem] shadow-2xl z-50 border border-white/40 backdrop-blur-xl"
                                    >
                                        <div className="flex flex-col items-center mb-6">
                                            <div className={`w-20 h-20 rounded-3xl mb-4 border-4 border-white shadow-lg flex items-center justify-center text-white text-3xl font-black overflow-hidden ${role === 'doctor' ? 'bg-blue-600' :
                                                role === 'guardian' ? 'bg-purple-600' :
                                                    'bg-brand-600'
                                                }`}>
                                                {currentUser?.photo ? (
                                                    <img src={currentUser.photo} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    currentUser?.name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U'
                                                )}
                                            </div>
                                            <h3 className="font-black text-xl text-slate-900 leading-tight">{currentUser?.name || 'User'}</h3>
                                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">{role}</p>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            {role === 'doctor' && currentUser?.hospitalName && (
                                                <div className="bg-brand-50/50 p-3 rounded-2xl border border-brand-100">
                                                    <p className="text-[9px] text-brand-600 uppercase font-black mb-1">Clinic / Hospital</p>
                                                    <p className="text-sm font-black text-slate-800">{currentUser?.hospitalName || 'Clinical Facility'}</p>
                                                </div>
                                            )}
                                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-white/50">
                                                <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Email Identifier</p>
                                                <p className="text-xs font-bold text-slate-700 truncate">{currentUser?.email || '...'}</p>
                                            </div>
                                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-white/50">
                                                <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Contact Status</p>
                                                <p className="text-xs font-bold text-slate-700">{currentUser?.mobile || 'Not provided'}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                handleProfileEdit();
                                                setShowQuickProfile(false);
                                            }}
                                            className="w-full py-3.5 bg-brand-600 rounded-2xl text-white font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-100"
                                        >
                                            <Edit size={16} /> Edit Settings
                                        </button>

                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </header >

                {activeTab === 'find-doctors' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Connect with Doctors</h2>
                            <p className="text-slate-500">Search by Name, Hospital, or Mobile Number to request data sharing.</p>
                        </div>

                        <div className="relative group max-w-2xl">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={24} />
                            <input
                                type="text"
                                placeholder="Search e.g. 'City Life Hospital' or '9876543210'..."
                                className="w-full pl-16 pr-6 py-6 bg-white rounded-[2rem] border-2 border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 shadow-sm transition-all text-lg font-medium"
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
                                            className="glass p-4 rounded-[2rem] flex flex-col items-center text-center cursor-pointer hover:border-brand-300 transition-colors group"
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
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                <div>
                                    <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Messages</h2>
                                    <p className="text-slate-500 font-medium">Connect with your clinical care team and patients.</p>
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

                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
                                <div className="divide-y divide-slate-50">
                                    {(role === 'doctor' ? patients : connectedPartners)
                                        .filter(p => p.name.toLowerCase().includes(chatSearchQuery.toLowerCase()))
                                        .map(partner => (
                                            <motion.div
                                                key={partner.email}
                                                whileHover={{ bg: "rgba(248, 250, 252, 0.8)" }}
                                                className="p-6 flex items-center gap-5 cursor-pointer group transition-all"
                                                onClick={() => openChat(partner)}
                                            >
                                                <div className="relative shrink-0">
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black border-2 transition-transform group-hover:scale-105 overflow-hidden ${partner.role === 'doctor' ? 'bg-blue-600 border-blue-100' : 'bg-brand-600 border-brand-100'}`}>
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
                                                        {partner.role === 'doctor' ? partner.hospitalName || 'Clinical Specialist' : `${partner.pregnancyType} Stage � Age ${partner.age}`}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-brand-600 hover:bg-brand-50 transition-all">
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

                                {(role === 'doctor' ? patients : connectedPartners).length === 0 && (
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
                                <div className="lg:col-span-2 bg-white/40 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl shadow-indigo-100/10 border border-white/60">
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
                                                        className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border-l-[6px] border-teal-500 shadow-sm"
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
                                        <div className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-dashed border-slate-100 text-center">
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
                                        <div className="py-20 text-center bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                                            <Bell size={48} className="mx-auto mb-4 text-slate-100" />
                                            <p className="text-slate-400 font-bold">No clinical notifications found.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="glass p-8 rounded-[2.5rem] bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-2xl shadow-brand-200">
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
                        <>
                            {role === 'doctor' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div
                                            onClick={() => { setPatientFilter('urgent'); setActiveTab('patients-list'); }}
                                            className="glass p-8 rounded-[2.5rem] border-l-8 border-rose-500 shadow-xl shadow-rose-100/20 cursor-pointer hover:scale-105 transition-all"
                                        >
                                            <p className="text-[10px] text-rose-500 font-black uppercase tracking-[0.2em] mb-2">Critical Attention</p>
                                            <h4 className="text-4xl font-black text-slate-800 mb-1">{riskStats.high}</h4>
                                            <p className="text-sm text-slate-500 font-bold">High Risk Patients</p>
                                        </div>
                                        <div
                                            onClick={() => { setPatientFilter('help'); setActiveTab('patients-list'); }}
                                            className="glass p-8 rounded-[2.5rem] border-l-8 border-amber-500 shadow-xl shadow-amber-100/20 cursor-pointer hover:scale-105 transition-all"
                                        >
                                            <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em] mb-2">Clinical Review</p>
                                            <h4 className="text-4xl font-black text-slate-800 mb-1">{riskStats.medium}</h4>
                                            <p className="text-sm text-slate-500 font-bold">Moderate Risk Patients</p>
                                        </div>
                                        <div
                                            onClick={() => { setPatientFilter('normal'); setActiveTab('patients-list'); }}
                                            className="glass p-8 rounded-[2.5rem] border-l-8 border-teal-500 shadow-xl shadow-brand-100/20 cursor-pointer hover:scale-105 transition-all"
                                        >
                                            <p className="text-[10px] text-teal-500 font-black uppercase tracking-[0.2em] mb-2">Stable Monitoring</p>
                                            <h4 className="text-4xl font-black text-slate-800 mb-1">{riskStats.low}</h4>
                                            <p className="text-sm text-slate-500 font-bold">Normal Risk Patients</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/40 backdrop-blur-xl p-10 rounded-[3rem] border border-white/60 shadow-2xl flex flex-col md:flex-row items-center gap-8">
                                        <div className="w-20 h-20 bg-brand-100 rounded-3xl flex items-center justify-center text-brand-600">
                                            <Sparkles size={40} />
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <h3 className="text-2xl font-black text-slate-900 mb-2">Daily Clinical Insight</h3>
                                            <p className="text-slate-600 leading-relaxed font-medium">
                                                {riskStats.high > 0
                                                    ? `You have ${riskStats.high} patients requiring immediate intervention. Please review their latest vitals and symptoms in the directory.`
                                                    : "All connected patients are showing stable clinical markers today. Continue routine surveillance."}
                                            </p>
                                        </div>
                                        <button onClick={() => { setPatientFilter('all'); setActiveTab('patients-list'); }} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                                            View Patients <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {role !== 'doctor' && (
                                <>
                                    {/* Welcome banner for new users with no logs */}
                                    {logs.length === 0 && role === 'patient' ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-6 rounded-3xl mb-8 flex items-center gap-5 border shadow-lg backdrop-blur-md bg-gradient-to-r from-brand-50 via-purple-50 to-pink-50 border-brand-100"
                                        >
                                            <div className="text-3xl shrink-0">??</div>
                                            <div>
                                                <p className="font-black text-brand-800 text-base mb-1">
                                                    Welcome to Maatri Shield, {currentUser?.name?.split(' ')[0] || 'Mama'}!
                                                </p>
                                                <p className="text-brand-600 text-sm font-medium leading-relaxed">
                                                    "Every step you take today nurtures the life growing within you. You are stronger than you know."
                                                </p>
                                                <p className="mt-3 text-xs font-black text-brand-400 uppercase tracking-widest">Tap &ldquo;Add Log&rdquo; above to begin your health journey &rarr;</p>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`p-6 rounded-3xl mb-8 flex items-center gap-4 border shadow-sm backdrop-blur-md transition-all ${alert.includes('Monitoring active')
                                                ? 'bg-gradient-to-r from-[#F8F7FF] to-purple-50 border-brand-100'
                                                : 'bg-amber-100/50 border-amber-200'
                                                }`}
                                        >
                                            <div className={`p-3 rounded-2xl transition-all ${alert.includes('Monitoring active')
                                                ? 'bg-teal-200/50 text-brand-600'
                                                : 'bg-amber-200/50 text-amber-700'
                                                }`}>
                                                <Bell size={24} className={alert.includes('Monitoring active') ? "animate-pulse" : "animate-bounce"} />
                                            </div>
                                            <div>
                                                {alert.includes('Monitoring active') ? (
                                                    <div className="flex flex-col gap-1">
                                                        <p className="font-black text-brand-900 text-sm flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                                                            SYSTEM STATUS: LIVE
                                                        </p>
                                                        <p className="font-bold text-teal-800">{alert}</p>
                                                    </div>
                                                ) : (
                                                    <p className="font-bold text-amber-800">{alert}</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                                        {stats.map((stat, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="rounded-[2.5rem] transition-all cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-brand-100/20 glass p-8 shadow-xl"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-slate-500 text-xs font-extrabold uppercase tracking-widest">{stat.label}</p>
                                                    {(stat.label === 'Heart Rate' || stat.label === 'Blood Pressure' || stat.label === 'Glucose Level') && (
                                                        <motion.span
                                                            animate={stat.status.includes('Today') ? { opacity: [0.7, 1, 0.7] } : {}}
                                                            transition={{ repeat: Infinity, duration: 2 }}
                                                            className={`${stat.status.includes('Today') ? 'bg-teal-100 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-500 border-slate-200'} text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border shadow-sm flex items-center gap-1`}
                                                        >
                                                            {stat.status.includes('Today') && <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>}
                                                            {stat.status.includes('Today') ? 'Today' : 'Latest'}
                                                        </motion.span>
                                                    )}
                                                </div>
                                                <h3 className="text-4xl font-extrabold tracking-tight mb-1 text-slate-900">{stat.value}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${stat.color}`}>{stat.status}</span>
                                                    {stat.status === 'Active' && (
                                                        <motion.span
                                                            animate={{ scale: [1, 1.2, 1] }}
                                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                                            className="w-2 h-2 rounded-full bg-brand-500 shadow-lg shadow-brand-200"
                                                        ></motion.span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="glass p-8 rounded-3xl">
                                            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 mb-6 flex items-center gap-2">
                                                <Activity className="text-brand-600" size={24} />
                                                {role === 'guardian' ? `History: ${selectedPatient?.name || 'Patient'}` : 'Recent Logs'}
                                            </h3>
                                            {(role === 'guardian' && guardianConnectionStatus !== 'accepted') ? (
                                                <div className="h-full py-20 text-center text-slate-400">
                                                    <Lock size={48} className="mx-auto mb-4 opacity-20" />
                                                    <p className="font-bold">Awaiting patient approval to view history.</p>
                                                </div>
                                            ) : logs.length > 0 ? (
                                                <div className="space-y-6">
                                                    {logs.slice(0, 2).map((log) => (
                                                        <div key={log.id} className="relative pl-8 border-l-2 border-slate-200 pb-2">
                                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand-500 border-4 border-white shadow-sm"></div>
                                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                                                <p className="text-xs text-slate-400 font-bold mb-2">
                                                                    {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Activity size={12} className="text-rose-500" />
                                                                        <div><p className="text-[10px] text-slate-400 uppercase font-black">HR</p><p className="font-bold">{log.heartRate}</p></div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Heart size={12} className="text-brand-500" />
                                                                        <div><p className="text-[10px] text-slate-400 uppercase font-black">BP</p><p className="font-bold">{log.systolic}/{log.diastolic}</p></div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Droplets size={12} className="text-indigo-500" />
                                                                        <div><p className="text-[10px] text-slate-400 uppercase font-black">SG</p><p className="font-bold">{log.glucose}</p></div>
                                                                    </div>
                                                                </div>
                                                                {log.symptoms && <p className="mt-3 text-xs text-slate-500 border-t pt-2 italic">"{log.symptoms}"</p>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="h-full py-20 text-center text-slate-300">
                                                    <Activity size={48} className="mx-auto mb-4 opacity-10" />
                                                    <p>No activity logs found.</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-8">
                                            <div className="glass p-8 rounded-3xl">
                                                <h3 className="text-xl font-extrabold tracking-tight text-slate-900 mb-6 flex items-center gap-2">
                                                    <TrendingUp className="text-blue-500" size={24} /> Assessment
                                                </h3>
                                                {(role === 'guardian' && guardianConnectionStatus !== 'accepted') ? (
                                                    <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-dashed border-slate-200 text-center py-20">
                                                        <Lock className="mx-auto mb-4 text-slate-300" size={48} />
                                                        <p className="text-slate-500 font-bold">Awaiting patient approval</p>
                                                    </div>
                                                ) : (selectedPatient || role === 'patient') ? (
                                                    <div className={`p-8 rounded-[2rem] border relative overflow-hidden ${getRiskStatus(logs[0]).bg
                                                        } ${getRiskStatus(logs[0]).border}`}>
                                                        <div className="relative z-10">
                                                            <p className={`${getRiskStatus(logs[0]).color} font-black text-xs uppercase mb-2`}>
                                                                Risk Level: {getRiskStatus(logs[0]).label}
                                                            </p>
                                                            <h4 className="text-3xl font-black text-slate-900 mb-4">
                                                                {getRiskStatus(logs[0]).level === 'urgent' ? 'Immediate Action' :
                                                                    getRiskStatus(logs[0]).level === 'help' ? 'Clinical Review' :
                                                                        'Stable Condition'}
                                                            </h4>
                                                            <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                                                {logs[0]?.symptoms ? (
                                                                    <span className="block mb-2 font-bold text-slate-800">
                                                                        Reported Symptoms: <span className="italic font-medium text-rose-500">"{logs[0].symptoms}"</span>
                                                                    </span>
                                                                ) : null}
                                                                "Patient vitals are within clinical expectations. Continue routine monitoring."
                                                            </p>
                                                            {role === 'doctor' ? (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedPatientForAppointment(selectedPatient);
                                                                        setIsAppointmentModalOpen(true);
                                                                        setAppointmentStep('date');
                                                                    }}
                                                                    className="mt-4 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 w-full shadow-xl shadow-slate-200/50"
                                                                >
                                                                    Take Clinical Action <Calendar size={18} />
                                                                </button>
                                                            ) : (
                                                                <button className={`${getRiskStatus(logs[0]).color} font-bold flex items-center gap-1`}>
                                                                    Full Report <ChevronRight size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <Heart className={`absolute -right-8 -bottom-8 w-48 h-48 -rotate-12 opacity-5 ${getRiskStatus(logs[0]).color}`} fill="currentColor" />
                                                    </div>
                                                ) : (
                                                    <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-dashed border-slate-200 text-center py-20">
                                                        <Activity className="mx-auto mb-4 text-slate-200" size={48} />
                                                        <p className="text-slate-400 font-bold">Select a patient to see assessment</p>
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
                                                                            {new Date(apt.appointment_time).toLocaleDateString([], { month: 'short', day: 'numeric' })} � {new Date(apt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                        <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200">
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
                                                            className={`p-6 rounded-[2rem] text-left transition-all border-2 w-full flex flex-col md:flex-row items-center gap-6 shadow-sm hover:shadow-xl bg-white text-slate-600 border-white shadow-slate-200/30`}
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
                                            <div className="col-span-full py-20 text-center bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                                <UsersIcon size={48} className="mx-auto mb-4 text-slate-200" />
                                                <p className="text-slate-400 font-bold">Your patient directory is empty.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Patient Profile Header */}
                                    <div className="bg-white/70 backdrop-blur-md border-2 border-brand-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-2xl border-4 border-teal-500/20 overflow-hidden shadow-inner bg-brand-50 flex items-center justify-center text-brand-600 text-2xl font-black">
                                                {(role === 'doctor' ? selectedPatient?.photo : currentUser?.photo) ? (
                                                    <img
                                                        src={(role === 'doctor' ? selectedPatient?.photo : currentUser?.photo)}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : ((role === 'doctor' ? selectedPatient?.name : currentUser?.name)?.[0] || 'P')}
                                            </div>
                                            <div>
                                                {role === 'doctor' && (
                                                    <button
                                                        onClick={() => setSelectedPatient(null)}
                                                        className="mb-2 flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-brand-100 transition-all border border-brand-100/50"
                                                    >
                                                        <ChevronRight size={14} className="rotate-180" /> Back to Patients
                                                    </button>
                                                )}
                                                <h2 className="text-2xl font-bold text-slate-900">{(role === 'doctor' ? selectedPatient?.name : currentUser?.name) || "Loading..."}</h2>
                                                {role === 'patient' && <p className="text-brand-600 text-xs font-black uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full inline-block mt-1">Prenatal Tracking Active</p>}
                                                <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                                                    <Calendar size={14} /> {(role === 'doctor' ? selectedPatient : currentUser) ? `${(role === 'doctor' ? selectedPatient : currentUser).age} Years � ${(role === 'doctor' ? selectedPatient : currentUser).pregnancyType}` : "Clinical Surveillance Interface"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setIsDemoMode(!isDemoMode)}
                                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all shadow-lg ${isDemoMode
                                                    ? 'bg-rose-500 text-white shadow-rose-200'
                                                    : 'bg-white text-slate-700 border-2 border-slate-100 hover:border-brand-200'
                                                    }`}
                                            >
                                                {isDemoMode ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                                {isDemoMode ? 'Stop Demo' : 'Start Demo'}
                                                {isDemoMode && <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 bg-white rounded-full ml-1" />}
                                            </button>

                                            {isDemoMode && (
                                                <button
                                                    onClick={handleResetDemo}
                                                    className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl font-bold transition-all shadow-lg hover:bg-black active:scale-95"
                                                >
                                                    <Trash2 size={18} />
                                                    Reset Demo
                                                </button>
                                            )}

                                            <AnimatePresence>
                                                {isSosPulsing && (
                                                    <motion.button
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.7)] hover:bg-red-700 transition-all animate-pulse z-10"
                                                    >
                                                        <AlertTriangle size={20} className="animate-bounce" />
                                                        Deploy Ambulance
                                                    </motion.button>
                                                )}
                                            </AnimatePresence>
                                            <button
                                                onClick={handleGenerateReport}
                                                disabled={isGeneratingReport || !navigator.onLine}
                                                title={!navigator.onLine ? "Available once synced" : ""}
                                                className={`flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-2xl hover:bg-teal-700 transition-all shadow-md shadow-brand-600/20 ${isGeneratingReport || !navigator.onLine ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <Download size={18} className={isGeneratingReport ? 'animate-bounce' : ''} />
                                                {isGeneratingReport ? 'Generating Report...' : 'Generate Weekly Report'}
                                            </button>

                                            {role === 'doctor' && (
                                                <button
                                                    onClick={() => setIsAppointmentModalOpen(true)}
                                                    className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-2xl hover:bg-brand-700 transition-all shadow-md shadow-brand-600/20"
                                                >
                                                    <Calendar size={18} /> Schedule Appointment
                                                </button>
                                            )}

                                            <div className="hidden lg:block w-[1px] h-10 bg-slate-200 mx-2"></div>
                                            <div className="hidden lg:flex flex-col items-end">
                                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{isDemoMode ? 'Live Risk' : 'Current Risk'}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-8">
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
                                                    <span className="font-bold text-brand-600">{isDemoMode ? demoRiskPercent.toFixed(2) : (getRiskStatus(logs[0])?.score || 0.2).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Blood Pressure Card */}
                                        <div className="glass p-8 shadow-sm relative group hover:border-brand-400/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900">Blood Pressure</h3>
                                                    <p className="text-sm text-slate-400">Weekly Performance Index</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 rounded-full border border-rose-100">
                                                    <span className="text-[10px] font-black text-rose-600 uppercase">systolic</span>
                                                    <span className="text-sm font-black text-rose-700">145</span>
                                                </div>
                                            </div>
                                            <div className="h-[220px] w-full rounded-2xl">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={weeklyTrends}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                                        <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                                        <Area type="monotone" dataKey="sys" stroke="#f43f5e" strokeWidth={3} fill="url(#colorSys)" fillOpacity={0.1} />
                                                        <Area type="monotone" dataKey="dia" stroke="#fbbf24" strokeWidth={3} fill="url(#colorDia)" fillOpacity={0.1} />
                                                        <defs>
                                                            <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                            </linearGradient>
                                                            <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Risk Score Card */}
                                        <div className="glass p-8 shadow-sm flex flex-col hover:border-brand-400/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                                            <h3 className="text-xl font-black text-slate-900 mb-2">Risk Score</h3>
                                            <div className="flex-1 flex flex-col items-center justify-center py-4">
                                                <div className="w-full max-w-[280px]">
                                                    <GaugeChart
                                                        id="risk-gauge-analytics"
                                                        nrOfLevels={30}
                                                        colors={['#10b981', '#f59e0b', '#ef4444']}
                                                        arcWidth={0.15}
                                                        percent={isDemoMode ? demoRiskPercent : (getRiskStatus(logs[0])?.score || 0.2)}
                                                        textColor="#1e293b"
                                                        needleColor="#94a3b8"
                                                        needleBaseColor="#475569"
                                                        hideText={true}
                                                    />
                                                </div>
                                                <div className="text-center -mt-6">
                                                    <p className="text-4xl font-black text-slate-900">{isDemoMode ? demoRiskPercent.toFixed(2) : (getRiskStatus(logs[0])?.score || 0.2).toFixed(2)}</p>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Current Risk</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Heart Rate Card */}
                                        <div className="glass p-8 shadow-sm hover:border-brand-400/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-xl font-black text-slate-900">Heart Rate</h3>
                                                <Activity size={24} className="text-brand-600" />
                                            </div>
                                            <div className="h-[200px] w-full rounded-2xl">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={weeklyTrends}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                                        <Tooltip contentStyle={{ borderRadius: '24px', border: 'none' }} />
                                                        <Line type="monotone" dataKey="hr" stroke="#14b8a6" strokeWidth={4} dot={{ r: 4, fill: '#14b8a6', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff' }} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Blood Sugar Card */}
                                        <div className="glass p-8 shadow-sm hover:border-brand-400/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-xl font-black text-slate-900">Blood Sugar</h3>
                                                <Droplets size={24} className="text-indigo-500" />
                                            </div>
                                            <div className="h-[200px] w-full rounded-2xl">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={weeklyTrends}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                                        <Tooltip contentStyle={{ borderRadius: '24px', border: 'none' }} />
                                                        <Line type="monotone" dataKey="g" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff' }} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="glass p-8 shadow-sm hover:border-brand-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                            <h3 className="text-xl font-black text-slate-900 mb-8">Symptoms</h3>
                                            <div className="space-y-5">
                                                {[
                                                    { id: 'swelling', label: 'Swelling' },
                                                    { id: 'headache', label: 'Headache' },
                                                    { id: 'vision', label: 'Blurry Vision' }
                                                ].map((s) => (
                                                    <label key={s.id} className="flex items-center gap-4 cursor-pointer group">
                                                        <div className="relative flex items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                className="peer appearance-none w-7 h-7 rounded-xl border-2 border-slate-300 checked:bg-teal-500 checked:border-teal-500 transition-all cursor-pointer"
                                                                defaultChecked={s.id === 'swelling'}
                                                            />
                                                            <CheckCircle2 size={16} className="absolute text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
                                                        </div>
                                                        <span className="text-base font-bold text-slate-600 peer-checked:text-slate-900 transition-colors">{s.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="glass p-8 shadow-md border-brand-200 flex flex-col justify-between hover:border-brand-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 mb-2">Clinical Insights</h3>
                                                <p className="text-sm text-slate-500 font-medium">Generate your latest health summary</p>
                                            </div>

                                            <div className="mt-8">
                                                <button
                                                    onClick={handleGenerateReport}
                                                    disabled={isGeneratingReport}
                                                    className="w-full py-5 bg-teal-600 text-white rounded-[1.5rem] font-bold text-lg hover:bg-teal-700 active:scale-95 transition-all shadow-xl shadow-teal-100/50 flex items-center justify-center gap-3 disabled:opacity-50"
                                                >
                                                    {isGeneratingReport ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : <Activity size={20} />}
                                                    {isGeneratingReport ? 'Generating...' : 'Generate Weekly Report'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Clinical Insight Banner - Redesigned */}
                                    <div className="bg-[linear-gradient(to_bottom,#6A4C93,#7C5BB3,#8E6BBF)] text-white rounded-[3.5rem] p-12 relative overflow-hidden shadow-2xl mt-8">
                                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                                            <div className="max-w-xl">
                                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-brand-300 rounded-2xl border border-teal-500/20 mb-6">
                                                    <Sparkles size={16} />
                                                    <span className="text-xs font-black uppercase tracking-widest">AI Clinical Insight</span>
                                                </div>
                                                <h3 className="text-4xl font-black mb-6 leading-tight">Patient Stability Index</h3>
                                                <p className="text-white opacity-90 text-lg font-medium leading-relaxed">
                                                    {logs.length > 0 ? (
                                                        getRiskStatus(logs[0]).level === 'normal'
                                                            ? "Current vital indicators show high stability. Monitoring should continue at the current frequency with standard prenatal precautions."
                                                            : "Recent variance in vitals detected. Analytical markers suggest closer monitoring of blood pressure trends over the next 48 hours."
                                                    ) : "Please input clinical logs to initialize the patient stability analysis engine."}
                                                </p>
                                            </div>
                                            <div className="flex gap-6">
                                                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center min-w-[180px]">
                                                    <div className="w-12 h-12 bg-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-300">
                                                        <CheckCircle2 size={24} />
                                                    </div>
                                                    <p className="text-[10px] uppercase font-black tracking-[0.2em] text-white/50 mb-2">Weekly Goal</p>
                                                    <p className="text-3xl font-black">92%</p>
                                                </div>
                                                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center min-w-[180px]">
                                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
                                                        <TrendingUp size={24} />
                                                    </div>
                                                    <p className="text-[10px] uppercase font-black tracking-[0.2em] text-white/50 mb-2">Stability</p>
                                                    <p className="text-3xl font-black">High</p>
                                                </div>
                                            </div>
                                        </div>
                                        <Sparkles className="absolute -right-20 -bottom-20 w-80 h-80 text-white/5 rotate-12" />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )
                }

                {
                    activeTab === 'patients-list' && role === 'doctor' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 pb-12">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Patient Directory</h2>
                                    <p className="text-slate-500">Registry of all connected patients and their reported risk levels.</p>
                                </div>
                                <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200">
                                    {[
                                        { id: 'all', label: 'All' },
                                        { id: 'urgent', label: 'High Risk', color: 'text-rose-600' },
                                        { id: 'help', label: 'Moderate', color: 'text-amber-600' },
                                        { id: 'normal', label: 'Normal', color: 'text-brand-600' }
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setPatientFilter(f.id)}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${patientFilter === f.id
                                                ? 'bg-slate-900 text-white shadow-lg'
                                                : `text-slate-400 hover:text-slate-600`
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
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
                                                    className={`p-6 rounded-[2rem] text-left transition-all border-2 w-full flex flex-col md:flex-row items-center gap-6 shadow-sm hover:shadow-xl ${selectedPatient?.email === p.email
                                                        ? 'bg-brand-600 text-white border-brand-600 shadow-brand-100'
                                                        : 'bg-white text-slate-600 border-white shadow-slate-200/30'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-6 flex-1 w-full">
                                                        <div className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl font-black border-2 ${selectedPatient?.email === p.email ? 'bg-white/20 text-white border-white/40' : 'bg-brand-50 text-brand-600 border-brand-100 shadow-inner'} overflow-hidden`}>
                                                            {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : (p.name?.[0]?.toUpperCase() || 'P')}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <p className="font-black text-xl leading-tight truncate">{p.name || 'Anonymous'}</p>
                                                                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${selectedPatient?.email === p.email
                                                                    ? 'bg-white/20 text-white'
                                                                    : `${risk.bg} ${risk.color} border ${risk.border}`
                                                                    }`}>
                                                                    {risk.label}
                                                                </div>
                                                            </div>
                                                            <p className={`text-sm font-medium ${selectedPatient?.email === p.email ? 'text-brand-100' : 'text-slate-400'}`}>
                                                                Registry ID: {p.email} � Age {p.age} � {p.pregnancyType}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-8 px-6 border-l border-slate-100 h-10">
                                                        <div className="text-center">
                                                            <p className={`text-[10px] font-black uppercase tracking-widest ${selectedPatient?.email === p.email ? 'text-brand-200' : 'text-slate-400'}`}>Latest HR</p>
                                                            <p className="font-bold text-lg">{pData.latestLog?.heartRate || '--'} <span className="text-[10px] opacity-70">bpm</span></p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className={`text-[10px] font-black uppercase tracking-widest ${selectedPatient?.email === p.email ? 'text-brand-200' : 'text-slate-400'}`}>BP Gauge</p>
                                                            <p className="font-bold text-lg">{pData.latestLog ? `${pData.latestLog.systolic}/${pData.latestLog.diastolic}` : '--/--'}</p>
                                                        </div>
                                                        <div className="hidden lg:block text-center">
                                                            <p className={`text-[10px] font-black uppercase tracking-widest ${selectedPatient?.email === p.email ? 'text-brand-200' : 'text-slate-400'}`}>Last Assessment</p>
                                                            <p className="font-bold text-lg">{pData.latestLog ? new Date(pData.latestLog.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Never'}</p>
                                                        </div>
                                                    </div>

                                                    <div className={`ml-4 p-3 rounded-2xl ${selectedPatient?.email === p.email ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400 group-hover/card:bg-brand-50 group-hover/card:text-brand-600'} transition-all`}>
                                                        <ChevronRight size={20} />
                                                    </div>
                                                </button>
                                                <div className="absolute right-4 top-4 flex flex-col gap-2 z-10 opacity-0 group-hover/card:opacity-100 transition-all group-hover/card:translate-x-0 translate-x-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openChat(p);
                                                        }}
                                                        className={`p-3 rounded-2xl shadow-xl border border-slate-200 bg-white text-blue-500 hover:scale-110 active:scale-95 transition-all`}
                                                        title="Open Chat"
                                                    >
                                                        <MessageSquare size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemovePatient(p.email);
                                                        }}
                                                        className={`p-3 rounded-2xl shadow-xl border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all`}
                                                        title="Remove Patient"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                {patients.length === 0 && (
                                    <div className="col-span-full py-20 text-center bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                        <UsersIcon size={48} className="mx-auto mb-4 text-slate-200" />
                                        <p className="text-slate-400 font-bold">Your patient directory is empty.</p>
                                        <p className="text-slate-300 text-sm mt-1">Accept connection requests in the notification panel.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )
                }

                {
                    activeTab === 'reports' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                                        {role === 'doctor' ? 'Clinical Report Center' : 'My Clinical Reports'}
                                    </h2>
                                    <div className="text-slate-500 flex flex-col md:flex-row md:items-center gap-2 mt-1">
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
                                                    ?? Every week is progress
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
                                                        ? 'bg-[#F8F7FF] border-brand-400 shadow-md'
                                                        : 'bg-white border-brand-200 hover:border-brand-400'
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
                                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Report History</h3>
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
                                                                className="bg-white p-4 rounded-2xl border-2 border-slate-50 hover:border-brand-500 transition-all text-left shadow-sm group hover:shadow-md flex items-center justify-between gap-6"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="p-3 bg-[#F8F7FF] rounded-xl text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                                                                        <Calendar size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-900 leading-tight">Clinical Health Assessment</p>
                                                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                                            AI Generated � S.O.A.P Format
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
                                                <div className="bg-white/40 p-12 rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
                                                    <Activity className="mx-auto mb-4 text-slate-200" size={48} />
                                                    <p className="text-slate-400 font-bold">No reports generated yet.</p>
                                                </div>
                                            )}

                                            {/* Generate Report Button */}
                                            <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-slate-200 p-8 text-center h-fit flex flex-col items-center justify-center group hover:border-brand-200 transition-colors max-w-2xl mx-auto">
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-12 h-12 bg-[#F8F7FF] rounded-2xl flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
                                                            <Sparkles size={24} />
                                                        </div>
                                                        <div className="text-left">
                                                            <h3 className="text-xl font-black text-slate-900 leading-none">Generate Fresh Report</h3>
                                                            <p className="text-xs text-slate-500 font-medium mt-1">
                                                                {role === 'doctor'
                                                                    ? `Analyze ${selectedPatient.name}'s recent clinical progression`
                                                                    : "Analyze your recent clinical data & interaction logs"
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={handleGenerateReport}
                                                        disabled={isGeneratingReport}
                                                        className={`bg-brand-600 hover:bg-brand-700 text-white py-3 px-8 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-lg shadow-brand-200 transition-all active:scale-95 ${isGeneratingReport ? 'opacity-50' : ''}`}
                                                    >
                                                        {isGeneratingReport ? (
                                                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing Assessment...</>
                                                        ) : (
                                                            <><Activity size={18} /> Generate New Report</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white/40 backdrop-blur-md p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6">
                                                <UsersIcon size={48} />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-400 mb-2">Patient Select Required</h3>
                                            <p className="text-slate-300 font-medium max-w-xs mx-auto">Please select a patient from the sidebar to view their clinical history and generate reports.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                }
            </main >

            <AnimatePresence>
                {isProfileModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProfileModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            {/* Header - Fixed */}
                            <div className="p-8 pb-4 border-b border-slate-100 bg-white z-10">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight text-slate-900">Account Settings</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-brand-500 text-[10px] uppercase font-black tracking-widest">Manage your clinical profile</p>
                                            <span className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded-full text-[8px] font-black uppercase border border-brand-100 flex items-center gap-1">
                                                <Zap size={8} fill="currentColor" /> Simulation Mode
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsProfileModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400"><X size={24} /></button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
                                <form id="profileForm" onSubmit={handleUpdateProfile} className="space-y-8">
                                    {/* Photo Upload Section */}
                                    <div className="flex flex-col items-center mb-4">
                                        <div className="relative group">
                                            <div className={`w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 ${role === 'doctor' ? 'bg-blue-600' : role === 'guardian' ? 'bg-purple-600' : 'bg-brand-600'}`}>
                                                {profileForm.photo ? (
                                                    <img src={profileForm.photo} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-white text-5xl font-black">
                                                        {profileForm.name?.[0]?.toUpperCase() || 'U'}
                                                    </span>
                                                )}
                                            </div>
                                            <label className="absolute -right-2 -bottom-2 p-3 bg-white text-brand-600 rounded-2xl shadow-xl cursor-pointer hover:bg-brand-50 transition-all border-2 border-brand-100">
                                                <Camera size={20} />
                                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                            </label>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">Profile Picture</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">Full Identity</label>
                                            <input type="text" className="input-field py-4" placeholder="Full Name" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">Age</label>
                                            <input type="number" className="input-field py-4" placeholder="Age" value={profileForm.age} onChange={e => setProfileForm({ ...profileForm, age: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1 flex justify-between">
                                                <span>Mobile Primary</span>
                                                <span className={`${profileForm.mobile && !profileForm.mobile.startsWith('+') ? 'text-rose-500' : 'text-slate-300'} text-[8px]`}>Required: +CountryCode</span>
                                            </label>
                                            <input
                                                type="tel"
                                                placeholder="+1234567890"
                                                className={`input-field py-4 ${profileForm.mobile && !profileForm.mobile.startsWith('+') ? 'border-rose-300 bg-rose-50/50' : ''}`}
                                                value={profileForm.mobile}
                                                onChange={e => setProfileForm({ ...profileForm, mobile: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1 flex justify-between">
                                                <span>Emergency SOS Contact</span>
                                                <span className={`${profileForm.emergencyContact && !profileForm.emergencyContact.startsWith('+') ? 'text-rose-500' : 'text-slate-300'} text-[8px]`}>Required: +CountryCode</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500">
                                                    <AlertTriangle size={18} />
                                                </div>
                                                <input
                                                    type="tel"
                                                    placeholder="+1234567890"
                                                    className={`input-field py-4 pl-12 ${profileForm.emergencyContact && !profileForm.emergencyContact.startsWith('+') ? 'border-rose-300 bg-rose-50/50' : 'border-rose-100 bg-rose-50/30'}`}
                                                    value={profileForm.emergencyContact}
                                                    onChange={e => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                                                />
                                            </div>
                                            <p className="mt-2 text-[9px] text-slate-400 font-medium px-1 italic">
                                                * WhatsApp and SMS are sent in **Simulation Mode** (View logs in Console). Mandate the "+" prefix for international formatting.
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1 flex justify-between">
                                                <span>Medicine Schedule (HH:MM, HH:MM)</span>
                                                <span className="text-[10px] text-brand-500">24h Format</span>
                                            </label>
                                            <input type="text" className="input-field py-4" value={profileForm.medicineTimes} onChange={e => setProfileForm({ ...profileForm, medicineTimes: e.target.value })} placeholder="08:00, 14:00, 20:00" />
                                        </div>
                                        {role === 'patient' && (
                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">Clinical Pregnancy Stage</label>
                                                <select className="input-field py-4" value={profileForm.pregnancyType} onChange={e => setProfileForm({ ...profileForm, pregnancyType: e.target.value })}>
                                                    <option value="first">First Pregnancy</option>
                                                    <option value="second">Second Pregnancy</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                        )}
                                        {role === 'doctor' && (
                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">Facility Name</label>
                                                <input type="text" className="input-field py-4" placeholder="City Life Hospital" value={profileForm.hospitalName} onChange={e => setProfileForm({ ...profileForm, hospitalName: e.target.value })} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="pb-4">
                                        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">{role === 'patient' ? 'Residential Address' : 'Professional Address'}</label>
                                        <textarea className="input-field min-h-[100px] py-4" placeholder="Street, City, Postal Code" value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} />
                                    </div>
                                </form>
                            </div>

                            {/* Footer - Fixed */}
                            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="px-6 py-4 bg-white text-slate-400 rounded-2xl font-bold flex items-center justify-center gap-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all active:scale-95"
                                >
                                    <LogOut size={20} /> <span className="hidden sm:inline">Log Out</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpdateProfile}
                                    className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-brand-200 hover:bg-brand-700 active:scale-95 transition-all group overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    <CheckCircle2 size={24} className="relative z-10" />
                                    <span className="relative z-10 text-lg">Save Changes</span>
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute inset-0 bg-white/40 rounded-full"
                                    />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isLogModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLogModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-extrabold tracking-tight">Add Health Log</h3>
                                <button onClick={() => setIsLogModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSaveLog} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 transition-all hover:border-rose-200 group">
                                        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase px-1 flex items-center gap-2">
                                            <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg group-hover:scale-110 transition-transform"><Activity size={18} /></div> Heart Rate
                                        </label>
                                        <input type="number" placeholder="72" className="input-field bg-white border-none shadow-none focus:ring-0" value={logForm.heartRate} onChange={e => setLogForm({ ...logForm, heartRate: e.target.value })} required />
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 transition-all hover:border-indigo-200 group">
                                        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase px-1 flex items-center gap-2">
                                            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform"><Droplets size={18} /></div> Glucose
                                        </label>
                                        <input type="number" placeholder="95" className="input-field bg-white border-none shadow-none focus:ring-0" value={logForm.glucose} onChange={e => setLogForm({ ...logForm, glucose: e.target.value })} required />
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 transition-all hover:border-brand-200 group">
                                        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase px-1 flex items-center gap-2">
                                            <div className="p-1.5 bg-brand-100 text-brand-600 rounded-lg group-hover:scale-110 transition-transform"><Heart size={18} /></div> BP (Systolic)
                                        </label>
                                        <input type="number" placeholder="120" className="input-field bg-white border-none shadow-none focus:ring-0" value={logForm.systolic} onChange={e => setLogForm({ ...logForm, systolic: e.target.value })} required />
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 transition-all hover:border-brand-200 group">
                                        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase px-1 flex items-center gap-2">
                                            <div className="p-1.5 bg-brand-100 text-brand-400 rounded-lg group-hover:scale-110 transition-transform"><Heart size={18} /></div> BP (Diastolic)
                                        </label>
                                        <input type="number" placeholder="80" className="input-field bg-white border-none shadow-none focus:ring-0" value={logForm.diastolic} onChange={e => setLogForm({ ...logForm, diastolic: e.target.value })} required />
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
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl">
                            <div className="absolute right-6 top-6 z-10">
                                <button onClick={() => setIsDoctorModalOpen(false)} className="p-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-2xl shadow-sm transition-colors"><X size={24} /></button>
                            </div>

                            <div className="bg-brand-600 p-8 text-center text-white relative">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
                                    <Activity className="absolute -top-10 -left-10 w-48 h-48 rotate-12" />
                                    <Heart className="absolute -bottom-10 -right-10 w-48 h-48 -rotate-12" />
                                </div>

                                <div className="relative inline-block mb-4">
                                    <div className="w-24 h-24 rounded-[2rem] bg-white p-1 shadow-2xl">
                                        <div className="w-full h-full rounded-[1.5rem] bg-blue-50 flex items-center justify-center text-blue-600 text-4xl font-black overflow-hidden uppercase">
                                            {selectedViewDoctor.photo ? <img src={selectedViewDoctor.photo} alt={selectedViewDoctor.name} className="w-full h-full object-cover" /> : (selectedViewDoctor.name?.[0] || 'D')}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-xl flex items-center justify-center text-white shadow-lg">
                                        <Activity size={14} />
                                    </div>
                                </div>

                                <h3 className="text-2xl font-extrabold tracking-tight leading-tight mb-1">{selectedViewDoctor.name}</h3>
                                <p className="text-brand-100 font-bold uppercase tracking-[0.2em] text-[10px] mb-2">Medical Specialist</p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
                                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200">
                                        <p className="text-[9px] text-slate-400 font-black uppercase mb-0.5 tracking-widest">Clinical Affiliation</p>
                                        <p className="font-bold text-slate-800 text-sm">{selectedViewDoctor.hospitalName || 'Independent Practice'}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200">
                                        <p className="text-[9px] text-slate-400 font-black uppercase mb-0.5 tracking-widest">Mobile Contact</p>
                                        <p className="font-bold text-slate-800 text-sm">{selectedViewDoctor.mobile || 'Confidential'}</p>
                                    </div>
                                    {selectedViewDoctor.address && (
                                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 sm:col-span-2">
                                            <p className="text-[9px] text-slate-400 font-black uppercase mb-0.5 tracking-widest">Professional Address</p>
                                            <p className="font-bold text-slate-800 text-sm">{selectedViewDoctor.address}</p>
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
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
                            <div className="absolute right-6 top-6 z-10">
                                <button onClick={() => setIsPatientModalOpen(false)} className="p-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-2xl shadow-sm transition-colors"><X size={24} /></button>
                            </div>

                            {/* Sidebar Info */}
                            <div className="w-full md:w-80 bg-slate-50 p-10 border-r border-slate-200 flex flex-col items-center text-center overflow-y-auto">
                                <div className="w-32 h-32 shrink-0 mb-6">
                                    <div className="w-full h-full rounded-[2.5rem] bg-brand-50 border-4 border-white shadow-2xl flex items-center justify-center text-brand-600 text-5xl font-black overflow-hidden relative">
                                        {selectedPatient.photo ? <img src={selectedPatient.photo} alt={selectedPatient.name} className="w-full h-full object-cover" /> : (selectedPatient.name?.[0] || 'P')}
                                        <div className={`absolute bottom-3 right-3 w-6 h-6 rounded-full border-4 border-white ${getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).bg} animate-pulse shadow-sm`} />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1">{selectedPatient.name}</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-6">Patient Profile</p>

                                <div className="w-full space-y-3">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center text-sm shadow-sm">
                                        <span className="text-slate-400 font-bold uppercase text-[9px]">Age</span>
                                        <span className="text-slate-900 font-black">{selectedPatient.age} Years</span>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-start gap-1 text-sm shadow-sm text-left">
                                        <span className="text-slate-400 font-bold uppercase text-[9px]">Pregnancy Stage</span>
                                        <span className="text-slate-900 font-black capitalize">{selectedPatient.pregnancyType}</span>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-start gap-1 text-sm shadow-sm text-left">
                                        <span className="text-slate-400 font-bold uppercase text-[9px]">Contact</span>
                                        <span className="text-slate-900 font-black">{selectedPatient.mobile || 'Private'}</span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-10 w-full text-left">
                                    <div className={`p-6 rounded-[2rem] border ${getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).bg} ${getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).border}`}>
                                        <p className={`${getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).color} font-black text-[10px] uppercase mb-1`}>Status</p>
                                        <p className="font-black text-slate-900">{getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).label}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 p-10 overflow-y-auto space-y-10">
                                {/* Risk Assessment */}
                                <section>
                                    <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden ${getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).bg} ${getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).border}`}>
                                        <div className="relative z-10">
                                            <h4 className="text-2xl font-black text-slate-900 mb-3 flex items-center gap-2">
                                                <AlertTriangle className={getRiskStatus(patientHealthData[selectedPatient.email]?.latestLog).color} /> Clinical Assessment
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
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { label: "Heart Rate", value: patientHealthData[selectedPatient.email]?.latestLog?.heartRate ? `${patientHealthData[selectedPatient.email].latestLog.heartRate} bpm` : '--', icon: Activity, color: "text-rose-500", bg: "bg-rose-50" },
                                            { label: "Blood Pressure", value: patientHealthData[selectedPatient.email]?.latestLog?.systolic ? `${patientHealthData[selectedPatient.email].latestLog.systolic}/${patientHealthData[selectedPatient.email].latestLog.diastolic}` : '--', icon: Heart, color: "text-brand-600", bg: "bg-brand-50" },
                                            { label: "Glucose", value: patientHealthData[selectedPatient.email]?.latestLog?.glucose ? `${patientHealthData[selectedPatient.email].latestLog.glucose} mg/dL` : '--', icon: Droplets, color: "text-blue-500", bg: "bg-blue-50" }
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-200 flex flex-col items-center text-center shadow-sm hover:border-brand-400 hover:shadow-md hover:bg-white transition-all cursor-pointer group">
                                                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} mb-4 shadow-sm`}>
                                                    <stat.icon size={24} />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">{stat.label}</p>
                                                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
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
                                                <div key={log.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-brand-100 transition-colors group/log">
                                                    <div className="flex justify-between items-center bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200 mb-6">
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
                                        <div className="py-20 text-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[3rem]">
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
                                                <div className="grid grid-cols-3 gap-4">
                                                    {[
                                                        { label: 'Weight', value: hp.weight ? `${hp.weight} kg` : null, icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
                                                        { label: 'Height', value: hp.height ? `${hp.height} cm` : null, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
                                                        { label: 'Blood Type', value: hp.blood_type, icon: Droplets, color: 'text-brand-600', bg: 'bg-brand-50' }
                                                    ].map((item, i) => (
                                                        <div key={i} className="bg-slate-50 p-5 rounded-3xl border border-slate-200 flex flex-col items-center text-center">
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
                                        <div className="py-12 text-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[3rem]">
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
                        className="fixed bottom-8 left-[18rem] z-40 hover:scale-110 active:scale-95 transition-all group flex items-center gap-3"
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
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/60">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-2xl h-[700px] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border-8 border-white"
                        >
                            {/* AI Header */}
                            <div className="p-8 bg-brand-600 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                        <Bot size={28} />
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
                                        className="p-3 hover:bg-white/10 rounded-2xl transition-colors"
                                        title="Clear History"
                                    >
                                        <Trash2 size={24} />
                                    </button>
                                    <button onClick={() => setIsAiAssistantOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                                        <X size={28} />
                                    </button>
                                </div>
                            </div>

                            {/* AI Chat History */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50">
                                {aiChatHistory.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 px-12">
                                        <div className="w-24 h-24 bg-brand-50 rounded-[2.5rem] flex items-center justify-center text-brand-600">
                                            <Sparkles size={48} />
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
                                            <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-brand-600 text-white rounded-tr-none shadow-xl'
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
                            <form onSubmit={handleSendAiQuestion} className="p-8 bg-white border-t border-slate-200 flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Ask anything about your health..."
                                    className="flex-1 bg-slate-50 border-none px-8 py-5 rounded-[2rem] text-lg focus:ring-4 focus:ring-brand-50 transition-all font-medium"
                                    value={aiNewMessage}
                                    onChange={e => setAiNewMessage(e.target.value)}
                                    disabled={isAiLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isAiLoading}
                                    className="p-5 bg-brand-600 text-white rounded-[2rem] shadow-xl hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <ChevronRight size={32} />
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsReportModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col border-4 border-white"
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
                                    <button onClick={() => setIsReportModalOpen(false)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-2xl shadow-sm transition-all"><X size={24} /></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 print:p-0">
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
                                        Saved to My Reports � Data as of {selectedReportTimestamp ? new Date(selectedReportTimestamp).toLocaleString() : new Date().toLocaleString()}
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
                            className="w-full h-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden flex flex-col pointer-events-auto border border-slate-100"
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
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/60">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 animate-[loading_2s_infinite]" />
                                <div className="w-24 h-24 rounded-[2rem] bg-brand-50 mx-auto mb-6 flex items-center justify-center relative">
                                    <div className="absolute inset-0 rounded-[2rem] border-4 border-brand-500 animate-ping opacity-20" />
                                    <Activity className="text-brand-600" size={40} />
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

                {
                    isCalling && (
                        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-between p-12 text-white">
                            <div className="text-center space-y-4">
                                <div className="w-32 h-32 rounded-[3.5rem] bg-white/10 p-1 mx-auto backdrop-blur-xl">
                                    <div className="w-full h-full rounded-[3rem] bg-brand-600 flex items-center justify-center text-5xl font-black">
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

                            <div className="flex items-center gap-8 bg-white/10 backdrop-blur-2xl p-6 rounded-[3rem] border border-white/10 shadow-2xl">
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
                        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
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
                            className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative"
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHealthProfileOpen(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="p-8 bg-gradient-to-r from-brand-600 to-brand-700 text-white flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
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
