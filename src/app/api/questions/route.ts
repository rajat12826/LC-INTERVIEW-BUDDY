// app/api/questions/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'questions.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const questions = JSON.parse(fileContents);

    return NextResponse.json(questions, {
      headers: {
        'Cache-Control': 'public, max-age=3600, must-revalidate', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error serving questions.json:', error);
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }
}