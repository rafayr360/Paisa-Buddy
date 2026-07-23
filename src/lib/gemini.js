import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── MULTI-KEY ROTATION ───────────────────────────────────────────
// Each key has its own genAI instance (cached). When one key's quota
// is exhausted (429), system automatically tries the next key.
const apiKeyCache = new Map(); // key → GoogleGenerativeAI instance

function getApiKeys() {
  const keys = [
    import.meta.env.VITE_GEMINI_API_KEY,
    import.meta.env.VITE_GEMINI_API_KEY_2,
    import.meta.env.VITE_GEMINI_API_KEY_3,
  ].filter(k => k && k !== "YOUR_SECOND_API_KEY_HERE" && k !== "YOUR_THIRD_API_KEY_HERE");
  return keys;
}

function getGenAIForKey(apiKey) {
  if (apiKeyCache.has(apiKey)) return apiKeyCache.get(apiKey);
  const instance = new GoogleGenerativeAI(apiKey);
  apiKeyCache.set(apiKey, instance);
  return instance;
}


const safetySettings = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

// Verified models only
const TEXT_FALLBACK = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-2.0-flash"];

// ─── SIMPLE CALL: No intensive loops to save quota ───────────────
async function generateWithFallback(promptArgs, modelName = "gemini-1.5-flash-latest", maxTokens = 150) {
  const apiKeys = getApiKeys();
  if (!apiKeys.length) throw new Error("No API keys configured");

  // Only try the first 2 keys at most (no huge loops)
  const keysToTry = apiKeys.slice(0, 2);

  for (const apiKey of keysToTry) {
    try {
      const ai = getGenAIForKey(apiKey);
      const model = ai.getGenerativeModel({
        model: modelName,
        safetySettings,
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0 }
      });
      return await model.generateContent(promptArgs);
    } catch (err) {
      const isQuota = err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED");
      if (isQuota && keysToTry.indexOf(apiKey) < keysToTry.length - 1) {
        console.warn(`Key quota hit → trying fallback key`);
        continue;
      }
      throw err;
    }
  }
  throw new Error("API_LIMIT_EXCEEDED");
}

// ─── GROQ API CALL (PRIMARY) ─────────────────────────────────────
async function callGroqTextApi(prompt, modelName = "meta-llama/llama-4-scout-17b-16e-instruct") {
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY_PRIMARY || import.meta.env.VITE_GROQ_API_KEY;
  if (!groqApiKey) throw new Error("No Groq API Key found");

  const response = await fetch("/api-groq/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 250
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "Groq API Error");
  return data.choices[0].message.content;
}


// ─── SYSTEM PROMPT (Compact for speed) ───────────────────────────
const buildSystemPrompt = (currency) =>
  `Finance AI. Currency:${currency}. Understand English+Roman Urdu.
Expense categories: Housing,Food & Dining,Transport,Utilities,Shopping,Health,Entertainment,Gym & Fitness,Travel,Education,Coffee & Cafe,Savings Transfer
Income categories: Salary,Freelance,Investments,Other Income
Entertainment includes: Netflix, Amazon Prime, Spotify, Subscriptions, Movies, etc.

Rules:
- "savings mein X dalo" or "save X for goal" → ADD_SAVINGS
- "budget X rakho" or "X ka budget" → UPDATE_BUDGET
- spent/received money → ADD_TRANSACTION
- "me" or "mein" are connectors (e.g. "Bank me dalo" -> goal is "Bank"). Never use "me" as a goal name.
Return ONE JSON only. No extra text. No markdown.
{"action":"ADD_TRANSACTION","title":"<title>","amount":<number>,"type":"expense"|"income","category":"<category>","currency":"${currency}"}
{"action":"ADD_SAVINGS","goalName":"<goal name>","amount":<number>,"currency":"${currency}"}
{"action":"UPDATE_BUDGET","categoryName":"<expense category>","amount":<number>,"currency":"${currency}"}
{"action":"OFF_TOPIC"}`;

// ─── OFFLINE LOCAL FALLBACK (100% reliable — no AI needed) ───────
function localParseCommand(userInput, currency) {
  const low = userInput.toLowerCase();
  const nums = userInput.match(/\d+(\.\d+)?/g);
  const amount = nums ? parseFloat(nums[0]) : 0;

  // ── 1. SAVINGS (highest priority) ──
  const savingsWords = ["saving", "savings", "bachao", "bacha", "fund", "goal", "jama", "save", "bachat"];
  if (savingsWords.some(w => low.includes(w)) && amount > 0) {
    let goalName = "Savings";
    const goalPatterns = [
      /for\s+([a-zA-Z\s]+)/i,
      /(?:goal|fund|save)\s+([a-zA-Z\s]+)/i,
      /([a-zA-Z\s]+?)\s+(?:mein|me|k liye|ke liye)/i,
    ];
    for (const pattern of goalPatterns) {
      const match = userInput.match(pattern);
      if (match?.[1]?.trim().length > 1) { 
        const gName = match[1].trim().toLowerCase();
        if (gName !== "me" && gName !== "mein") {
          goalName = match[1].trim(); 
          break; 
        }
      }
    }
    return { action: "ADD_SAVINGS", goalName, amount, currency };
  }

  // ── 2. BUDGET ──
  const budgetWords = ["budget", "limit", "set budget", "budget rakho", "budget set", "budget barao"];
  if (budgetWords.some(w => low.includes(w)) && amount > 0) {
    const budgetCategoryMap = [
      { words: ["food", "khana", "dinner", "lunch", "restaurant"], cat: "Food & Dining" },
      { words: ["transport", "uber", "petrol", "fuel", "travel"], cat: "Transport" },
      { words: ["shopping", "clothes", "kapre"], cat: "Shopping" },
      { words: ["health", "doctor", "medicine", "dawa"], cat: "Health" },
      { words: ["entertainment", "movie", "cinema"], cat: "Entertainment" },
      { words: ["gym", "fitness"], cat: "Gym & Fitness" },
      { words: ["education", "school", "fees", "university"], cat: "Education" },
      { words: ["coffee", "chai", "cafe"], cat: "Coffee & Cafe" },
      { words: ["bijli", "electricity", "gas", "internet", "bill"], cat: "Utilities" },
      { words: ["rent", "ghar", "house", "makaan"], cat: "Housing" },
    ];
    let categoryName = "Shopping";
    for (const { words, cat } of budgetCategoryMap) {
      if (words.some(w => low.includes(w))) { categoryName = cat; break; }
    }
    return { action: "UPDATE_BUDGET", categoryName, amount, currency };
  }

  // ── 3. INCOME ──
  const incomeKeywords = [
    { words: ["salary", "salari", "tankhwa", "job income"], cat: "Salary" },
    { words: ["freelance", "freelancing", "project", "client"], cat: "Freelance" },
    { words: ["invest", "dividend", "profit", "share"], cat: "Investments" },
    { words: ["mili", "mily", "milye", "earn", "receive", "income", "aya", "aaya", "mila"], cat: "Other Income" },
  ];
  for (const { words, cat } of incomeKeywords) {
    if (words.some(w => low.includes(w)) && amount > 0) {
      return { action: "ADD_TRANSACTION", title: userInput.slice(0, 25), amount, type: "income", category: cat, currency };
    }
  }

  // ── 4. EXPENSE ──
  const expenseKeywords = [
    { words: ["chai", "coffee", "cafe", "tea", "latte"], cat: "Coffee & Cafe" },
    { words: ["food", "khana", "dinner", "lunch", "breakfast", "biryani", "pizza", "burger", "restaurant", "khaya", "meal"], cat: "Food & Dining" },
    { words: ["uber", "taxi", "bus", "petrol", "fuel", "transport", "train", "rickshaw", "metro", "bike"], cat: "Transport" },
    { words: ["bijli", "electricity", "gas", "internet", "wifi", "bill"], cat: "Utilities" },
    { words: ["shopping", "clothes", "kapre", "shirt", "shoes", "joota", "dress", "mall"], cat: "Shopping" },
    { words: ["doctor", "hospital", "medicine", "dawa", "health", "medical", "clinic"], cat: "Health" },
    { words: ["gym", "fitness", "exercise", "workout"], cat: "Gym & Fitness" },
    { words: ["movie", "cinema", "game", "entertainment", "show", "concert", "netflix", "prime", "subscription", "youtube premium", "spotify", "hotstar"], cat: "Entertainment" },
    { words: ["trip", "flight", "tour", "vacation", "hotel stay"], cat: "Travel" },
    { words: ["school", "fees", "university", "tuition", "book", "course", "education"], cat: "Education" },
    { words: ["ghar", "rent", "house", "makaan", "home"], cat: "Housing" },
  ];
  for (const { words, cat } of expenseKeywords) {
    if (words.some(w => low.includes(w)) && amount > 0) {
      return { action: "ADD_TRANSACTION", title: userInput.slice(0, 25), amount, type: "expense", category: cat, currency };
    }
  }

  // ── 5. Generic fallback: amount only → expense ──
  if (amount > 0) {
    return { action: "ADD_TRANSACTION", title: userInput.slice(0, 25), amount, type: "expense", category: "Shopping", currency };
  }

  return { action: "ERROR", message: "Amount nahi mila. Try: '500 ki chai', '10000 savings mein dalo', '5000 food budget'" };
}


// ─── PUBLIC API ───────────────────────────────────────────────────
export async function parseCommandWithAI(userInput, context = {}) {
  const currency = context.currency || "PKR";

  try {
    const prompt = buildSystemPrompt(currency) + "\n\nUser: " + userInput;
    let text;
    
    try {
      // 1. Primary: Try Groq First
      text = await callGroqTextApi(prompt);
    } catch (groqErr) {
      console.warn("Groq failed, falling back to Gemini:", groqErr?.message);
      // 2. Secondary: Fallback to Gemini
      const result = await generateWithFallback(prompt, "gemini-1.5-flash-latest");
      text = result.response.text();
    }

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    return JSON.parse(match[0]);
  } catch (error) {
    console.warn("AI failed entirely, using local fallback:", error?.message);
    // 3. Worst case: local parser
    return localParseCommand(userInput, currency);
  }
}

export async function parseReceiptWithAI(base64Data, mimeType) {
  try {
    const prompt = `Extract receipt data. Return ONLY JSON:
{"title":"Store name","amount":number,"currency":"DETECTED_3_LETTER_CODE","category":"Food & Dining|Shopping|Transport|Health|Entertainment|Other"}
CRITICAL: Detect the actual currency from the receipt (e.g., USD, EUR, GBP, AED). Do not just write PKR.
If currency is completely invisible or missing, then default to PKR.`;

    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!groqApiKey) throw new Error("Groq API key not found in environment.");

    const response = await fetch("/api-groq/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
            ]
          }
        ],
        temperature: 0
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "Groq API Error");

    const text = data.choices[0].message.content;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    
    return JSON.parse(match[0]);
  } catch (error) {
    console.error("Receipt scan error (Groq):", error?.message);
    return { error: "Receipt scan failed. Please try again." };
  }
}

export async function generateFinanceInsights(data, context = {}) {
  try {
    const prompt = `Finance advisor. Currency:${context.currency}.
Data: spent=${context.totalSpent}, categories=${JSON.stringify(data.topCategories)}.
Give 3 VERY SHORT tips in Roman Urdu. One line each. No translations. Return JSON array only:
["tip1","tip2","tip3"]`;

    let text;
    try {
      // 1. Primary for Insights: Gemini (User prefers Gemini's short style)
      const result = await generateWithFallback(prompt, "gemini-1.5-flash-latest");
      text = result.response.text();
    } catch (geminiErr) {
      // 2. Fallback: Groq
      text = await callGroqTextApi(prompt);
    }

    text = text.replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    return [
      "Apna daily kharch track karein!",
      "Food budget pe nazar rakhein.",
      "Is mahine ek savings goal set karein."
    ];
  }
}
