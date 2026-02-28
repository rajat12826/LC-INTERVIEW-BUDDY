// utils/GroqAIModel.ts

import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ || '';
// console.log("groq",GROQ_API_KEY);

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Mirrors the Gemini chatSession.sendMessage() API shape
// so you only need to change the import, nothing else in your page
class GroqChatSession {
  private history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  async sendMessage(userMessage: string): Promise<{ response: { text: () => string } }> {
    // Append the new user message to history
    this.history.push({ role: 'user', content: userMessage });

    const { data } = await axios.post(
      GROQ_BASE_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: this.history,
        temperature: 0.7,
        max_tokens: 8192,
        top_p: 0.95,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    const assistantText: string = data.choices[0].message.content;

    // Append assistant reply to history so future turns have context
    this.history.push({ role: 'assistant', content: assistantText });

    // Return the same shape Gemini returns: { response: { text() } }
    return {
      response: {
        text: () => assistantText,
      },
    };
  }

  // Optional: clear history to start a fresh conversation
  reset() {
    this.history = [];
  }
}

export const chatSession = new GroqChatSession();