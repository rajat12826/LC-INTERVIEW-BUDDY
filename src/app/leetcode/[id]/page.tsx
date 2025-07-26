'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuestionStore } from '@/utils/stores/useQuestionStore'
import dynamic from 'next/dynamic'

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

type Question = {
  Difficulty: string
  Question: string
  "Frequency (Number of Companies)": number
  "Link of Question": string
  "Companies Asking This Question": string
  Topics: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  hasCode?: boolean
}

export default function AITutorPage() {
  const params = useParams()
  const router = useRouter()
  const { getQuestionById, currentQuestion } = useQuestionStore()
   const mobile = useMobile();
  const [question, setQuestion] = useState<Question | null>(null)
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
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
  const getCodeTemplate = (lang: string) => {
    const templates: { [key: string]: string } = {
      javascript: `/**
 * Solution for: ${question?.Question || 'Problem'}
 * Difficulty: ${question?.Difficulty || 'Unknown'}
 * Topics: ${question?.Topics || 'Unknown'}
 */

function solution() {
    // Your implementation here
    
    return null;
}

// Test cases
console.log(solution());`,
      python: `"""
Solution for: ${question?.Question || 'Problem'}
Difficulty: ${question?.Difficulty || 'Unknown'}
Topics: ${question?.Topics || 'Unknown'}
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
 * Solution for: ${question?.Question || 'Problem'}
 * Difficulty: ${question?.Difficulty || 'Unknown'}
 * Topics: ${question?.Topics || 'Unknown'}
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
 * Solution for: ${question?.Question || 'Problem'}
 * Difficulty: ${question?.Difficulty || 'Unknown'}
 * Topics: ${question?.Topics || 'Unknown'}
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
 * Solution for: ${question?.Question || 'Problem'}
 * Difficulty: ${question?.Difficulty || 'Unknown'}
 * Topics: ${question?.Topics || 'Unknown'}
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
 * Solution for: ${question?.Question || 'Problem'}
 * Difficulty: ${question?.Difficulty || 'Unknown'}
 * Topics: ${question?.Topics || 'Unknown'}
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
 * Solution for: ${question?.Question || 'Problem'}
 * Difficulty: ${question?.Difficulty || 'Unknown'}
 * Topics: ${question?.Topics || 'Unknown'}
 */

fn solution() {
    // Your implementation here
    
}

fn main() {
    // Test cases
    solution();
}`,
      typescript: `/**
 * Solution for: ${question?.Question || 'Problem'}
 * Difficulty: ${question?.Difficulty || 'Unknown'}
 * Topics: ${question?.Topics || 'Unknown'}
 */

function solution(): void {
    // Your implementation here
    
}

// Test cases
solution();`
    }
    return templates[lang] || templates.javascript
  }

  useEffect(() => {
    const questionId = params.id as string
    let foundQuestion = getQuestionById(questionId) || null
    
    if (foundQuestion) {
      setQuestion(foundQuestion)
      setCode(getCodeTemplate(language))
      
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `🎯 **Welcome to your AI Coding Session!**

I'm here to guide you through **"${foundQuestion.Question}"** - a **${foundQuestion.Difficulty}** level challenge.

**🔍 Problem Focus Areas:**
${foundQuestion.Topics.split(',').map(topic => `• ${topic.trim()}`).join('\n')}

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
    }
  }, [params.id, currentQuestion, getQuestionById, language])

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
      const context = `You are an expert AI tutor helping with the coding problem "${question.Question}". 
      This is a ${question.Difficulty} difficulty problem with topics: ${question.Topics}.
      Problem URL: ${question["Link of Question"]}
      
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
                  href={question["Link of Question"]}
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

        <main className="flex-1 flex flex-col  mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Enhanced Problem Header */}
          <div className="mb-6 lg:mb-8">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-900/5">
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-4 leading-tight">
                    {question.Question}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                    <span className={`px-4 py-2 rounded-full font-bold shadow-lg text-white ${
                      question.Difficulty === 'EASY' ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
                      question.Difficulty === 'MEDIUM' ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                      'bg-gradient-to-r from-rose-500 to-red-600'
                    }`}>
                      {question.Difficulty}
                    </span>
                    
                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-700">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="font-medium text-blue-700 dark:text-blue-300 truncate">
                        {question.Topics}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-2 rounded-full border border-purple-200 dark:border-purple-700">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-medium text-purple-700 dark:text-purple-300 whitespace-nowrap">
                        {question["Frequency (Number of Companies)"]} companies
                      </span>
                    </div>
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
              
              {/* Enhanced Sidebar - Desktop */}
              <div className={`${mobile?" hidden ":""} ${layout=='vertical'?"":"  lg:block lg:w-80 xl:w-96"}`}>
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
                      
                      <div className={`${layout=='vertical'?"flex ":"space-y-3"}`}>
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
                              <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                {item.text}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Enhanced Code Editor Controls */}
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        </div>
                        Code Editor
                      </h4>
                      
                      <div className="space-y-4">
                        {/* Language Selector */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Programming Language</label>
                          <select
                            value={language}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            {languageOptions.map((lang) => (
                              <option key={lang.value} value={lang.value}>
                                {lang.icon} {lang.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Theme Selector */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Editor Theme</label>
                          <select
                            value={editorTheme}
                            onChange={(e) => setEditorTheme(e.target.value)}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="vs-dark">🌙 Dark Theme</option>
                            <option value="light">☀️ Light Theme</option>
                            <option value="hc-black">🔆 High Contrast</option>
                          </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                          <button
                            onClick={copyCodeToChat}
                            disabled={!isEditorReady}
                            className="w-full p-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:transform-none"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              Send Code to AI
                            </div>
                          </button>
                          
                          <button
                            onClick={() => setCode(getCodeTemplate(language))}
                            className="w-full p-3 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Reset Template
                            </div>
                          </button>
                        </div>

                        {/* Pro Tip */}
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="text-sm">
                              <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Pro Tip</p>
                              <p className="text-blue-600 dark:text-blue-400 leading-relaxed">
                                Press <kbd className="px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded text-xs font-mono">Ctrl+Enter</kbd> in the editor to instantly share your code with the AI tutor!
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Main Content - Chat and Code */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className={`flex-1 flex ${layout === 'vertical' ? 'flex-col' : 'flex-col xl:flex-row'} gap-6 min-h-0`}>
                  
                  {/* Enhanced Chat Interface */}
                  <div className={`${layout === 'vertical' ? 'xl:h-1/2' : 'flex-1'} flex flex-col min-h-0`}>
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl overflow-hidden flex flex-col h-full min-h-[500px]">
                      
                      {/* Enhanced Chat Header */}
                      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/60 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900 dark:text-white">AI Coding Mentor</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">Your personal coding assistant</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Active</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Chat Messages */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 bg-gradient-to-b from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
                        {messages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {message.role === 'assistant' && (
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                </div>
                              </div>
                            )}
                            
                            <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : ''}`}>
                              <div
                                className={`p-4 lg:p-6 rounded-2xl shadow-lg ${
                                  message.role === 'user'
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ml-auto'
                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <div 
                                  className={`leading-relaxed ${message.role === 'assistant' ? 'prose prose-sm dark:prose-invert max-w-none' : ''}`}
                                  dangerouslySetInnerHTML={{
                                    __html: message.role === 'assistant' 
                                      ? formatMessageContent(message.content)
                                      : message.content.replace(/\n/g, '<br>')
                                  }}
                                />
                                <div className={`text-xs mt-3 flex items-center justify-between ${
                                  message.role === 'user' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                  <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  {message.hasCode && (
                                    <span className="inline-flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                      </svg>
                                      Code
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {message.role === 'user' && (
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-slate-400 to-slate-600 flex items-center justify-center shadow-lg">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Enhanced Loading Indicator */}
                        {(isLoading || isTyping) && (
                          <div className="flex gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center space-x-3">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce animation-delay-75"></div>
                                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-150"></div>
                                </div>
                                <span className="text-slate-700 dark:text-slate-300 font-medium">AI is thinking...</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} /> 
                      </div>

                      {/* Enhanced Chat Input */}
                      <div className={`p-6 border-t border-slate-200 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 ${isInputFocused ? 'ring-2 ring-blue-500/50' : ''} transition-all duration-200`}>
                        <div className="flex items- gap-4 justify-center ">
                          <div className="flex-1">
                            <textarea
                              ref={textareaRef}
                              value={userInput}
                              onChange={(e) => setUserInput(e.target.value)}
                              onKeyPress={handleKeyPress}
                              onFocus={() => setIsInputFocused(true)}
                              onBlur={() => setIsInputFocused(false)}
                              rows={1}
                              className="w-full resize-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              placeholder="Ask AI tutor "
                              disabled={isLoading}
                              style={{ minHeight: '48px', maxHeight: '120px' }}
                            />
                          </div>
                          <button
                            onClick={sendMessage}
                            disabled={isLoading || !userInput.trim()}
                            className="p-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                          >
                            {isLoading ? (
                              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Code Editor */}
                  <div className={`${layout === 'vertical' ? 'xl:h-1/2' : 'flex-1'} flex flex-col min-h-0`}>
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl overflow-hidden flex flex-col h-full min-h-[500px]">
                      
                      {/* Enhanced Editor Header */}
                      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/60 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900 dark:text-white">Code Editor</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {languageOptions.find(l => l.value === language)?.icon} {languageOptions.find(l => l.value === language)?.label}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* Mobile Controls */}
                            <div className="lg:hidden flex items-center gap-2">
                              <select
                                value={language}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className="text-sm p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                {languageOptions.map((lang) => (
                                  <option key={lang.value} value={lang.value}>
                                    {lang.icon} {lang.label}
                                  </option>
                                ))}
                              </select>

                              <div className="flex gap-1">
                                <button
                                  onClick={copyCodeToChat}
                                  disabled={!isEditorReady}
                                  className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                                  title="Send to AI"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setCode(getCodeTemplate(language))}
                                  className="p-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg transition-all duration-200"
                                  title="Reset"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Editor Status */}
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                              <div className={`w-2 h-2 rounded-full ${isEditorReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                {isEditorReady ? 'Ready' : 'Loading'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Monaco Editor */}
                      <div className="flex-1 relative">
                        {!isEditorReady && (
                          <div className="absolute inset-0 z-10 bg-slate-900 flex items-center justify-center">
                            <div className="text-center space-y-4">
                              <div className="relative">
                                <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-l-purple-500 rounded-full animate-spin animation-delay-150 mx-auto"></div>
                              </div>
                              <p className="text-slate-400 font-medium">Initializing Editor...</p>
                            </div>
                          </div>
                        )}
                        <MonacoEditor
                          height="100%"
                          language={language}
                          value={code}
                          onChange={(value) => setCode(value || '')}
                          onMount={handleEditorDidMount}
                          theme={editorTheme}
                          options={{
                            fontSize: 14,
                            fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Consolas, monospace',
                            fontLigatures: true,
                            lineHeight: 1.6,
                            minimap: { 
                              enabled: window.innerWidth > 1280,
                              scale: 1,
                              showSlider: 'always'
                            },
                            scrollBeyondLastLine: false,
                            wordWrap: 'bounded',
                            wordWrapColumn: 120,
                            automaticLayout: true,
                            padding: { top: 20, bottom: 20 },
                            smoothScrolling: true,
                            cursorBlinking: 'smooth',
                            renderLineHighlight: 'all',
                            selectOnLineNumbers: true,
                            roundedSelection: false,
                            readOnly: false,
                            cursorStyle: 'line',
                            mouseWheelZoom: true,
                            contextmenu: true,
                            folding: true,
                            foldingHighlight: true,
                            showFoldingControls: 'always',
                            bracketPairColorization: { enabled: true },
                            guides: {
                              bracketPairs: true,
                              bracketPairsHorizontal: true,
                              highlightActiveBracketPair: true,
                              indentation: true
                            },
                            suggestOnTriggerCharacters: true,
                            acceptSuggestionOnEnter: 'on',
                            tabCompletion: 'on',
                            quickSuggestions: {
                              other: true,
                              comments: true,
                              strings: true
                            },
                            parameterHints: { enabled: true },
                            autoIndent: 'full',
                            formatOnPaste: true,
                            formatOnType: true
                          }}
                        />
                      </div>

                      {/* Enhanced Editor Footer */}
                      <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800/60 bg-gradient-to-r from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isEditorReady ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                              <span>{isEditorReady ? 'Editor Ready' : 'Loading...'}</span>
                            </div>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">
                              Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">Ctrl+Enter</kbd> to send
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <span className="hidden md:inline">Auto-save enabled</span>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        .animation-delay-75 {
          animation-delay: 75ms;
        }
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        
        /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
        
        /* Dark mode scrollbar */
        .dark .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.3);
        }
        
        .dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.5);
        }

        /* Ensure Monaco Editor visibility */
        .monaco-editor {
          background: transparent !important;
        }
        
        .monaco-editor .monaco-editor-background {
          background: transparent !important;
        }
      `}</style>
    </div>
  )
}