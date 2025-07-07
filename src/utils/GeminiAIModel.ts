import { GoogleGenerativeAI} from "@google/generative-ai";
  
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY||"";
console.log(apiKey);

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.7,      
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",  
};

export const chatSession = model.startChat({
  generationConfig,
});