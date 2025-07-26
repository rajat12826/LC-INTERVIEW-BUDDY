'use client'

import { useEffect, useState, useRef, FC, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuestionStore } from '@/utils/stores/useQuestionStore' // Assuming this correctly imports PQuestion
import dynamic from 'next/dynamic'
import clsx from 'clsx' // For conditional styling
import { chatSession } from '@/utils/GeminiAIModel'
import useMobile from '@/hooks/useMobile'

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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
})

// Using 'any' as per the last instruction to handle varied data structures
// This will resolve type errors, but removes type safety.
// In a real application, you'd refine this type significantly.
type PQuestionAdapted = any

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  hasCode?: boolean
}

interface ExampleProps {
  example: any; // Assuming example content can vary widely
  index: number;
}

const ExampleDisplay: FC<ExampleProps> = ({ example, index }) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-sm">
      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Example {index + 1}:</h4>
      {example.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={example.image} alt={`Example ${index + 1}`} className="w-full max-w-md mx-auto my-3 rounded-lg border border-slate-300 dark:border-slate-600 shadow-md" />
      )}
      <p className="mb-1">
        <strong className="text-slate-700 dark:text-slate-300">Input:</strong>{' '}
        <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-800 dark:text-slate-200">
          {typeof example.input === 'string' ? example.input : JSON.stringify(example.input)}
        </code>
      </p>
      <p>
        <strong className="text-slate-700 dark:text-slate-300">Output:</strong>{' '}
        <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-800 dark:text-slate-200">
          {typeof example.output === 'string' ? example.output : JSON.stringify(example.output)}
        </code>
      </p>
      {example.explanation && (
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          <strong className="text-slate-700 dark:text-slate-300">Explanation:</strong> {example.explanation}
        </p>
      )}
    </div>
  );
};


export default function AITutorPage() {
  const params = useParams()
  const router = useRouter()
  const { getQuestionPById } = useQuestionStore() // getQuestionById directly from store

  const isMobile = useMobile()
  const [question, setQuestion] = useState<PQuestionAdapted | null>(null) // Use the adapted type
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)

  // Monaco Editor states
  const [code, setCode] = useState('// Write your solution here...\n\n')
  const [language, setLanguage] = useState('javascript')
  const [isEditorMinimized, setIsEditorMinimized] = useState(false)
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal')
  const [editorTheme, setEditorTheme] = useState('vs-dark')
  const [isEditorReady, setIsEditorReady] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [userInput])

  // Handle editor mount
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    setIsEditorReady(true)

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
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      copyCodeToChat()
    })

    // Format code on save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.getAction('editor.action.formatDocument').run()
    })
  }

  // Copy code to chat input
  const copyCodeToChat = () => {
    const currentCode = editorRef.current?.getValue() || code
    if (currentCode.trim()) {
      setUserInput(`Here's my code:\n\`\`\`${language}\n${currentCode}\n\`\`\`\n\nCan you help me review this?`)
    }
  }

  // Language configurations
  const languageOptions = [
    { value: 'javascript', label: 'JavaScript', icon: '🟨', color: 'from-yellow-400 to-yellow-600' },
    { value: 'python', label: 'Python', icon: '🐍', color: 'from-blue-400 to-green-500' },
    { value: 'java', label: 'Java', icon: '☕', color: 'from-orange-500 to-red-600' },
    { value: 'cpp', label: 'C++', icon: '⚡', color: 'from-blue-600 to-purple-600' },
    { value: 'csharp', label: 'C#', icon: '🔷', color: 'from-purple-500 to-blue-600' },
    { value: 'go', label: 'Go', icon: '🔵', color: 'from-cyan-400 to-blue-600' },
    { value: 'rust', label: 'Rust', icon: '🦀', color: 'from-orange-600 to-red-700' },
    { value: 'typescript', label: 'TypeScript', icon: '🔷', color: 'from-blue-500 to-indigo-600' }
  ]

  // Get initial code template based on language
  const getCodeTemplate = useMemo(() => (lang: string) => {
    const qTitle = question?.title || 'Problem'
    const qDifficulty = question?.difficulty || 'Unknown'
    const qTopics = question?.topics || 'Unknown' // Using 'topics' assuming it's an array or string
    const topicsString = Array.isArray(qTopics) ? qTopics.join(', ') : qTopics;

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
      csharp: `/**
 * Solution for: ${qTitle}
 * Difficulty: ${qDifficulty}
 * Topics: ${topicsString}
 */

using System;
using System.Collections.Generic;

public class Solution {
    public void SolutionMethod() {
        // Your implementation here
        
    }
    
    static void Main() {
        Solution sol = new Solution();
        // Test cases
    }
}`,
      go: `/**
 * Solution for: ${qTitle}
 * Difficulty: ${qDifficulty}
 * Topics: ${topicsString}
 */

package main

import "fmt"

func solution() {
    // Your implementation here
    
}

func main() {
    // Test cases
    solution()
}`,
      rust: `/**
 * Solution for: ${qTitle}
 * Difficulty: ${qDifficulty}
 * Topics: ${topicsString}
 */

fn solution() {
    // Your implementation here
    
}

fn main() {
    // Test cases
    solution();
}`,
      typescript: `/**
 * Solution for: ${qTitle}
 * Difficulty: ${qDifficulty}
 * Topics: ${topicsString}
 */

function solution(): void {
    // Your implementation here
    
}

// Test cases
solution();`
    }
    return templates[lang] || templates.javascript
  }, [question]) // Re-memoize if question changes


  useEffect(() => {
    const questionId = params.id as string
    const foundQuestion = getQuestionPById(questionId)

    if (foundQuestion) {
      setQuestion(foundQuestion)
      // Set initial code with the question details
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
      // If question not found, redirect or show error
      router.replace('/challenges') // Redirects to the challenges page
    }
  }, [params.id, getQuestionPById, language, router, getCodeTemplate])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    setCode(getCodeTemplate(newLanguage))
  }

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
      // Use optional chaining for question properties
      const context = `You are an expert AI tutor helping with the coding problem "${question.title || 'Unknown Problem'}". 
      This is a ${question.difficulty || 'Unknown'} difficulty problem with topics: ${Array.isArray(question.topics) ? question.topics.join(', ') : question.topics || 'Unknown'}.
      Problem URL: ${question.link || 'N/A'}
      
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
      - Use \`\`\`language\n code \n\`\`\` for code blocks
      - Use numbered lists for step-by-step approaches
      - Use bullet points for key insights
      - Use > for important tips or warnings
      
      Keep responses engaging and encouraging. Use emojis sparingly but effectively.
      
      Previous conversation:
      ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
      
      Student's message: ${userInput}`

      const result = await chatSession.sendMessage(context)
      const response = result.response
      const text = response.text()

      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: text,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, assistantMessage])
        setIsTyping(false)
      }, 1000)
    } catch (error) {
      console.error('Error generating response:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '⚠️ I encountered an error while processing your request. Please try again in a moment.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsTyping(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Helper to determine difficulty style
  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) { // Use optional chaining just in case difficulty is somehow undefined
      case 'easy':
        return 'bg-gradient-to-r from-emerald-500 to-green-600';
      case 'medium':
        return 'bg-gradient-to-r from-amber-500 to-orange-600';
      case 'hard':
        return 'bg-gradient-to-r from-rose-500 to-red-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600'; // Default for unknown difficulty
    }
  };

  const formatMessageContent = (content: string) => {
    // Regex for bold, code blocks, inline code, bullet points, numbered lists, and quotes
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-white">$1</strong>')
      .replace(/\`\`\`(\w+)?\n([\s\S]*?)\n?\`\`\`/g, '<div class="my-4 relative"><div class="bg-slate-900 rounded-t-lg px-4 py-2 text-xs text-slate-400 border-b border-slate-700 font-mono">$1</div><pre class="bg-slate-950 rounded-b-lg p-4 overflow-x-auto"><code class="text-sm text-slate-300 font-mono">$2</code></pre></div>')
      .replace(/\`(.*?)\`/g, '<code class="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-md text-sm font-mono border">$1</code>')
      // Note: These regex for lists and quotes are simplified and assume they start at the beginning of a line.
      // For more robust markdown parsing, a dedicated markdown parser library would be needed.
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

      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(rgba(71,85,105,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,0.03)_1px,transparent_1px)] pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Enhanced Header */}
        <header className="border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="group inline-flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 group-hover:from-blue-50 group-hover:to-indigo-50 dark:group-hover:from-blue-900/30 dark:group-hover:to-indigo-900/30 flex items-center justify-center transition-all duration-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </div>
                  <span className="font-medium hidden sm:inline">Back to Problems</span>
                </button>

                {/* AI Status Indicator */}
                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-full border border-emerald-200 dark:border-emerald-700">
                  <div className="relative">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                  </div>
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">AI Tutor Online</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {/* Layout Controls - Desktop */}
                <div className="hidden xl:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                  <button
                    onClick={() => setLayout('horizontal')}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      layout === 'horizontal'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                    title="Horizontal Layout"
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
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Mobile Menu */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* View Problem Button */}
                <a
                  href={question.link || '#'} // Use question.link
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
          {/* Enhanced Problem Header */}
          <div className="mb-6 lg:mb-8">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-900/5">
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-4 leading-tight">
                    {question.title} {/* Use question.title */}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                    <span className={`px-4 py-2 rounded-full font-bold shadow-lg text-white ${getDifficultyStyle(question.difficulty)}`}>
                      {question.difficulty}
                    </span>

                    {question.topics && ( // Use question.topics
                      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-700">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="font-medium text-blue-700 dark:text-blue-300 truncate">
                          {Array.isArray(question.topics) ? question.topics.join(', ') : question.topics}
                        </span>
                      </div>
                    )}

                    {question.companies && ( // Assuming 'companies' might be a different field for "Frequency (Number of Companies)"
                      <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-2 rounded-full border border-purple-200 dark:border-purple-700">
                        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="font-medium text-purple-700 dark:text-purple-300 whitespace-nowrap">
                          {question.companies} companies {/* Adjust based on your data */}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Mobile Sidebar */}
          {isSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
              <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl w-80 max-w-[85vw] shadow-2xl border-r border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                        setUserInput(item.action)
                        setIsSidebarOpen(false)
                      }}
                      className="w-full text-left p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 group hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${item.color} flex items-center justify-center text-white font-semibold shadow-lg`}>
                          {item.icon}
                        </div>
                        <div>
                          <span className="block font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                            {item.text}
                          </span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {item.action.substring(0, 40)}...
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Main Content */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className={`flex-1 flex ${layout === 'vertical' ? 'flex-col' : 'flex-col xl:flex-row'} gap-6 lg:gap-8 min-h-0`}>

              {/* Problem Description Panel */}
              <div className={`flex-1 ${isEditorMinimized ? 'w-full' : ''} ${isMobile ? '' : (layout === 'horizontal' ? 'xl:w-1/2' : 'h-1/2')} bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-xl flex flex-col transition-all duration-300`}>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  Problem Description
                </h2>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-4">
                  <p>{question.description}</p>
                  
                  {question.illustration && (
                    <div className="my-5 flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={question.illustration}
                        alt="Problem illustration"
                        className="max-w-full h-auto rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  )}

                  {question.steps && question.steps.length > 0 && (
                    <>
                      <h3 className="text-md font-semibold text-slate-900 dark:text-white mt-6 mb-3">Steps to Consider:</h3>
                      <ol className="list-decimal list-inside space-y-2">
                        {question.steps.map((step: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="font-medium mr-2 text-blue-600 dark:text-blue-400">{idx + 1}.</span>
                            <span className="text-slate-700 dark:text-slate-300">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </>
                  )}

                  {question.note && (
                    <div className="border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-r-lg my-4">
                      <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        <strong className="font-semibold">Note:</strong> {question.note}
                      </p>
                    </div>
                  )}

                  {question.key_points && question.key_points.length > 0 && (
                    <>
                      <h3 className="text-md font-semibold text-slate-900 dark:text-white mt-6 mb-3">Key Points:</h3>
                      <ul className="list-disc list-inside space-y-2">
                        {question.key_points.map((point: string, idx: number) => (
                          <li key={idx} className="text-slate-700 dark:text-slate-300">{point}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  {question.examples && question.examples.length > 0 && (
                    <>
                      <h3 className="text-md font-semibold text-slate-900 dark:text-white mt-6 mb-3">Examples:</h3>
                      <div className="space-y-4">
                        {question.examples.map((example: any, idx: number) => (
                          <ExampleDisplay key={idx} example={example} index={idx} />
                        ))}
                      </div>
                    </>
                  )}

                  {question.constraints && question.constraints.length > 0 && (
                    <>
                      <h3 className="text-md font-semibold text-slate-900 dark:text-white mt-6 mb-3">Constraints:</h3>
                      <ul className="list-disc list-inside space-y-2">
                        {question.constraints.map((constraint: string, idx: number) => (
                          <li key={idx} className="text-slate-700 dark:text-slate-300">{constraint}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>


              {/* Editor & Chat Panel */}
              <div className={`flex-1 ${isEditorMinimized ? 'w-full' : ''} ${isMobile ? '' : (layout === 'horizontal' ? 'xl:w-1/2' : 'h-1/2')} flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl overflow-hidden transition-all duration-300`}>
                <div className="flex flex-col flex-1">
                  {/* Editor */}
                  <div className={clsx(
                    'transition-all duration-300 ease-in-out',
                    isEditorMinimized ? 'h-12 flex-shrink-0' : 'flex-1'
                  )}>
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <select
                          value={language}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-0"
                        >
                          {languageOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.icon} {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={copyCodeToChat}
                          className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Send code to AI (Ctrl/Cmd + Enter)"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setIsEditorMinimized(!isEditorMinimized)}
                          className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title={isEditorMinimized ? 'Maximize Editor' : 'Minimize Editor'}
                        >
                          {isEditorMinimized ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    {!isEditorMinimized && (
                      <MonacoEditor
                        height="calc(100% - 3.5rem)" // Subtract header height
                        language={language}
                        theme={editorTheme}
                        value={code}
                        onChange={(newValue) => setCode(newValue || '')}
                        onMount={handleEditorDidMount}
                        options={{
                          minimap: { enabled: !isMobile }, // Disable minimap on mobile
                        }}
                      />
                    )}
                  </div>

                  {/* Chat */}
                  <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950 rounded-b-xl">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      {messages.map((msg, index) => (
                        <div key={index} className={clsx(
                          'flex',
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}>
                          <div className={clsx(
                            'max-w-[80%] p-4 rounded-2xl shadow-md flex flex-col gap-2',
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700'
                          )}>
                            <div dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }} />
                            <span className={clsx(
                              'text-xs opacity-70',
                              msg.role === 'user' ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                            )}>
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] p-4 rounded-2xl shadow-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-75"></div>
                              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce animation-delay-150"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Action Buttons for Chat */}
                    {messages.length === 1 && !isLoading && !isTyping && ( // Only show after initial message and not loading
                      <div className={clsx(
                        "absolute bottom-[100px] left-1/2 -translate-x-1/2 w-full max-w-[calc(100%-2rem)] md:max-w-xl p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 transition-opacity duration-300",
                        isInputFocused ? 'opacity-0 pointer-events-none' : 'opacity-100' // Hide when input is focused
                      )}>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Quick Questions:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {quickActions.slice(0, 6).map((item, index) => ( // Show first 6 quick actions
                            <button
                              key={index}
                              onClick={() => setUserInput(item.action)}
                              className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                            >
                              <span className="text-lg">{item.icon}</span>
                              {item.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}


                    {/* Chat Input */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky bottom-0">
                      <div className="relative">
                        <textarea
                          ref={textareaRef}
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyDown={handleKeyPress}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
                          rows={1}
                          placeholder={isLoading ? 'Thinking...' : 'Ask your AI tutor or share your code...'}
                          className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none custom-scrollbar"
                          disabled={isLoading}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={isLoading || !userInput.trim()}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 transition-colors"
                        >
                          {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-blue-300 rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Sidebar - Desktop */}
              <div className={`${isMobile ? 'hidden' : ''} ${layout === 'vertical' ? 'hidden' : 'lg:block lg:w-80 xl:w-96'}`}>
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-xl sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
                  <div className="space-y-6">
                    {/* Quick Actions */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        Quick Actions
                      </h3>

                      <div className={`${layout === 'vertical' ? 'flex ' : 'space-y-3'}`}>
                        {quickActions.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => setUserInput(item.action)}
                            className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 group hover:shadow-md"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${item.color} flex items-center justify-center text-white text-sm shadow-lg`}>
                                {item.icon}
                              </div>
                              <div>
                                <span className="block font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                  {item.text}
                                </span>
                                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {item.action.substring(0, 40)}...
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}