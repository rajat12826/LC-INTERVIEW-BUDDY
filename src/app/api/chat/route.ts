import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import axios from 'axios';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

// 5-10 fallback API keys stored securely on the server in GROQ_KEYS or GROQ_API_KEYS
const getFallbackKeys = () => {
  const keysStr =
    process.env.GROQ_KEYS ||
    process.env.GROQ_API_KEYS ||
    process.env.GROQ ||
    '';
  return keysStr
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
};

// Initialize to random number so every server instance starts on a different key
let currentKeyIndex = Math.floor(Math.random() * 1000);

const getApiKey = (userApiKey?: string) => {
  // 1. If user provided their own key in Profile Settings, use it
  if (userApiKey && userApiKey.trim().length > 0) {
    return userApiKey.trim();
  }

  // 2. Round-robin fallback keys from server environment
  const fallbackKeys = getFallbackKeys();
  if (fallbackKeys.length === 0) return '';

  const key = fallbackKeys[currentKeyIndex % fallbackKeys.length];
  currentKeyIndex++;
  return key;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model, userApiKey } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Protect fallback keys: users must be logged in OR have provided their own BYOK key
    const hasOwnKey = typeof userApiKey === 'string' && userApiKey.trim().length > 0;
    if (!hasOwnKey) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          {
            error:
              'Please sign in or provide your own Groq API key in Profile Settings to use the AI tutor.',
          },
          { status: 401 }
        );
      }
    }

    const apiKey = getApiKey(userApiKey);
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'No Groq API key found. Please configure GROQ_KEYS in .env.local or add your own key in Profile Settings.',
        },
        { status: 401 }
      );
    }

    const actualModel = model || 'openai/gpt-oss-120b';

    const response = await axios.post(
      GROQ_BASE_URL,
      {
        model: actualModel,
        messages,
        temperature: 0.7,
        max_tokens: 8192,
        top_p: 0.95,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 60000,
      }
    );

    const assistantText = response.data?.choices?.[0]?.message?.content || '';
    return NextResponse.json({ content: assistantText });
  } catch (error: any) {
    console.error('Groq Chat Server Error:', error?.response?.data || error?.message);
    const status = error?.response?.status || 500;
    const errorMsg =
      error?.response?.data?.error?.message ||
      error?.message ||
      'Failed to generate response from AI model';

    return NextResponse.json({ error: errorMsg }, { status });
  }
}
