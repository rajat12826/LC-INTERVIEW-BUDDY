// utils/GroqAIModel.ts

import axios from 'axios';

// Mirrors the Gemini chatSession.sendMessage() API shape
class GroqChatSession {
  private history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  private mapModelName(uiModel: string): string {
    switch (uiModel) {
      case 'Claude 4.5 Sonnet': return 'qwen/qwen3.8-27b';
      case 'GPT-5':             return 'openai/gpt-oss-120b';
      case 'GPT-5-mini':        return 'openai/gpt-oss-20b';
      case 'Gemini 3':          return 'openai/gpt-oss-120b';
      default:                  return 'openai/gpt-oss-120b';
    }
  }

  // Set default to openai/gpt-oss-120b as a fast, high quality coding model
  async sendMessage(userMessage: string, model: string = 'openai/gpt-oss-120b'): Promise<{ response: { text: () => string } }> {
    const actualModel = this.mapModelName(model);

    // 1. Check user's own key in localStorage (BYOK: Bring Your Own Key)
    let userApiKey: string | undefined = undefined;
    if (typeof window !== 'undefined') {
      const userKey = localStorage.getItem('user_groq_api_key');
      if (userKey && userKey.trim().length > 0) {
        userApiKey = userKey.trim();
      }
    }

    try {
      // Dispatched securely to server-side API route.
      // Private server fallback keys (GROQ_KEYS / GROQ_API_KEYS) stay safe on the server and are NEVER leaked to the client!
      // Each request from the tutor pages contains the self-contained context and previous conversation.
      const { data } = await axios.post('/api/chat', {
        messages: [{ role: 'user', content: userMessage }],
        model: actualModel,
        userApiKey,
      });

      const assistantText: string = data.content;
      this.history.push({ role: 'user', content: userMessage });
      this.history.push({ role: 'assistant', content: assistantText });

      return {
        response: {
          text: () => assistantText,
        },
      };
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.error ||
        error?.message ||
        'Error contacting AI tutor. Please check your connection or add a key in Profile Settings.';
      throw new Error(errorMsg);
    }
  }

  reset() {
    this.history = [];
  }
}

export const chatSession = new GroqChatSession();