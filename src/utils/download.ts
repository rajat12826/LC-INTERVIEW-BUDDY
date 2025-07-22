// src/utils/download.ts
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Assuming you install this package

// Define the API endpoint for the daily question
const DAILY_QUESTION_API_URL = "https://leetcode-api-pied.vercel.app/daily";

// Define the target path for your JSON file
const JSON_FILE_PATH = path.resolve(process.cwd(), 'src', 'lib', 'questions.json');

// Your Google Generative AI API Key
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY; // Get from environment variable
if (!API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set.");
}
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash" }); // Use gemini-flash

async function fetchDailyQuestion(): Promise<any | null> {
    try {
        const response = await fetch(DAILY_QUESTION_API_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch daily question: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching daily question from API: ${error}`);
        return null;
    }
}

async function transformQuestionDataWithAI(rawData: any): Promise<any | null> {
    const prompt = `Given the following raw LeetCode daily question data in JSON format, transform it into a new JSON object with the following keys and values. If a value is not directly available, infer it reasonably or use "N/A" for strings, 0 for numbers, and empty string for arrays. For "Topics", if not present, provide a reasonable guess based on the question title/content.

    Input JSON:
    ${JSON.stringify(rawData, null, 2)}

    Output JSON Format:
    {
        "Difficulty": "HARD" | "MEDIUM" | "EASY",
        "Question": "Zuma Game",
        "Frequency (Number of Companies)": 0,
        "Link of Question": "https://leetcode.com/problems/zuma-game",
        "Companies Asking This Question": "Company A, Company B",
        "Topics": "String, Dynamic Programming, Stack, Breadth-First Search, Memoization"
    }

    Ensure "Difficulty" is uppercase. For "Companies Asking This Question", if no specific companies are mentioned, use "N/A". Make sure the output is *only* the JSON object, without any additional text or markdown.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Attempt to parse the text as JSON
        const transformedJson = JSON.parse(text);
        return transformedJson;
    } catch (error) {
        console.error(`Error transforming data with AI: ${error}`);
        return null;
    }
}

async function updateQuestionsJson(transformedQuestion: any) {
    let questions: any[] = [];
    if (fs.existsSync(JSON_FILE_PATH)) {
        try {
            const fileContents = fs.readFileSync(JSON_FILE_PATH, 'utf8');
            questions = JSON.parse(fileContents);
        } catch (error) {
            console.warn(`Warning: Could not decode existing JSON from ${JSON_FILE_PATH}. Starting with empty list.`);
            questions = [];
        }
    }

    // Add fetchedDate for tracking.
    // Use the date from the API response if available, otherwise current date.
    const fetchedDate = transformedQuestion.fetchedDate || new Date().toISOString().split('T')[0];
    transformedQuestion.fetchedDate = fetchedDate;
    transformedQuestion.isDaily = true;

    // Check if a question for today already exists based on 'Link of Question' and 'fetchedDate'
    let foundExisting = false;
    for (let i = 0; i < questions.length; i++) {
        if (questions[i]['Link of Question'] === transformedQuestion['Link of Question'] &&
            questions[i].fetchedDate === transformedQuestion.fetchedDate) {
            questions[i] = transformedQuestion; // Update existing entry
            foundExisting = true;
            console.log(`Updated existing daily question for ${transformedQuestion.fetchedDate}: ${transformedQuestion.Question}`);
            break;
        }
    }

    if (!foundExisting) {
        questions.unshift(transformedQuestion); // Add new daily question to the beginning
        console.log(`Added new daily question for ${transformedQuestion.fetchedDate}: ${transformedQuestion.Question}`);
    }

    // Ensure the directory exists
    fs.mkdirSync(path.dirname(JSON_FILE_PATH), { recursive: true });

    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(questions, null, 2));
    console.log(`Updated ${JSON_FILE_PATH} with daily question data.`);
}

async function main() {
    console.log("Starting daily LeetCode question fetch and AI transformation...");
    const dailyApiResponse = await fetchDailyQuestion();

    if (dailyApiResponse) {
        // Pass the entire API response to the AI for transformation
        const transformedData = await transformQuestionDataWithAI(dailyApiResponse);
        if (transformedData) {
            await updateQuestionsJson(transformedData);
        } else {
            console.error("AI transformation failed. JSON file not updated.");
        }
    } else {
        console.error("Failed to fetch daily question. JSON file not updated.");
    }
}

main();