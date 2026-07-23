import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyCK4XU2lV_ya2qTfoLe_KUbmIic1FPPpyA";
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello!");
    console.log(`[${modelName}] Success!`);
  } catch (err) {
    console.error(`[${modelName}] Error:`, err.message);
  }
}

async function run() {
  await testModel("gemini-2.5-flash");
  await testModel("gemini-flash-latest");
}

run();
