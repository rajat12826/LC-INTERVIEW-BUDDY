// app/api/questions/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface CachedPayload {
  questions: any[];
  problems: any[];
  allCompanies: string[];
  allTopics: string[];
}

let cachedData: CachedPayload | null = null;

function loadQuestionsData(): CachedPayload {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'questions.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const questions = JSON.parse(fileContents);

  // Pre-calculate problems, companies, and topics
  const companyFreq: Record<string, number> = {};
  const topicFreq: Record<string, number> = {};

  const problems = questions.map((problem: any) => {
    const companies = (problem['Companies Asking This Question'] || '').split(',').map((c: string) => c.trim()).filter(Boolean);
    const topics = (problem.Topics || '').split(',').map((t: string) => t.trim()).filter(Boolean);

    companies.forEach((company: string) => {
      companyFreq[company] = (companyFreq[company] || 0) + 1;
    });
    topics.forEach((topic: string) => {
      topicFreq[topic] = (topicFreq[topic] || 0) + 1;
    });

    return {
      id: problem['Link of Question'] || Math.random().toString(36),
      title: problem.Question,
      difficulty: problem.Difficulty,
      frequency: parseInt(problem['Frequency (Number of Companies)']) || 0,
      link: problem['Link of Question'],
      companies,
      topics,
    };
  });

  const allCompanies = Object.keys(companyFreq).sort((a, b) => companyFreq[b] - companyFreq[a]);
  const allTopics = Object.keys(topicFreq).sort((a, b) => topicFreq[b] - topicFreq[a]);

  return {
    questions,
    problems,
    allCompanies,
    allTopics,
  };
}

export async function GET() {
  try {
    if (!cachedData) {
      cachedData = loadQuestionsData();
    }

    return NextResponse.json(cachedData, {
      headers: {
        'Cache-Control': 'public, max-age=3600, must-revalidate', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error serving questions.json:', error);
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }
}