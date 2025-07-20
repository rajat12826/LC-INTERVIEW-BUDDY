import { GoogleGenerativeAI} from "@google/generative-ai";
  
const apiKey = process.env.GEMINI_API_KEY||"";
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.7,        // Reduced for more consistent responses
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",  // Changed from "application/json" to "text/plain"
};

export const chatSession = model.startChat({
  generationConfig,
});