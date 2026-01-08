'use client'

import { useEffect, useState, useRef, FC, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuestionStore } from '@/utils/stores/useQuestionStore'
import dynamic from 'next/dynamic'
import clsx from 'clsx'
import { chatSession } from '@/utils/GeminiAIModel'
import useMobile from '@/hooks/useMobile'
import { Textarea } from '@/components/ui/textarea'

// Updated PQuestion type to match your format
interface PQuestion {
  title: string;
  link: string;
  difficulty: string;
  description: string;
  steps?: string[];
  illustration?: string;
  note?: string;
  examples: Array<{
    image?: string;
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints?: string[];
  topics?: string[] | string;
  companies?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  hasCode?: boolean
}

// ... (imports and other code remain the same)

interface ExampleProps {
  example: {
    input: any; // Accommodate various types
    output: any; // Accommodate various types
    explanation?: string;
    image?: string;
  };
  index: number;
}

const ExampleDisplay: FC<ExampleProps> = ({ example, index }) => {
  // Function to format any data (input or output) for display
  const formatDataForDisplay = (data: any): string => {
    if (Array.isArray(data)) {
      // Custom formatting for arrays:
      // Map each item to its JSON string representation, then join with newlines.
      // Nested objects/arrays will be stringified on a single line.
      const formattedItems = data.map(item => {
        if (typeof item === 'object' && item !== null) {
          // If item is an object or another array, stringify on a single line
          return JSON.stringify(item); // No indentation (null, 2) here!
        }
        // Otherwise, just convert to string (e.g., numbers, simple strings)
        return String(item);
      });
      // Wrap with brackets and join elements with newlines for array-like display
      return `[  ${formattedItems.join(',  ')}]`;
    } else if (typeof data === 'object' && data !== null) {
      // Use JSON.stringify for objects (non-arrays) to pretty-print them
      return JSON.stringify(data, null, 2); // Keep pretty-printing for standalone objects
    }
    // For primitive types (string, number, boolean), just convert to string
    return String(data);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 hover:shadow-md">
      <h4 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white mb-3">Example {index + 1}:</h4>
      {example.image && (
        <div className="mb-4">
          <img
            src={example.image}
            alt={`Example ${index + 1}`}
            className="w-full max-w-md mx-auto rounded-lg border border-slate-300 dark:border-slate-600 shadow-md"
          />
        </div>
      )}
      <div className="space-y-4 text-sm sm:text-base">
        {/* Input Display */}
        <div className="bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
            Input:
          </div>
          <pre className="p-3 sm:p-4 font-mono text-slate-800 dark:text-slate-200 text-sm overflow-x-auto whitespace-pre-wrap">
            {formatDataForDisplay(example.input)}
          </pre>
        </div>

        {/* Output Display */}
        <div className="bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
            Output:
          </div>
          <pre className="p-3 sm:p-4 font-mono text-slate-800 dark:text-slate-200 text-sm overflow-x-auto whitespace-pre-wrap">
            {formatDataForDisplay(example.output)}
          </pre>
        </div>

        {example.explanation && (
          <div>
            <strong className="text-slate-700 dark:text-slate-300">Explanation:</strong>
            <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">{example.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};


const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-l-purple-600 rounded-full animate-spin animation-delay-150 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-300">Loading Monaco Editor</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-75"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce animation-delay-150"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
);


export default function AITutorPage() {
  const params = useParams()
  const router = useRouter()
  const { getQuestionPById } = useQuestionStore()

  const isMobile = useMobile()
  const [question, setQuestion] = useState<PQuestion | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [showProblemDetails, setShowProblemDetails] = useState(true)

  // Monaco Editor states
  const [code, setCode] = useState('// Write your solution here...\n\n')
  // console.log(code);
  
  const [language, setLanguage] = useState('javascript')
  const [isEditorMinimized, setIsEditorMinimized] = useState(false)
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal')
  const [editorTheme, setEditorTheme] = useState('vs-dark')
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [monacoError, setMonacoError] = useState<string | null>(null)
  const [editorMounted, setEditorMounted] = useState(false)
  const [isClient, setIsClient] = useState(false); // NEW STATE FOR CLIENT-SIDE RENDERING

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<any>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, []);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight()
  }, [userInput, adjustTextareaHeight])

  // Set isClient to true once component mounts on the client
  useEffect(() => {
    setIsClient(true);
  }, []);


  const getCodeTemplate = useCallback((lang: string) => {
    const qTitle = question?.title || 'Problem';
    const qDifficulty = question?.difficulty || 'Unknown';
    const qTopics = question?.topics;
    const topicsString = Array.isArray(qTopics) ? qTopics.join(', ') : (qTopics || 'Unknown');

    const templates: { [key: string]: string } = {
      javascript: `/**
 * Solution for: ${qTitle}
 * Difficulty: ${qDifficulty}
 * Topics: ${topicsString}
 */

function solution() {
    // Your implementation here
    
    return null;
}

// Test cases
console.log(solution());`,
      python: `"""
Solution for: ${qTitle}
Difficulty: ${qDifficulty}
Topics: ${topicsString}
"""

def solution():
    """
    Your implementation here
    """
    pass

# Test cases
if __name__ == "__main__":
    print(solution())`,
      java: `/**
 * Solution for: ${qTitle}
 * Difficulty: ${qDifficulty}
 * Topics: ${topicsString}
 */

public class Solution {
    public void solution() {
        // Your implementation here
        
    }
    
    public static void main(String[] args) {
        Solution sol = new Solution();
        // Test cases
    }
}`,
      cpp: `/**
 * Solution for: ${qTitle}
 * Difficulty: ${qDifficulty}
 * Topics: ${topicsString}
 */

#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    void solution() {
        // Your implementation here
        
    }
};

int main() {
    Solution sol;
    // Test cases
    return 0;
}`,
      typescript: `/**
 * Solution for: ${qTitle}
 * Difficulty: ${qDifficulty}
 * Topics: ${topicsString}
 */

function solution(): any {
    // Your implementation here
    
    return null;
}

// Test cases
console.log(solution());`
    }
    return templates[lang] || templates.javascript;
  }, [question]);

  const editorOptions = useMemo(() => ({
    fontSize: 14,
    fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Consolas, monospace',
    fontLigatures: true,
    lineHeight: 1.6,
    minimap: { enabled: !isMobile },
    lineNumbers: 'on' as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    cursorStyle: 'line' as const,
    automaticLayout: true,
    wordWrap: 'bounded' as const,
    wordWrapColumn: 120,
    padding: { top: 20, bottom: 20 },
    smoothScrolling: true,
    cursorBlinking: 'smooth' as const,
    renderLineHighlight: 'all' as const,
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true
    },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on' as const,
    tabCompletion: 'on' as const
  }), [isMobile]);

  const copyCodeToChat = useCallback(() => {
    try {
      const currentCode =  code ||editorRef.current?.getValue?.() 
      // console.log(currentCode);
      
      if (currentCode.trim()) {
        setUserInput(`Here's my code:\n\`\`\`${language}\n${currentCode}\n\`\`\`\n\nCan you help me review this?`)
      }
    } catch (error) {
      console.error('Error copying code:', error)
      // Fallback to current state
      if (code.trim()) {
        setUserInput(`Here's my code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nCan you help me review this?`)
      }
    }
  }, [code, language]);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    try {
      editorRef.current = editor
      setIsEditorReady(true)
      setEditorMounted(true)
      setMonacoError(null)

      // Configure editor options
      editor.updateOptions({
        fontSize: 14,
        fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Consolas, monospace',
        fontLigatures: true,
        lineHeight: 1.6,
        minimap: { enabled: window.innerWidth > 1280 },
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        cursorStyle: 'line',
        automaticLayout: true,
        wordWrap: 'bounded',
        wordWrapColumn: 120,
        theme: editorTheme,
        padding: { top: 20, bottom: 20 },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        renderLineHighlight: 'all',
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: true,
          indentation: true
        },
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        tabCompletion: 'on'
      })

      // Add keyboard shortcuts
      if (monaco.KeyMod && monaco.KeyCode) {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
          copyCodeToChat()
        })

        // Format code on save
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          try {
            const action = editor.getAction('editor.action.formatDocument')
            if (action) {
              action.run()
            }
          } catch (error) {
            console.warn('Format document action failed:', error)
          }
        })
      }
    } catch (error) {
      console.error('Error initializing editor:', error)
      setMonacoError('Failed to initialize editor')
      setIsEditorReady(false)
    }
  }, [editorTheme, copyCodeToChat]);

  // Clean up resize observer
  const cleanupResizeObserver = useCallback(() => {
    if (resizeObserverRef.current) {
      try {
        resizeObserverRef.current.disconnect()
      } catch (error) {
        console.warn('Error disconnecting ResizeObserver:', error)
      } finally {
        resizeObserverRef.current = null
      }
    }
  }, [])

  // Setup resize observer for editor
  useEffect(() => {
    if (!isEditorReady || !editorRef.current || !editorContainerRef.current) return

    cleanupResizeObserver()

    try {
      resizeObserverRef.current = new ResizeObserver(() => {
        try {
          if (editorRef.current && typeof editorRef.current.layout === 'function') {
            // Add a small delay to ensure container has updated
            setTimeout(() => {
              if (editorRef.current && typeof editorRef.current.layout === 'function') {
                editorRef.current.layout()
              }
            }, 10)
          }
        } catch (error) {
          console.warn('Editor layout error:', error)
          // setIsEditorReady(false) // No need to set false here, layout error shouldn't break the whole editor
        }
      })

      resizeObserverRef.current.observe(editorContainerRef.current)
    } catch (error) {
      console.error('ResizeObserver setup error:', error)
    }

    return cleanupResizeObserver
  }, [isEditorReady, layout, isEditorMinimized, cleanupResizeObserver])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  // Corrected handleLanguageChange to ensure clean editor re-initialization
  const handleLanguageChange = (newLanguage: string) => {
    // Crucial: Clear editor references and states to force a full remount
    // via the 'key' prop on MonacoEditor, preventing 'getFullModelRange' error
    editorRef.current = null;
    setIsEditorReady(false);
    setEditorMounted(false);
    setMonacoError(null); // Clear any previous error message

    setLanguage(newLanguage);
    setCode(getCodeTemplate(newLanguage));
  }

  useEffect(() => {
    const questionId = params.id as string
    const foundQuestion = getQuestionPById(questionId)

    if (foundQuestion) {
      setQuestion(foundQuestion)
      // Ensure code template is set for the initial language
      setCode(getCodeTemplate(language))

      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `🎯 **Welcome to your AI Coding Session!**

I'm here to guide you through **"${foundQuestion.title}"** - a **${foundQuestion.difficulty}** level challenge.

**🔍 Problem Focus Areas:**
${Array.isArray(foundQuestion.topics) ? foundQuestion.topics.map((topic: string) => `• ${topic.trim()}`).join('\n') : foundQuestion.topics ? `• ${foundQuestion.topics.trim()}` : 'No specific topics.'}

**💡 How I can help you:**
• 🧠 **Problem Analysis** - Break down the requirements
• 🎯 **Algorithm Design** - Explore optimal approaches  
• 🔍 **Code Review** - Debug and optimize your solution
• ⚡ **Complexity Analysis** - Time & space complexity insights
• 🚀 **Best Practices** - Clean, maintainable code patterns

**✨ Quick Start Tips:**
1. Use the code editor to write your solution
2. Press **Ctrl/Cmd + Enter** to share code instantly
3. Ask specific questions for targeted help
4. Request hints when you're stuck

Ready to start coding? What would you like to explore first? 🚀`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    } else {
      router.replace('/challenges')
    }

    // Cleanup function
    return () => {
      cleanupResizeObserver()
      if (editorRef.current) {
        try {
          if (typeof editorRef.current.dispose === 'function') {
            editorRef.current.dispose()
          }
        } catch (error) {
          console.warn('Error disposing editor:', error)
        } finally {
          editorRef.current = null
          setIsEditorReady(false)
          setEditorMounted(false)
        }
      }
    }
  }, [params.id, getQuestionPById, language, router, getCodeTemplate, cleanupResizeObserver])

  const sendMessage = async () => {
    if (!userInput.trim() || !question) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: userInput,
      timestamp: new Date(),
      hasCode: userInput.includes('```')
    }

    setMessages(prev => [...prev, userMessage])
    setUserInput('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const context = `You are an expert AI tutor helping with the coding problem "${question.title}". 
      This is a ${question.difficulty} difficulty problem with topics: ${Array.isArray(question.topics) ? question.topics.join(', ') : question.topics || 'Unknown'}.
      Problem URL: ${question.link}
      
      Please provide helpful, educational responses that guide the student rather than giving away the complete solution immediately. 
      Focus on explaining concepts, suggesting approaches, and helping them think through the problem.
      
      When reviewing code:
      - Point out bugs, inefficiencies, or edge cases
      - Suggest improvements and optimizations
      - Explain time and space complexity
      - Provide alternative approaches
      - Give constructive feedback
      
      Use markdown formatting for better readability:
      - Use **bold** for important concepts
      - Use \`code\` for inline code
      - Use \`\`\`language\n([\s\S]*?)\n?\`\`\` for code blocks
      - Use numbered lists for step-by-step approaches
      - Use bullet points for key insights
      - Use > for important tips or warnings
      
      Keep responses engaging and encouraging. Use emojis sparingly but effectively.
      
      Previous conversation (last 5 turns for context, excluding current user message):
      ${messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}
      
      Student's current message: ${userMessage.content}`

      const result = await chatSession.sendMessage(context)
      const responseText = result.response.text()

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

      let i = 0
      const typingInterval = setInterval(() => {
        setMessages(prev => {
          const lastMessage = { ...prev[prev.length - 1] }
          if (i < responseText.length) {
            lastMessage.content += responseText.charAt(i)
            i++
            return [...prev.slice(0, prev.length - 1), lastMessage]
          } else {
            clearInterval(typingInterval)
            setIsTyping(false)
            setIsLoading(false)
            return prev
          }
        })
      }, 20)

    } catch (error) {
      console.error('Error generating response:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '⚠️ I encountered an error while processing your request. Please try again in a moment.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsTyping(false)
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-gradient-to-r from-emerald-500 to-green-600';
      case 'medium':
        return 'bg-gradient-to-r from-amber-500 to-orange-600';
      case 'hard':
        return 'bg-gradient-to-r from-rose-500 to-red-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const formatMessageContent = (content: string) => {
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-white">$1</strong>')
      .replace(/\`\`\`(\w+)?\n([\s\S]*?)\n?\`\`\`/g, '<div class="my-4 relative"><div class="bg-slate-900 rounded-t-lg px-4 py-2 text-xs text-slate-400 border-b border-slate-700 font-mono">$1</div><pre class="bg-slate-950 rounded-b-lg p-4 overflow-x-auto"><code class="text-sm text-slate-300 font-mono">$2</code></pre></div>')
      .replace(/\`(.*?)\`/g, '<code class="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-md text-sm font-mono border">$1</code>')
      .replace(/^• (.*$)/gim, '<div class="flex items-start gap-3 mb-2"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5 flex-shrink-0"></span><span class="text-slate-700 dark:text-slate-300">$1</span></div>')
      .replace(/^(\d+)\. (.*$)/gim, '<div class="flex items-start gap-3 mb-3"><span class="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold flex-shrink-0">$1</span><span class="text-slate-700 dark:text-slate-300 pt-0.5">$2</span></div>')
      .replace(/^> (.*$)/gim, '<div class="border-l-4 border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 pl-4 pr-4 py-3 my-3 rounded-r-lg"><div class="flex items-start gap-2"><span class="text-amber-600 dark:text-amber-400 text-lg">💡</span><span class="text-amber-800 dark:text-amber-200 font-medium">$1</span></div></div>')

    return formatted
  }

  const quickActions = [
    { icon: "💡", text: "Get Hint", action: "Can you give me a strategic hint to get started?", color: "from-amber-400 to-orange-500" },
    { icon: "🎯", text: "Best Approach", action: "What's the most optimal approach for this problem?", color: "from-blue-400 to-indigo-500" },
    { icon: "⚡", text: "Complexity", action: "What should be the time and space complexity?", color: "from-purple-400 to-pink-500" },
    { icon: "🔍", text: "Edge Cases", action: "What important edge cases should I consider?", color: "from-green-400 to-emerald-500" },
    { icon: "🚀", text: "Optimize", action: "How can I optimize my current solution?", color: "from-cyan-400 to-blue-500" },
    { icon: "🐛", text: "Debug", action: "Can you help me debug and fix my code?", color: "from-red-400 to-rose-500" },
    { icon: "📝", text: "Review", action: "Please review my code and provide feedback", color: "from-indigo-400 to-purple-500" }
  ]

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript', icon: '🟨', color: 'from-yellow-400 to-yellow-600' },
    { value: 'python', label: 'Python', icon: '🐍', color: 'from-blue-400 to-green-500' },
    { value: 'java', label: 'Java', icon: '☕', color: 'from-orange-500 to-red-600' },
    { value: 'cpp', label: 'C++', icon: '⚡', color: 'from-blue-600 to-purple-600' },
    { value: 'typescript', label: 'TypeScript', icon: '🔷', color: 'from-blue-500 to-indigo-600' }
  ]

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-2 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin animation-delay-75 mx-auto"></div>
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Loading Your Challenge</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">Preparing your personalized AI coding environment...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse animation-delay-150"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-400/5 to-cyan-600/5 rounded-full blur-3xl animate-pulse animation-delay-300"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(rgba(71,85,105,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,0.03)_1px,transparent_1px)] pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Enhanced Header */}
        <header className="border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="group inline-flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                  aria-label="Back to problems"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 group-hover:from-blue-50 group-hover:to-indigo-50 dark:group-hover:from-blue-900/30 dark:group-hover:to-indigo-900/30 flex items-center justify-center transition-all duration-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </div>
                  <span className="font-medium hidden sm:inline">Back to Problems</span>
                </button>

                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-full border border-emerald-200 dark:border-emerald-700">
                  <div className="relative">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                  </div>
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">AI Tutor Online</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative hidden sm:block">
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2 pl-3 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-pointer"
                    aria-label="Select coding language"
                  >
                    {languageOptions.map((langOpt) => (
                      <option key={langOpt.value} value={langOpt.value}>
                        {langOpt.icon} {langOpt.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-slate-300">
                    <svg className="fill-current h-4 w-4" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.05 6.879 4.636 8.293z"/></svg>
                  </div>
                </div>

                <div className="hidden xl:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                  <button
                    onClick={() => setLayout('horizontal')}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      layout === 'horizontal'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                    title="Horizontal Layout"
                    aria-pressed={layout === 'horizontal'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setLayout('vertical')}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      layout === 'vertical'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                    title="Vertical Layout"
                    aria-pressed={layout === 'vertical'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-controls="mobile-sidebar"
                  aria-expanded={isSidebarOpen}
                  aria-label="Toggle mobile menu"
                >
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <a
                  href={question?.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  aria-label="View full problem details on external site"
                >
                  <span className="hidden sm:inline">View Problem</span>
                  <span className="sm:hidden">View</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Problem Header */}
          <div className="mb-6 lg:mb-8">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-900/5">
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-4 leading-tight">
                      {question.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                      <span className={`px-4 py-2 rounded-full font-bold shadow-lg text-white ${getDifficultyStyle(question.difficulty)}`}>
                        {question.difficulty}
                      </span>

                      {question.topics && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-700">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="font-medium text-blue-700 dark:text-blue-300 truncate">
                            {Array.isArray(question.topics) ? question.topics.join(', ') : question.topics}
                          </span>
                        </div>
                      )}

                      {question.companies && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-2 rounded-full border border-purple-200 dark:border-purple-700">
                          <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 2 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="font-medium text-purple-700 dark:text-purple-300 whitespace-nowrap">
                            {question.companies} companies
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowProblemDetails(!showProblemDetails)}
                    className="flex-shrink-0 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    aria-label={showProblemDetails ? "Hide problem details" : "Show problem details"}
                  >
                    <svg className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform duration-200 ${showProblemDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Problem Details Section */}
                {showProblemDetails && (
                  <div className="space-y-6 border-t border-slate-200 dark:border-slate-700 pt-6">
                    {/* Problem Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Description</h3>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{question.description}</p>
                    </div>

                    {/* Illustration */}
                    {question.illustration && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Illustration</h3>
                        <img
                          src={question.illustration}
                          alt="Problem illustration"
                          className="max-w-full h-auto rounded-lg border border-slate-300 dark:border-slate-600 shadow-md"
                        />
                      </div>
                    )}

                    {/* Steps */}
                    {question.steps && question.steps.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Steps</h3>
                        <ol className="space-y-2">
                          {question.steps.map((step, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold flex-shrink-0">
                                {index + 1}
                              </span>
                              <span className="text-slate-700 dark:text-slate-300">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Note */}
                    {question.note && (
                      <div className="border-l-4 border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 pl-4 pr-4 py-3 rounded-r-lg">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600 dark:text-amber-400 text-lg">📝</span>
                          <div>
                            <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Note</h4>
                            <p className="text-amber-700 dark:text-amber-300">{question.note}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Examples */}
                    {question.examples && question.examples.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Examples</h3>
                        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                          {question.examples.map((example, index) => (
                            <ExampleDisplay key={index} example={example} index={index} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    {question.constraints && question.constraints.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Constraints</h3>
                        <ul className="space-y-1">
                          {question.constraints.map((constraint, index) => (
                            <li key={index} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 mt-2 flex-shrink-0"></span>
                              <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-sm font-mono">
                                {constraint}
                              </code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Sidebar */}
          {isSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
              />
              <div
                className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl w-80 max-w-[85vw] shadow-2xl border-r border-slate-200 dark:border-slate-700 transform transition-transform ease-out duration-300"
                id="mobile-sidebar"
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Close menu"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 space-y-3">
                  {quickActions.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setUserInput(item.action);
                        setIsSidebarOpen(false);
                        sendMessage();
                      }}
                      className="w-full text-left p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 group hover:shadow-md"
                      disabled={isLoading}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${item.color} flex items-center justify-center text-white font-semibold shadow-lg`}>
                          {item.icon}
                        </div>
                        <div className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                          {item.text}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        <div className={clsx(
            "flex-1 grid gap-6",
            layout === 'horizontal' ? 'xl:grid-cols-2' : 'grid-cols-1', // horizontal for large screens, vertical for small
            isEditorMinimized ? 'grid-rows-[minmax(1fr,1fr)_min-content]' : 'grid-rows-1' // adjust row sizing for minimize
          )}>
            {/* Chat Window */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-900/5 flex flex-col max-h-[calc(100vh-250px)] md:max-h-[calc(100vh-200px)] xl:max-h-[calc(100vh-170px)]"> {/* Adjusted max-heights */}
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b pb-3 border-slate-200 dark:border-slate-700">AI Chat</h2>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4"> {/* Added custom-scrollbar class */}
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={clsx('flex items-start mb-6', {
                      'justify-end': msg.role === 'user',
                      'justify-start': msg.role === 'assistant',
                    })}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold mr-3 shadow-md">
                        AI
                      </div>
                    )}
                    <div
                      className={clsx('p-4 rounded-xl max-w-[80%] md:max-w-[70%] lg:max-w-[60%] text-sm sm:text-base shadow-md', {
                        'bg-blue-600 text-white rounded-br-none': msg.role === 'user',
                        'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700': msg.role === 'assistant',
                      })}
                    >
                      <div dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }} />
                      <div className="mt-2 text-xs opacity-70 text-right">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold ml-3 shadow-md">
                        You
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-start mb-6">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold mr-3 shadow-md">
                      AI
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-4 rounded-xl rounded-bl-none shadow-md">
                      <div className="flex space-x-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Area */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="relative">
                   <Textarea
      ref={textareaRef}
      value={userInput}
      onChange={(e) => setUserInput(e.target.value)}
      onKeyDown={handleKeyPress}
      onFocus={() => setIsInputFocused(true)}
      onBlur={() => setIsInputFocused(false)}
      placeholder={isLoading ? 'AI is thinking...' : 'Ask your AI tutor anything...'}
      rows={1} // Start with 1 row, height will be adjusted by JS
      className={clsx(
        "w-full p-4 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border transition-all duration-200 resize-none overflow-hidden text-sm sm:text-base", // Added overflow-hidden
        isInputFocused ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-700/50 shadow-md' : 'border-slate-200 dark:border-slate-700',
        { 'cursor-not-allowed opacity-70': isLoading }
      )}
      disabled={isLoading}
      aria-label="Chat input"
      // Optional: Add a max-height if you want it to stop growing at some point and then show a scrollbar
      // style={{ maxHeight: '200px' }}
    />
                  <button
                    onClick={sendMessage}
                    className={clsx(
                      "absolute right-3 bottom-3 p-2 rounded-full bg-blue-600 text-white shadow-lg transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900",
                      { 'opacity-50 cursor-not-allowed': isLoading || !userInput.trim() }
                    )}
                    disabled={isLoading || !userInput.trim()}
                    title="Send Message"
                    aria-label="Send message"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>

                {/* Quick Action Buttons */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
                  {quickActions.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setUserInput(item.action);
                        sendMessage();
                      }}
                      className="inline-flex items-center justify-center p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                      disabled={isLoading}
                      aria-label={`Quick action: ${item.text}`}
                    >
                      <span className="text-lg mr-2">{item.icon}</span>
                      <span className="truncate">{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Code Editor */}
            <div
              ref={editorContainerRef}
              className={clsx(
                "relative flex flex-col bg-slate-900 rounded-2xl lg:rounded-3xl border border-slate-800 shadow-xl shadow-slate-900/5 transition-all duration-300",
                {
                  'xl:flex-1': layout === 'horizontal',
                  'flex-1 min-h-[400px]': layout === 'vertical' || isMobile, // Consistent min-height
                  'min-h-[100px] max-h-[150px]': isEditorMinimized, // Fixed height when minimized
                }
              )}
            >
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-800 rounded-t-xl lg:rounded-t-2xl">
                <h3 className="text-lg font-bold text-white">Code Editor</h3>
                <div className="flex items-center gap-2">
                  <div className="relative sm:hidden"> {/* Only visible on small screens */}
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="appearance-none bg-slate-700 border border-slate-600 text-white py-1.5 pl-2 pr-7 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-pointer"
                      aria-label="Select coding language"
                    >
                      {languageOptions.map((langOpt) => (
                        <option key={langOpt.value} value={langOpt.value}>
                          {langOpt.icon} {langOpt.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-white">
                      <svg className="fill-current h-3 w-3" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.05 6.879 4.636 8.293z"/></svg>
                    </div>
                  </div>

                  <button
                    onClick={copyCodeToChat}
                    className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    title="Copy Code to Chat (Ctrl/Cmd + Enter)"
                    aria-label="Copy current code to chat input"
                    disabled={!isEditorReady}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h6a2 2 0 002-2v-6a2 2 0 00-2-2h-6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsEditorMinimized(!isEditorMinimized)}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    title={isEditorMinimized ? "Maximize Editor" : "Minimize Editor"}
                    aria-label={isEditorMinimized ? "Maximize editor" : "Minimize editor"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEditorMinimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Monaco Editor Component */}
              <div className="flex-1 overflow-hidden relative rounded-b-xl lg:rounded-b-2xl">
                {monacoError ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900 rounded-b-xl lg:rounded-b-2xl">
                    <div className="text-center space-y-4">
                      <div className="text-red-400">
                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-red-300">Editor Error</p>
                        <p className="text-xs text-slate-400">{monacoError}</p>
                        <button
                          onClick={() => {
                            setMonacoError(null);
                            handleLanguageChange(language); // Re-trigger editor mount
                          }}
                          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Retry Loading Editor
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  isClient ? ( // CONDITIONAL RENDERING: Render MonacoEditor only on client
                    <MonacoEditor
                      key={language} // <--- THIS IS THE KEY CHANGE for re-initialization
                      height="100%"
                      width="100%"
                      language={language}
                      theme={editorTheme} // 'custom-dark' is defined in onMount
                      value={code}
                      onChange={(newValue) => setCode(newValue || '')}
                      onMount={handleEditorDidMount}
                      options={editorOptions}
                    />
                  ) : (
                    // Fallback loading state for SSR or initial client render
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 rounded-b-xl lg:rounded-b-2xl">
                      <div className="text-center space-y-4">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-l-purple-600 rounded-full animate-spin animation-delay-150 mx-auto"></div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-300">Preparing editor...</p>
                          <div className="flex justify-center space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-75"></div>
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce animation-delay-150"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px; /* Slightly wider for better usability */
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.4); /* Darker thumb */
          border-radius: 4px; /* More rounded */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.6); /* Even darker on hover */
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.4);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.6);
        }
        
        /* Smooth transition for max-height on problem details toggle */
        .max-h-0 {
          max-height: 0 !important;
        }
        .max-h-\\[2000px\\] {
          max-height: 2000px !important; /* A sufficiently large value */
        }

        /* Animation delays */
        .animation-delay-75 {
          animation-delay: 75ms;
        }
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  )
}