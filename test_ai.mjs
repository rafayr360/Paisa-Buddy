import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyCK4XU2lV_ya2qTfoLe_KUbmIic1FPPpyA";
const genAI = new GoogleGenerativeAI(apiKey);
const MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

async function generateWithFallback(prompt) {
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      console.log(`   [✓ Using: ${modelName}]`);
      return result;
    } catch (err) {
      const isQuota = err?.message?.includes("429") || err?.message?.includes("quota");
      if (isQuota && MODELS.indexOf(modelName) < MODELS.length - 1) {
        console.log(`   [⚠️  ${modelName} quota hit, switching...]`);
        continue;
      }
      throw err;
    }
  }
}

const prompt = `
You are "Paisa Buddy". Valid Income: Salary, Freelance, Investments, Other Income.
Return EXACTLY ONE JSON. No markdown.
{"action":"ADD_TRANSACTION","title":"<title>","amount":<number>,"type":"expense"|"income","category":"<category>","currency":"PKR"}
`;

const tests = [
  "muj 10000 salary mili",
  "spent 200 on chai",
  "ma ne 40000 freelancing se earn kye",
  "chai pe 150 lge",
];

console.log("🧪 Testing AI Fallback Chain...\n");
for (const input of tests) {
  try {
    const result = await generateWithFallback(prompt + "\nUser: " + input);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : null;
    console.log(`✅ "${input}"`);
    console.log(`   →`, JSON.stringify(parsed));
    console.log();
  } catch (err) {
    console.log(`❌ "${input}"`);
    console.log(`   Error:`, err.message?.slice(0, 100));
    console.log();
  }
}
