import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();

/**
 * AI Care Assistant Service
 * Provides automated maternal health advice using Gemini 1.5 Flash.
 */
export const getAiCareAdvice = async (vitals, gestationalWeek, history, userPrompt) => {
    // 1. Connectivity Check
    const hasValidKey = API_KEY && API_KEY !== 'your_actual_api_key_here' && API_KEY.startsWith('AIza');

    if (!hasValidKey) {
        return "⚠️ **Maatri AI is disconnected.** To enable automated medical advice, please add your real Gemini API key to the `.env` file (VITE_GEMINI_API_KEY). You can get a free key at https://aistudio.google.com/app/apikey.";
    }

    try {
        // Initialize Model - FORCING v1 and gemini-2.5-flash for confirmed compatibility (March 2026 stable)
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel(
            { model: "gemini-2.5-flash" },
            { apiVersion: "v1" }
        );

        // 2. Safety Logic Rules (Maternal Health Protocol)
        const isHighBP = vitals?.systolic > 140 || vitals?.diastolic > 90;
        const lowerPrompt = userPrompt.toLowerCase();
        const hasRedFlags = lowerPrompt.includes('blurred vision') || lowerPrompt.includes('severe headache') || lowerPrompt.includes('right-side pain');

        if (isHighBP) {
            return "⚠️ ALERT: Your readings are high. Please contact your doctor immediately. High blood pressure during pregnancy requires urgent clinical evaluation.";
        }

        if (hasRedFlags) {
            return "The symptoms you've mentioned (blurred vision, severe headache, or right-side pain) are clinical red flags. **Please contact your obstetrician or go to the nearest emergency room immediately for a preeclampsia evaluation.**";
        }

        // 3. Automated Grounding & Direct generateContent Call
        const groundingPrompt = `
You are Maatri AI, a specialized maternal health assistant. Use the provided patient vitals context for every answer.

PATIENT DATA (DYNAMIC INJECTION):
- Blood Pressure: ${vitals?.systolic || '--'}/${vitals?.diastolic || '--'}
- Heart Rate: ${vitals?.heartRate || '--'}
- Glucose: ${vitals?.glucose || '--'}
- Gestational Week: ${gestationalWeek}
- Symptoms: ${vitals?.symptoms || 'None'}

USER MESSAGE: "${userPrompt}"

INSTRUCTION: Provide a specific clinical answer based on this context and the user message. Be professional and supportive.`;

        const result = await model.generateContent(groundingPrompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Gemini AI API Error:", error);
        return `⚠️ **AI Connection Error**: I was unable to connect. (Error: ${error.message || 'Network/Server Error'}). Please ensure your internet is stable and your API key is correct.`;
    }
};

/**
 * AI Medical Scribe Service
 * Generates a structured clinical report based on patient data and chat history.
 */
export const generateWeeklyClinicalReport = async (patientData, doctorChatLogs, aiChatHistory, doctorEmail) => {
    // 1. Connectivity Check
    const hasValidKey = API_KEY && API_KEY !== 'your_actual_api_key_here' && API_KEY.startsWith('AIza');

    if (!hasValidKey) {
        console.error("AI Scribe: Invalid or missing API Key.");
        throw new Error("Gemini API key is missing or invalid. Please check your .env file and ensure VITE_GEMINI_API_KEY starts with 'AIza'.");
    }

    console.log("AI Scribe: API Key presence verified.");
    try {
        // Prepare Sanitized Data (Keep only essential fields to avoid huge payloads/circular refs)
        const sanitizedVitals = (patientData || []).map(log => ({
            timestamp: log.timestamp,
            heartRate: log.heartRate,
            bp: `${log.systolic}/${log.diastolic}`,
            glucose: log.glucose,
            symptoms: log.symptoms
        }));

        const sanitizedChats = (doctorChatLogs || []).map(msg => ({
            role: msg.from === doctorEmail ? "doctor" : "patient",
            text: msg.text,
            time: msg.timestamp
        }));

        const sanitizedAi = (aiChatHistory || []).map(msg => ({
            role: msg.role,
            content: msg.parts?.[0]?.text || "No content"
        }));

        console.log(`AI Scribe: Processing data for report... (${sanitizedVitals.length} logs, ${sanitizedChats.length} chats)`);

        // Initialize Model - Using gemini-2.5-flash and v1 for absolute stability
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel(
            { model: "gemini-2.5-flash" },
            { apiVersion: "v1" }
        );

        const prompt = `
Act as a Clinical Analyst. Your goal is to summarize this patient's week based on the provided dataset.

DATASET:
- Vitals (JSON): ${JSON.stringify(sanitizedVitals)}
- Conversations (Doctor/Patient): ${JSON.stringify(sanitizedChats)}
- AI Context: ${JSON.stringify(sanitizedAi)}

INSTRUCTIONS:
1. **Subjective**: List all symptoms mentioned in the logs or chat history.
2. **Objective**: Analyze the vitals. Highlight any readings that cross medical thresholds:
   - Blood Pressure (BP) > 140/90 mmHg
   - Heart Rate (HR) > 100 bpm or < 60 bpm
   - Glucose > 140 mg/dL (post-meal) or > 100 mg/dL (fasting)
   Create a concise table of the weekly vitals.
3. **Assessment**: Provide a definitive Risk Level (Safe, Moderate, or High) based on the combined data and clinical reasoning.

FORMAT:
Use Markdown with clear headers: ## Subjective, ## Objective, ## Assessment.
Be clinical, objective, and concise.
`;

        console.log("AI Scribe: Sending prompt to Gemini (S.O.A.P Analysis)...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(`AI Scribe: Analysis received (${text.length} chars).`);

        return text;

    } catch (error) {
        console.error("AI Scribe Service Failure:", error);
        throw new Error(`AI Service Failure: ${error.message || 'Unknown Network/API Error'}`);
    }
};
