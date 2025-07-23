// src/types/Question.ts

export interface Question {
  Difficulty: string;
  Question: string;
  'Frequency (Number of Companies)': number;
  'Link of Question': string;
  'Companies Asking This Question': string; // This is a string as per your provided example structure
  Topics: string; // This is a string as per your provided example structure
}