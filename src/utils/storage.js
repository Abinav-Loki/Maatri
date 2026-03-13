// Storage utility for Maatri Shield - Supabase Implementation
import { supabase } from './supabase';
import { db } from './db';

const mapping = {
    logToSupabase: (log) => {
        const parseValue = (val) => {
            const parsed = parseInt(val);
            return isNaN(parsed) ? null : parsed;
        };
        return {
            heart_rate: parseValue(log.heartRate),
            systolic: parseValue(log.systolic),
            diastolic: parseValue(log.diastolic),
            glucose_fasting: parseValue(log.glucose),
            notes: log.symptoms || '',
            risk_level: log.riskLevel || 'normal',
            timestamp: log.timestamp || new Date().toISOString()
        };
    },
    logFromSupabase: (dbLog) => ({
        ...dbLog,
        heartRate: dbLog.heart_rate,
        glucose: dbLog.glucose_fasting,
        riskLevel: dbLog.risk_level,
        symptoms: dbLog.notes || dbLog.symptoms // Fallback for old data if any
    }),
    profileToSupabase: (profile, isInsert = false) => {
        const dbProfile = {
            name: profile.name,
            age: profile.age ? parseInt(profile.age) : null,
            mobile: profile.mobile,
            emergency_contact: profile.emergencyContact,
            medicine_times: profile.medicineTimes,
            address: profile.address,
            photo: profile.photo,
            hospital_name: profile.hospitalName,
            pregnancy_type: profile.pregnancyType,
            relationship: profile.relationship,
            // Include email and role only for new account initialization
            ...(isInsert && {
                email: profile.email?.toLowerCase(),
                role: profile.role
            })
        };
        // Remove undefined/null keys to avoid Supabase errors
        return Object.fromEntries(Object.entries(dbProfile).filter(([_, v]) => v !== undefined && v !== null));
    },
    profileFromSupabase: (dbProfile) => {
        if (!dbProfile) return null;
        return {
            ...dbProfile,
            hospitalName: dbProfile.hospital_name,
            pregnancyType: dbProfile.pregnancy_type,
            emergencyContact: dbProfile.emergency_contact,
            medicineTimes: dbProfile.medicine_times,
            relationship: dbProfile.relationship
        };
    }
};

const storage = {
    // --- User Auth ---
    getUsers: async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*');
        if (error) console.error('Error fetching users:', error);
        return (data || []).map(mapping.profileFromSupabase);
    },

    updateProfile: async (email, updates) => {
        const dbUpdates = mapping.profileToSupabase(updates);

        // Get the auth user to obtain UUID (needed for RLS: auth.uid() = id)
        const { data: { user: authUser } } = await supabase.auth.getUser();

        let query = supabase.from('profiles').update(dbUpdates).select().single();

        if (authUser) {
            // Use UUID for matching — satisfies RLS policy "auth.uid() = id"
            query = supabase.from('profiles').update(dbUpdates).eq('id', authUser.id).select().single();
        } else {
            // Fallback: update by email (less secure, may fail with strict RLS)
            query = supabase.from('profiles').update(dbUpdates).eq('email', email.toLowerCase()).select().single();
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error updating profile:', error);
            // Graceful fallback: return local state update so UI doesn't break
            return { ...dbUpdates, email, hospitalName: dbUpdates.hospital_name, emergencyContact: dbUpdates.emergency_contact, medicineTimes: dbUpdates.medicine_times };
        }
        return mapping.profileFromSupabase(data);
    },

    saveUser: async (user) => {
        const { email, password, role, ...profileInfo } = user;

        // Clear any existing session before signing up a new user
        await supabase.auth.signOut();

        // 1. Sign up user in Auth
        console.log(`[Storage] Signing up user: ${email} with role: ${user.role}`);
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email.toLowerCase(),
            password,
            options: {
                data: {
                    role: user.role,
                    name: profileInfo.name
                }
            }
        });

        if (authError) {
            console.error('[Storage] Auth signup error:', authError.message, authError);
            // Surface a clean, user-friendly error message
            if (authError.message?.toLowerCase().includes('already registered') || authError.message?.toLowerCase().includes('already exists')) {
                throw new Error('This email is already registered. Please log in instead.');
            }
            throw new Error(authError.message || 'Registration failed. Please try again.');
        }

        if (!authData.user) {
            console.error('[Storage] Signup failed - no user returned.');
            throw new Error('Signup failed - no user returned.');
        }

        // Supabase quirk: if email confirmation is ON and the email is already registered,
        // it silently returns a fake user with no session. Detect this and show a clean error.
        if (!authData.session) {
            // Check if a profile already exists for this user ID
            const { data: existingCheck } = await supabase
                .from('profiles')
                .select('id, email')
                .eq('id', authData.user.id)
                .maybeSingle();
            if (existingCheck) {
                throw new Error('This email is already registered. Please log in instead.');
            }
            // If no profile exists, it could be a genuine new signup pending email confirmation.
            // Fall through to create the profile.
        }

        console.log('[Storage] Auth record created, inserting profile...');

        // 2. Insert into profiles with the auth user ID
        const dbUser = mapping.profileToSupabase({ ...profileInfo, email, role }, true);
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: authData.user.id,
                ...dbUser
            }])
            .select()
            .single();

        if (profileError) {
            console.error('[Storage] Profile insertion error:', profileError.message, profileError);
            // If the error is 'duplicate key', it means the profile already exists (maybe from a trigger)
            if (profileError.code === '23505') {
                console.log('[Storage] Profile already exists, fetching it...');
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single();
                if (existingProfile) return mapping.profileFromSupabase(existingProfile);
            }
            throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        return mapping.profileFromSupabase(profileData);
    },

    verifyUser: async (email, password) => {
        console.log(`[Storage] Attempting to verify user: ${email}`);
        // 1. Sign in via Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase(),
            password
        });

        if (authError) {
            console.error('[Storage] Auth signin error:', authError.message, authError);
            if (authError.message.includes('Email not confirmed')) {
                throw new Error('Email not confirmed. Please check your inbox.');
            }
            if (authError.message.includes('Invalid login credentials') || authError.message.includes('invalid_credentials')) {
                throw new Error('Invalid email or password. Please check your credentials.');
            }
            throw new Error(authError.message || 'Login failed. Please try again.');
        }

        console.log('[Storage] Auth signin successful, fetching profile...');
        // 2. Fetch profile data
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error('[Storage] Error fetching profile:', profileError.message, profileError.code, profileError.details, profileError.hint);

            // PGRST116 = no rows returned (profile row doesn't exist yet)
            if (profileError.code === 'PGRST116') {
                console.warn('[Storage] Profile row missing — auto-creating from auth metadata...');
                const meta = authData.user.user_metadata || {};
                const newProfile = {
                    id: authData.user.id,
                    email: authData.user.email?.toLowerCase(),
                    name: meta.name || meta.full_name || authData.user.email?.split('@')[0] || 'User',
                    role: meta.role || 'patient',
                };
                const { data: created, error: createError } = await supabase
                    .from('profiles')
                    .insert([newProfile])
                    .select()
                    .single();

                if (createError) {
                    console.error('[Storage] Auto-create profile failed:', createError.message, createError);
                    throw new Error(`Account found but profile could not be created: ${createError.message}`);
                }
                console.log('[Storage] Auto-created profile successfully');
                return mapping.profileFromSupabase(created);
            }

            throw new Error(`Account found but profile data could not be loaded (${profileError.code || profileError.message}). Please contact support.`);
        }

        console.log('[Storage] Profile fetched successfully');
        return mapping.profileFromSupabase(profileData);
    },

    logout: async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('currentUser');
    },

    // --- Patient Data ---
    getPatientData: async (email) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('role', 'patient')
            .single();
        if (error) return null;
        return mapping.profileFromSupabase(data);
    },

    // --- Health Logs ---
    getLogs: async (email) => {
        const { data, error } = await supabase
            .from('health_logs')
            .select('*')
            .eq('user_email', email)
            .order('timestamp', { ascending: false });
        if (error) {
            console.error('Error fetching logs:', error);
            return [];
        }
        return (data || []).map(mapping.logFromSupabase);
    },

    saveLog: async (email, log) => {
        console.log(`[Storage] Saving log for ${email}`, log);

        const timestamp = log.timestamp || new Date().toISOString();
        const localLog = {
            user_email: email.toLowerCase(),
            timestamp: timestamp,
            data: log, // Original log object
            synced: 0
        };

        // 1. Save to Local IndexedDB
        const id = await db.vitals.add(localLog);
        console.log('[Storage] Saved log to local DB with ID:', id);

        // 2. Try to sync to Supabase if online
        if (navigator.onLine) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const dbLog = mapping.logToSupabase(log);
                    const { error } = await supabase
                        .from('health_logs')
                        .insert([{
                            ...dbLog,
                            user_email: email.toLowerCase(),
                            user_id: user.id
                        }]);

                    if (!error) {
                        await db.vitals.update(id, { synced: 1 });
                        console.log('[Storage] Synced log to Supabase');
                    }
                }
            } catch (syncError) {
                console.warn('[Storage] Background sync failed, will retry later:', syncError);
            }
        }

        return mapping.logFromSupabase({ ...mapping.logToSupabase(log), id });
    },

    getLatestVitals: async (email) => {
        const logs = await storage.getLogs(email);
        return logs.length > 0 ? logs[0] : null;
    },

    // --- Doctor Data ---
    searchDoctors: async (query) => {
        if (!query) return [];
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'doctor')
            .or(`name.ilike.%${query}%,hospital_name.ilike.%${query}%,mobile.ilike.%${query}%`);
        if (error) {
            console.error('Error searching doctors:', error);
            return [];
        }
        return (data || []).map(mapping.profileFromSupabase);
    },

    // --- Connections (Follow System) ---
    getConnections: async () => {
        const { data, error } = await supabase
            .from('connections')
            .select('*');
        if (error) {
            console.error('Error fetching connections:', error);
            return [];
        }
        return data || [];
    },

    sendConnectionRequest: async (fromEmail, toEmail) => {
        console.log(`[Storage] Sending connection request from ${fromEmail} to ${toEmail}`);
        // 1. Get current logged in user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('[Storage] No authenticated user found for request');
            return false;
        }

        // 2. Resolve recipient's user ID from profiles
        const { data: recipient } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', toEmail.toLowerCase())
            .maybeSingle();
        console.log(`[Storage] Resolved recipient ID: ${recipient?.id || 'null'}`);

        // 3. Check for existing connection
        const { data: existing } = await supabase
            .from('connections')
            .select('id')
            .eq('from_email', fromEmail.toLowerCase())
            .eq('to_email', toEmail.toLowerCase())
            .maybeSingle();

        if (existing) {
            console.log('[Storage] Connection request already exists');
            return true;
        }

        // 4. Insert with IDs and Emails
        const { error } = await supabase
            .from('connections')
            .insert([{
                from_user_id: user.id,
                to_user_id: recipient?.id,
                from_email: fromEmail.toLowerCase(),
                to_email: toEmail.toLowerCase(),
                status: 'pending'
            }]);
        if (error) {
            console.error('[Storage] Error sending connection request:', error);
            return false;
        }
        console.log('[Storage] Connection request sent successfully');
        return true;
    },

    getPendingRequests: async (email) => {
        console.log(`[Storage] Fetching pending requests for: ${email}`);
        const { data: { user } } = await supabase.auth.getUser();
        const activeEmail = (user?.email || email).toLowerCase();

        let query = supabase
            .from('connections')
            .select('*')
            .eq('status', 'pending');

        if (user?.id) {
            query = query.or(`to_email.eq.${activeEmail},to_user_id.eq.${user.id}`);
        } else {
            query = query.eq('to_email', activeEmail);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[Storage] Error fetching pending requests:', error);
            return [];
        }

        // Batch resolve sender names
        if (data && data.length > 0) {
            const senderEmails = [...new Set(data.map(r => r.from_email.toLowerCase()))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('email, name')
                .in('email', senderEmails);

            const nameMap = {};
            (profiles || []).forEach(p => { nameMap[p.email.toLowerCase()] = p.name; });

            return data.map(r => ({
                ...r,
                senderName: nameMap[r.from_email.toLowerCase()] || r.from_email.split('@')[0]
            }));
        }

        console.log(`[Storage] Found ${data?.length || 0} pending requests for ${activeEmail}`);
        return data || [];
    },

    handleConnectionRequest: async (requestId, status) => {
        const { error } = await supabase
            .from('connections')
            .update({ status })
            .eq('id', requestId);
        if (error) console.error('Error handling request:', error);
        return true;
    },

    getConnectionStatus: async (fromEmail, toEmail) => {
        const f = fromEmail.toLowerCase();
        const t = toEmail.toLowerCase();
        const { data, error } = await supabase
            .from('connections')
            .select('status')
            .or(`and(from_email.eq.${f},to_email.eq.${t}),and(from_email.eq.${t},to_email.eq.${f})`)
            .maybeSingle();
        if (error && error.code !== 'PGRST116') console.error('Error fetching connection status:', error);
        return data ? data.status : null;
    },

    removeConnection: async (email1, email2) => {
        const { error } = await supabase
            .from('connections')
            .delete()
            .or(`and(from_email.eq.${email1},to_email.eq.${email2}),and(from_email.eq.${email2},to_email.eq.${email1})`);
        if (error) console.error('Error removing connection:', error);
        return true;
    },

    getAuthorizedPatients: async (doctorEmail) => {
        const activeEmail = doctorEmail.toLowerCase();
        
        // 1. Fetch from accepted connections
        const { data: connections, error: connError } = await supabase
            .from('connections')
            .select('from_email')
            .eq('to_email', activeEmail)
            .eq('status', 'accepted');

        // 2. Fetch from message history (as receiver)
        const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('from_email')
            .eq('to_email', activeEmail);

        const emailSet = new Set();
        if (!connError && connections) connections.forEach(c => emailSet.add(c.from_email.toLowerCase()));
        if (!msgError && messages) messages.forEach(m => emailSet.add(m.from_email.toLowerCase()));

        if (emailSet.size === 0) return [];
        const emails = Array.from(emailSet);

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .in('email', emails);
        if (error) console.error('Error fetching authorized patients:', error);
        return (data || []).map(mapping.profileFromSupabase);
    },

    getConnectedDoctors: async (patientEmail) => {
        const { data: connections, error: connError } = await supabase
            .from('connections')
            .select('to_email')
            .eq('from_email', patientEmail)
            .eq('status', 'accepted');

        if (connError || !connections) return [];
        const emails = connections.map(c => c.to_email);

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .in('email', emails);
        if (error) console.error('Error fetching connected doctors:', error);
        return (data || []).map(mapping.profileFromSupabase);
    },

    /**
     * Returns only partners who have actually exchanged messages with this user.
     * This is used for the "Active Conversations" list in the Messages tab.
     */
    getConnectedPartners: async (email, role) => {
        const activeEmail = email.toLowerCase();
        const partnerEmails = new Set();

        // 1. Get partners from message history (people you've chatted with)
        const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('from_email, to_email')
            .or(`from_email.eq.${activeEmail},to_email.eq.${activeEmail}`);

        if (!msgError && messages && messages.length > 0) {
            messages.forEach(m => {
                const other = m.from_email.toLowerCase() === activeEmail ? m.to_email : m.from_email;
                partnerEmails.add(other.toLowerCase());
            });
        }

        // 2. If doctor, also explicitly include all authorized patients
        if (role === 'doctor') {
            const { data: connections, error: connError } = await supabase
                .from('connections')
                .select('from_email')
                .eq('to_email', activeEmail)
                .eq('status', 'accepted');

            if (!connError && connections && connections.length > 0) {
                connections.forEach(c => partnerEmails.add(c.from_email.toLowerCase()));
            }
        }

        if (partnerEmails.size === 0) return [];

        // Fetch profiles for all partner emails in one batch
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .in('email', Array.from(partnerEmails));

        if (error) {
            console.error('[Storage] Error fetching connected partners:', error);
            return [];
        }

        return (data || []).map(mapping.profileFromSupabase);
    },

    getPatientByEmail: async (email) => {
        return await storage.getPatientData(email);
    },

    getUserByEmail: async (email) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();
        if (error) return null;
        return mapping.profileFromSupabase(data);
    },

    // --- Telemedicine & Chat ---
    getMessages: async (email1, email2) => {
        const e1 = email1.toLowerCase();
        const e2 = email2.toLowerCase();

        // 1. Fetch from Supabase
        const { data: remoteData, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(from_email.eq.${e1},to_email.eq.${e2}),and(from_email.eq.${e2},to_email.eq.${e1})`)
            .order('timestamp', { ascending: true });

        if (error) console.error('Error fetching remote messages:', error);

        // 2. Fetch from Local IndexedDB (including unsynced ones)
        const localData = await db.messages
            .where('from_email').anyOf([e1, e2])
            .and(m => (m.to_email === e1 || m.to_email === e2))
            .toArray();

        // 3. Merge and Deduplicate
        // Use a more robust key for deduplication: from + to + text + timestamp (rounded to seconds)
        const getFuzzyKey = (m) => {
            const date = new Date(m.timestamp);
            const roundedTime = Math.floor(date.getTime() / 1000); // precision to 1 second
            return `${m.from_email.toLowerCase()}|${m.to_email.toLowerCase()}|${m.text}|${roundedTime}`;
        };

        const merged = [...(remoteData || [])];
        const remoteKeys = new Set(merged.map(getFuzzyKey));

        if (localData) {
            localData.forEach(localMsg => {
                const localKey = getFuzzyKey(localMsg);
                if (!remoteKeys.has(localKey)) {
                    merged.push(localMsg);
                }
            });
        }

        return merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    },

    getUnreadMessagesCount: async (email) => {
        const e = email.toLowerCase();
        // 1. Fetch from Supabase
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('to_email', e)
            .eq('status', 'sent');

        if (error) {
            console.error('Error fetching unread messages count:', error);
        }

        // 2. Fetch from Local DB for any 'sent' messages that haven't been marked read locally
        const localUnread = await db.messages
            .where({ to_email: e, status: 'sent' })
            .count();

        // 3. Return the maximum/union (since supabase might be ahead or vice versa)
        // Usually Supabase is the truth for incoming messages.
        return Math.max(count || 0, localUnread);
    },

    getUnreadMessagesCountPerPartner: async (email) => {
        const e = email.toLowerCase();
        const { data, error } = await supabase
            .from('messages')
            .select('from_email')
            .eq('to_email', e)
            .eq('status', 'sent');

        const counts = {};
        if (!error && data) {
            data.forEach(m => {
                const from = m.from_email.toLowerCase();
                counts[from] = (counts[from] || 0) + 1;
            });
        }

        // Also check local
        const localUnread = await db.messages
            .where({ to_email: e, status: 'sent' })
            .toArray();

        localUnread.forEach(m => {
            const from = m.from_email.toLowerCase();
            if (!counts[from]) counts[from] = 1; // Or increment if we trust local more for real-time
        });

        return counts;
    },

    markMessagesAsRead: async (fromEmail, toEmail) => {
        const f = fromEmail.toLowerCase();
        const t = toEmail.toLowerCase();
        const { error } = await supabase
            .from('messages')
            .update({ status: 'read' })
            .eq('to_email', t)
            .eq('from_email', f)
            .eq('status', 'sent');

        if (error) console.error('Error marking messages as read:', error);

        // Also update local DB
        await db.messages
            .where({ to_email: t, from_email: f, status: 'sent' })
            .modify({ status: 'read' });

        return true;
    },

    saveMessage: async (msg) => {
        const timestamp = new Date().toISOString();
        const fromEmail = msg.from.toLowerCase();
        const toEmail = msg.to.toLowerCase();

        const localMsg = {
            from_email: fromEmail,
            to_email: toEmail,
            text: msg.text,
            type: msg.type || 'text',
            status: msg.status || 'sent',
            timestamp,
            synced: 0
        };

        // 1. Save to local DB
        const id = await db.messages.add(localMsg);

        // 2. Try pushing to Supabase
        const { error } = await supabase
            .from('messages')
            .insert({
                from_email: fromEmail,
                to_email: toEmail,
                text: msg.text,
                type: msg.type || 'text',
                status: msg.status || 'sent',
                timestamp
            });

        if (!error) {
            await db.messages.update(id, { synced: 1 });
        } else {
            console.error('Save message sync error:', error);
            // Will retry on next load via background sync
        }
        return localMsg;
    },

    // --- Appointments ---
    saveAppointment: async (doctorEmail, patientEmail, time, reason) => {
        const d = doctorEmail.toLowerCase();
        const p = patientEmail.toLowerCase();
        const { data, error } = await supabase
            .from('appointments')
            .insert({
                doctor_email: d,
                patient_email: p,
                appointment_time: new Date(time).toISOString(),
                reason: reason,
                status: 'scheduled'
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving appointment:', error);
            return null;
        }
        return data;
    },

    getAppointments: async (email, role) => {
        const e = email.toLowerCase();
        const column = role === 'doctor' ? 'doctor_email' : 'patient_email';
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq(column, e)
            .order('appointment_time', { ascending: true });

        if (error) {
            console.error('Error fetching appointments:', error);
            return [];
        }
        return data || [];
    },

    sendCallRequest: async (from, to, type) => {
        return await storage.saveMessage({
            from,
            to,
            text: `📞 Requested a ${type} call`,
            type: 'call_request',
            status: 'pending'
        });
    },

    updateMessageStatus: async (messageId, status) => {
        const { error } = await supabase
            .from('messages')
            .update({ status })
            .eq('id', messageId);
        if (error) console.error('Error updating message status:', error);
        return true;
    },

    clearMessages: async (email1, email2) => {
        const e1 = email1.toLowerCase();
        const e2 = email2.toLowerCase();

        // 1. Clear local IndexedDB first (immediate UI feedback)
        await db.messages
            .where('from_email').anyOf([e1, e2])
            .and(m => (m.to_email === e1 || m.to_email === e2))
            .delete();

        // 2. Clear Supabase - Using separate calls for reliability over complex .or() filters
        const { error: error1 } = await supabase
            .from('messages')
            .delete()
            .eq('from_email', e1)
            .eq('to_email', e2);

        const { error: error2 } = await supabase
            .from('messages')
            .delete()
            .eq('from_email', e2)
            .eq('to_email', e1);

        if (error1 || error2) {
            console.error('Error clearing messages from cloud:', error1 || error2);
        }

        return true;
    },

    deleteMessage: async (messageId) => {
        // 1. Delete from local IndexedDB
        await db.messages.delete(messageId);

        // 2. Delete from Supabase
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (error) {
            console.error('Error deleting message from cloud:', error);
        }

        return true;
    },

    // --- Health Profile ---
    getHealthProfile: async (patientEmail) => {
        const email = patientEmail.toLowerCase();
        const { data, error } = await supabase
            .from('health_profiles')
            .select('*')
            .eq('patient_email', email)
            .maybeSingle();
        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching health profile:', error);
        }
        return data || null;
    },

    saveHealthProfile: async (patientEmail, profile) => {
        const email = patientEmail.toLowerCase();
        const payload = {
            patient_email: email,
            weight: profile.weight || null,
            height: profile.height || null,
            blood_type: profile.bloodType || null,
            current_conditions: profile.currentConditions || [],
            past_conditions: profile.pastConditions || null,
            allergies: profile.allergies || null,
            current_medications: profile.currentMedications || null,
            notes: profile.notes || null,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('health_profiles')
            .upsert(payload, { onConflict: 'patient_email' });

        if (error) {
            console.error('Error saving health profile:', error);
            return false;
        }
        return true;
    },

    // --- AI History Persistence ---
    getAiHistory: async (email) => {
        const { data, error } = await supabase
            .from('ai_history')
            .select('history')
            .eq('user_email', email)
            .maybeSingle();
        if (error && error.code !== 'PGRST116') console.error('Error fetching AI history:', error);
        return data ? data.history : [];
    },

    saveAiHistory: async (email, history) => {
        const updatedAt = new Date().toISOString();

        // 1. Save to local
        await db.ai_chat.put({
            user_email: email.toLowerCase(),
            history,
            updatedAt,
            synced: 0
        });

        // 2. Try sync
        if (navigator.onLine) {
            try {
                const { data: existing } = await supabase
                    .from('ai_history')
                    .select('id')
                    .eq('user_email', email.toLowerCase())
                    .maybeSingle();

                const dbData = { history, updated_at: updatedAt };
                let res;
                if (existing) {
                    res = await supabase
                        .from('ai_history')
                        .update(dbData)
                        .eq('id', existing.id);
                } else {
                    res = await supabase
                        .from('ai_history')
                        .insert([{ user_email: email.toLowerCase(), ...dbData }]);
                }

                if (!res.error) {
                    await db.ai_chat.update(email.toLowerCase(), { synced: 1 });
                }
            } catch (e) {
                console.warn('[Storage] AI History sync failed:', e);
            }
        }
        return true;
    },

    // --- Background Sync ---
    syncOfflineData: async () => {
        if (!navigator.onLine) return;
        console.log('[Storage] Starting background sync...');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Sync Vitals
        const pendingVitals = await db.vitals.where('synced').equals(0).toArray();
        for (const item of pendingVitals) {
            const dbLog = mapping.logToSupabase(item.data);
            const { error } = await supabase
                .from('health_logs')
                .insert([{
                    ...dbLog,
                    user_email: item.user_email,
                    user_id: user.id,
                    timestamp: item.timestamp
                }]);
            if (!error) await db.vitals.update(item.id, { synced: 1 });
        }

        // 2. Sync Messages
        const pendingMessages = await db.messages.where('synced').equals(0).toArray();
        for (const msg of pendingMessages) {
            const { error } = await supabase
                .from('messages')
                .insert([{
                    from_email: msg.from_email,
                    to_email: msg.to_email,
                    text: msg.text,
                    type: msg.type,
                    status: msg.status,
                    timestamp: msg.timestamp
                }]);
            if (!error) await db.messages.update(msg.id, { synced: 1 });
        }

        // 3. Sync AI Chat
        const pendingAiChat = await db.ai_chat.where('synced').equals(0).toArray();
        for (const chat of pendingAiChat) {
            const { data: existing } = await supabase
                .from('ai_history')
                .select('id')
                .eq('user_email', chat.user_email)
                .maybeSingle();

            const dbData = { history: chat.history, updated_at: chat.updatedAt };
            let res;
            if (existing) {
                res = await supabase.from('ai_history').update(dbData).eq('id', existing.id);
            } else {
                res = await supabase.from('ai_history').insert([{ user_email: chat.user_email, ...dbData }]);
            }
            if (!res.error) await db.ai_chat.update(chat.user_email, { synced: 1 });
        }

        // 4. Sync Clinical Reports
        const pendingReports = await db.clinical_reports.where('synced').equals(0).toArray();
        for (const report of pendingReports) {
            const { error } = await supabase
                .from('clinical_reports')
                .insert([{
                    patient_email: report.patient_email,
                    content: report.content,
                    timestamp: report.timestamp
                }]);
            if (!error) await db.clinical_reports.update(report.id, { synced: 1 });
        }

        console.log('[Storage] Background sync completed.');
    },

    // --- Clinical Reports ---
    saveClinicalReport: async (patientEmail, reportData) => {
        const timestamp = new Date().toISOString();

        // Always save to local DB first
        const localId = await db.clinical_reports.add({
            patient_email: patientEmail,
            content: reportData,
            timestamp,
            synced: 0
        });

        const { data, error } = await supabase
            .from('clinical_reports')
            .insert([{
                patient_email: patientEmail,
                content: reportData,
                timestamp
            }])
            .select()
            .single();

        if (!error && data) {
            await db.clinical_reports.update(localId, { synced: 1 });
            return data;
        }

        if (error) console.error('Error saving clinical report to cloud:', error);

        // Return a mock object if cloud save fails so UI continues to work
        return { id: localId, patient_email: patientEmail, content: reportData, timestamp };
    },

    getClinicalReports: async (patientEmail) => {
        // Fetch from local DB
        const localReports = await db.clinical_reports
            .where('patient_email')
            .equals(patientEmail)
            .toArray();

        // Fetch from Supabase
        const { data: remoteReports, error } = await supabase
            .from('clinical_reports')
            .select('*')
            .eq('patient_email', patientEmail)
            .order('timestamp', { ascending: false });

        if (error) {
            console.error('Error fetching clinical reports from cloud:', error);
            // Return local reports if cloud fails
            return localReports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }

        // Merge and de-duplicate by timestamp/content if necessary
        // For simplicity, we trust the cloud as source of truth but include unsynced local ones
        const unsyncedLocal = localReports.filter(lr => lr.synced === 0);

        const merged = [...unsyncedLocal, ...(remoteReports || [])];
        return merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    // --- Notifications ---
    getNotifications: async (email) => {
        return await db.notifications
            .where('user_email')
            .equals(email)
            .reverse()
            .sortBy('timestamp');
    },

    addNotification: async (email, type, message) => {
        return await db.notifications.add({
            user_email: email,
            type,
            message,
            timestamp: new Date().toISOString(),
            read: 0
        });
    },

    markNotificationsAsRead: async (email) => {
        return await db.notifications
            .where('user_email')
            .equals(email)
            .modify({ read: 1 });
    },

    deleteReadNotifications: async (email) => {
        return await db.notifications
            .where('user_email')
            .equals(email)
            .filter(n => n.read === 1 || n.read === true)
            .delete();
    },

    clearAllNotifications: async (email) => {
        return await db.notifications
            .where('user_email')
            .equals(email)
            .delete();
    },

    getLastWaterReminder: async (email) => {
        const waterNotes = await db.notifications
            .where('user_email')
            .equals(email)
            .filter(n => n.type === 'water')
            .reverse()
            .sortBy('timestamp');
        return waterNotes[0] || null;
    },

    addSOS: async (senderEmail, senderName) => {
        // Broadcast SOS to all connected partners
        const connections = await db.connections
            .where('p_email').equals(senderEmail)
            .or('d_email').equals(senderEmail)
            .toArray();

        const targets = connections.map(c => c.p_email === senderEmail ? c.d_email : c.p_email);

        for (const targetEmail of [...new Set(targets)]) {
            await db.notifications.add({
                user_email: targetEmail,
                type: 'SOS',
                message: `EMERGENCY SOS: ${senderName} (${senderEmail}) is requesting immediate help!`,
                timestamp: Date.now(),
                read: 0
            });
        }

        // Also add to the sender's own notifications for log
        return await db.notifications.add({
            user_email: senderEmail,
            type: 'SOS',
            message: `Emergency SOS sent to your clinical team. Help is on the way.`,
            timestamp: Date.now(),
            read: 0
        });
    }
};

export default storage;
