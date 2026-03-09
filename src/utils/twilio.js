/**
 * Notification Service for Maatri Shield
 *
 * Channels:
 *   📲 Telegram Bot API  — Free, unlimited (replaces WhatsApp)
 *   📱 Fast2SMS          — Free SMS credits for India (replaces Twilio SMS)
 *
 * SETUP:
 *  Telegram:
 *    1. Open Telegram → Search @BotFather → /newbot
 *    2. Name your bot → Copy the Bot Token
 *    3. Start your bot (search it, press Start)
 *    4. Visit: https://api.telegram.org/bot<TOKEN>/getUpdates
 *    5. Copy the "id" value → that's your CHAT_ID
 *    6. Paste both into .env
 *
 *  Fast2SMS:
 *    1. Sign up at https://www.fast2sms.com
 *    2. Go to Dev API → Copy API key into .env
 */

const TELEGRAM_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
const FAST2SMS_KEY = import.meta.env.VITE_FAST2SMS_API_KEY;

const isTelegramConfigured =
    TELEGRAM_TOKEN &&
    TELEGRAM_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN' &&
    TELEGRAM_CHAT_ID &&
    TELEGRAM_CHAT_ID !== 'YOUR_TELEGRAM_CHAT_ID';

const isFast2SMSConfigured =
    FAST2SMS_KEY && FAST2SMS_KEY !== 'YOUR_FAST2SMS_API_KEY';

const twilioMock = {
    messageHistory: [],
    listeners: [],

    onMessage: (callback) => {
        twilioMock.listeners.push(callback);
        return () => {
            twilioMock.listeners = twilioMock.listeners.filter(l => l !== callback);
        };
    },

    notify: (type, to, message, status = 'sent') => {
        const entry = {
            id: Date.now() + Math.random(),
            type,
            to,
            message,
            status,
            timestamp: new Date().toISOString()
        };
        twilioMock.messageHistory = [entry, ...twilioMock.messageHistory].slice(0, 50);
        twilioMock.listeners.forEach(listener => listener(entry));
        return entry;
    },

    // 📱 SMS via Fast2SMS (India)
    sendSMS: async (to, message) => {
        console.log(`[Notification] Sending SMS to ${to}`);

        if (!isFast2SMSConfigured) {
            console.warn('[SMS] Fast2SMS key not configured. Showing in simulation log.');
            twilioMock.notify('SMS', to, message, 'simulated');
            return { success: false, simulated: true };
        }

        try {
            // Strip country code for Fast2SMS — it only accepts 10-digit Indian numbers
            const mobile = to.replace(/^\+91/, '').replace(/\D/g, '').slice(-10);

            const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
                method: 'POST',
                headers: {
                    authorization: FAST2SMS_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    route: 'q',
                    message: message,
                    language: 'english',
                    flash: 0,
                    numbers: mobile
                })
            });

            const result = await response.json();
            if (result.return === true) {
                console.log(`[SMS] ✅ Sent via Fast2SMS to ${to}`);
                twilioMock.notify('SMS', to, message, 'delivered');
                return { success: true };
            } else {
                console.warn('[SMS] Fast2SMS error:', result.message);
                twilioMock.notify('SMS', to, `⚠️ SMS failed: ${JSON.stringify(result.message)}`, 'failed');
                return { success: false };
            }
        } catch (err) {
            console.warn('[SMS] Network error, using simulation:', err.message);
            twilioMock.notify('SMS', to, message, 'simulated');
            return { success: false, simulated: true };
        }
    },

    // 📲 Telegram (replaces WhatsApp — free, unlimited)
    sendWhatsApp: async (to, message) => {
        // We use Telegram as the WhatsApp replacement
        console.log(`[Notification] Sending Telegram message (to: ${to})`);

        if (!isTelegramConfigured) {
            console.warn('[Telegram] Not configured. Showing in simulation log.');
            twilioMock.notify('Telegram', to, message, 'simulated');
            return { success: false, simulated: true };
        }

        try {
            const text = `🌸 *Maatri Shield Alert*\n📱 For: ${to}\n\n${message}`;
            const response = await fetch(
                `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text,
                        parse_mode: 'Markdown'
                    })
                }
            );
            const result = await response.json();
            if (result.ok) {
                console.log(`[Telegram] ✅ Message sent successfully`);
                twilioMock.notify('Telegram', to, message, 'delivered');
                return { success: true };
            } else {
                console.warn('[Telegram] Error:', result.description);
                twilioMock.notify('Telegram', to, `⚠️ Telegram failed: ${result.description}`, 'failed');
                return { success: false };
            }
        } catch (err) {
            console.warn('[Telegram] Network error, using simulation:', err.message);
            twilioMock.notify('Telegram', to, message, 'simulated');
            return { success: false, simulated: true };
        }
    }
};

export default twilioMock;
