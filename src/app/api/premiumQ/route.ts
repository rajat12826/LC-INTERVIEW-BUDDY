// app/api/premiumQ/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let cachedPremiumQuestions: any[] | null = null;

function loadPremiumQuestions(): any[] {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'premiumQ.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export async function GET() {
  try {
    if (!cachedPremiumQuestions) {
      cachedPremiumQuestions = loadPremiumQuestions();
    }

    return NextResponse.json(cachedPremiumQuestions, {
      headers: {
        'Cache-Control': 'public, max-age=3600, must-revalidate', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error serving premium questions:', error);
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }
}