'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuestionStore } from '@/utils/stores/useQuestionStore'
import dynamic from 'next/dynamic'

import { chatSession } from '@/utils/GeminiAIModel' 
import useMobile from '@/hooks/useMobile'
import { useTheme } from 'next-themes'

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[300px] flex items-center justify-center bg-[#1e1e1e]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-2 border-zinc-700 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-transparent border-t-amber-400 rounded-full animate-spin"></div>
        </div>
        <p className="text-sm text-zinc-500 font-medium">Loading Editor</p>
      </div>
    </div>
  )
})

type PQuestion = {
  title: string
  link: string
  difficulty: string
  description?: string
  steps?: string[]
  illustration?: string
  note?: string
  key_points?: string[]
  examples?: Array<{
    image?: string
    input: string
    output: string
    explanation?: string
  }>
  constraints?: string[]
  topics?: string[] | string
  companies?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  hasCode?: boolean
}

export default function PremiumAITutorPage() {
  const params = useParams()
  const { theme } = useTheme()
  const router = useRouter()
  const { getQuestionPById } = useQuestionStore()
  const mobile = useMobile()
  
  const [question, setQuestion] = useState<PQuestion | null>(null)
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [showProblemDetails, setShowProblemDetails] = useState(false)
  
  // Monaco Editor states
  const [code, setCode] = useState('// Write your solution here...\n\n')
  const [language, setLanguage] = useState('javascript')
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal')
  const [editorTheme, setEditorTheme] = useState('vs-dark')
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [showEditor, setShowEditor] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

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

  const handleEditorDidMount = (editor: any, monaco: any) => {
    try {
      editorRef.current = editor
      setIsEditorReady(true)
      
      const isMobile = window.innerWidth < 768
      
      editor.updateOptions({
        fontSize: isMobile ? 13 : 14,
        fontFamily: '"Geist Mono", "SF Mono", "JetBrains Mono", Menlo, Monaco, monospace',
        fontLigatures: true,
        lineHeight: 1.7,
        minimap: { enabled: window.innerWidth > 1280 },
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        cursorStyle: 'line',
        automaticLayout: true,
        wordWrap: 'on',
        wordWrapColumn: 120,
        theme: editorTheme,
        padding: { top: isMobile ? 16 : 20, bottom: isMobile ? 16 : 20 },
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
        tabCompletion: 'on',
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          verticalScrollbarSize: isMobile ? 8 : 10,
          horizontalScrollbarSize: isMobile ? 8 : 10
        }
      })

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        copyCodeToChat()
      })

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, (e: any) => {
        e?.preventDefault()
        editor.getAction('editor.action.formatDocument')?.run()
      })

      const handleResize = () => {
        editor.layout()
      }
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    } catch (error) {
      console.error('Error initializing Monaco Editor:', error)
      setIsEditorReady(false)
    }
  }

  useEffect(() => {
    if (editorRef.current && isEditorReady) {
      const timer = setTimeout(() => {
        editorRef.current?.layout()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [layout, isEditorReady, showEditor])

  const copyCodeToChat = () => {
    const currentCode = editorRef.current?.getValue() || code
    if (currentCode.trim()) {
      setUserInput(`Here's my code:\n\`\`\`${language}\n${currentCode}\n\`\`\`\n\nCan you help me review this?`)
    }
  }

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'typescript', label: 'TypeScript' }
  ]

  const getCodeTemplate = (lang: string) => {
    const topicsStr = Array.isArray(question?.topics) ? question.topics.join(', ') : (question?.topics || 'Unknown')
    const templates: { [key: string]: string } = {
      javascript: `/**
 * Solution for: ${question?.title || 'Problem'}
 * Difficulty: ${question?.difficulty || 'Unknown'}
 * Topics: ${topicsStr}
 */

function solution() {
    // Your implementation here
    
    return null;
}

// Test cases
console.log(solution());`,
      python: `"""
Solution for: ${question?.title || 'Problem'}
Difficulty: ${question?.difficulty || 'Unknown'}
Topics: ${topicsStr}
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
 * Solution for: ${question?.title || 'Problem'}
 * Difficulty: ${question?.difficulty || 'Unknown'}
 * Topics: ${topicsStr}
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
 * Solution for: ${question?.title || 'Problem'}
 * Difficulty: ${question?.difficulty || 'Unknown'}
 * Topics: ${topicsStr}
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
 * Solution for: ${question?.title || 'Problem'}
 * Difficulty: ${question?.difficulty || 'Unknown'}
 * Topics: ${topicsStr}
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
 * Solution for: ${question?.title || 'Problem'}
 * Difficulty: ${question?.difficulty || 'Unknown'}
 * Topics: ${topicsStr}
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
 * Solution for: ${question?.title || 'Problem'}
 * Difficulty: ${question?.difficulty || 'Unknown'}
 * Topics: ${topicsStr}
 */

fn solution() {
    // Your implementation here
    
}

fn main() {
    // Test cases
    solution();
}`,
      typescript: `/**
 * Solution for: ${question?.title || 'Problem'}
 * Difficulty: ${question?.difficulty || 'Unknown'}
 * Topics: ${topicsStr}
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
    let foundQuestion = getQuestionPById(questionId) || null
    
    if (foundQuestion) {
      setQuestion(foundQuestion)
      setCode(getCodeTemplate(language))
      
      const topicsStr = Array.isArray(foundQuestion.topics) 
        ? foundQuestion.topics.map((topic :any)=> `• ${topic.trim()}`).join('\n')
        : foundQuestion.topics 
          ? `• ${foundQuestion.topics.trim()}`
          : '• No specific topics'
      
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `Welcome to your Premium AI coding session.

I'm here to guide you through **"${foundQuestion.title}"** - a **${foundQuestion.difficulty}** level challenge.

**Focus Areas:**
${topicsStr}

**How I can assist:**
• Problem analysis and requirements breakdown
• Algorithm design and optimization strategies
• Code review with constructive feedback
• Time and space complexity analysis
• Best practices and clean code patterns

Ready to begin? Share your approach or ask for guidance.`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [params.id, getQuestionPById, language])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

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
      const topicsStr = Array.isArray(question.topics) ? question.topics.join(', ') : (question.topics || 'Unknown')
      const context = `You are an expert AI tutor helping with the coding problem "${question.title}". 
      This is a ${question.difficulty} difficulty problem with topics: ${topicsStr}.
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
      - Use \`\`\`language\n code \n\`\`\` for code blocks
      - Use numbered lists for step-by-step approaches
      - Use bullet points for key insights
      - Use > for important tips or warnings
      
      Keep responses engaging and encouraging.
      
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
        content: 'I encountered an error while processing your request. Please try again in a moment.',
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
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-zinc-900 dark:text-zinc-100">$1</strong>')
      .replace(/\`\`\`(\w+)?\n([\s\S]*?)\n?\`\`\`/g, '<div class="my-4 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"><div class="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400 font-mono border-b border-zinc-200 dark:border-zinc-800">$1</div><pre class="bg-white dark:bg-zinc-950 p-4 overflow-x-auto"><code class="text-sm text-zinc-800 dark:text-zinc-300 font-mono">$2</code></pre></div>')
      .replace(/\`(.*?)\`/g, '<code class="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 rounded text-sm font-mono">$1</code>')
      .replace(/^• (.*$)/gim, '<div class="flex items-start gap-2 mb-1.5"><span class="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-2 flex-shrink-0"></span><span class="text-zinc-700 dark:text-zinc-300">$1</span></div>')
      .replace(/^(\d+)\. (.*$)/gim, '<div class="flex items-start gap-2.5 mb-2"><span class="flex items-center justify-center min-w-[20px] h-5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium">$1</span><span class="text-zinc-700 dark:text-zinc-300 pt-0.5">$2</span></div>')
      .replace(/^> (.*$)/gim, '<div class="border-l-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 pl-4 py-2 my-3 text-zinc-700 dark:text-zinc-300">$1</div>')
    
    return formatted
  }

  const quickActions = [
    { text: "Strategic Hint", action: "Can you give me a strategic hint to get started?" },
    { text: "Optimal Approach", action: "What's the most optimal approach for this problem?" },
    { text: "Complexity Analysis", action: "What should be the time and space complexity?" },
    { text: "Edge Cases", action: "What important edge cases should I consider?" },
    { text: "Optimize Solution", action: "How can I optimize my current solution?" },
    { text: "Debug Code", action: "Can you help me debug and fix my code?" },
    { text: "Review Code", action: "Please review my code and provide feedback" }
  ]

  if (!question) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-2 border-zinc-200 dark:border-zinc-800 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-amber-600 dark:border-t-amber-400 rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Loading Premium Challenge</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Preparing your environment</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="hidden sm:inline">Back</span>
                </button>

                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-full">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Premium AI Active</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {mobile && (
                  <>
                    <button
                      onClick={() => setShowProblemDetails(!showProblemDetails)}
                      className="p-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
                      title={showProblemDetails ? "Hide Problem" : "Show Problem"}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowEditor(!showEditor)}
                      className="p-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
                      title={showEditor ? "Show Chat" : "Show Editor"}
                    >
                      {showEditor ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      )}
                    </button>
                  </>
                )}

                {!mobile && (
                  <>
                    <button
                      onClick={() => setShowProblemDetails(!showProblemDetails)}
                      className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        showProblemDetails
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{showProblemDetails ? 'Hide' : 'Show'} Problem</span>
                    </button>
                    
                    <div className="hidden xl:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-0.5">
                      <button
                        onClick={() => setLayout('horizontal')}
                        className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                          layout === 'horizontal' 
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setLayout('vertical')}
                        className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                          layout === 'vertical' 
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}

                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <a
                  href={question.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <span className="hidden sm:inline">View Problem</span>
                  <span className="sm:hidden">View</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col max-w-[1800px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Problem Header */}
          <div className="mb-6 lg:mb-8">
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
              {/* Collapsed Header - Always Visible */}
              <div className="p-6 lg:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 leading-tight">
                      {question.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        question.difficulty?.toLowerCase() === 'easy' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900' :
                        question.difficulty?.toLowerCase() === 'medium' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900' :
                        'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                      }`}>
                        {question.difficulty}
                      </span>
                      
                      {question.topics && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full">
                          <svg className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                            {Array.isArray(question.topics) ? question.topics.join(', ') : question.topics}
                          </span>
                        </div>
                      )}

                      {question.companies && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full">
                          <svg className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            {question.companies}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowProblemDetails(!showProblemDetails)}
                    className="flex-shrink-0 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors group"
                    aria-label={showProblemDetails ? "Hide problem details" : "Show problem details"}
                  >
                    <svg 
                      className={`w-5 h-5 text-zinc-600 dark:text-zinc-400 transition-transform duration-200 ${showProblemDetails ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded Details - Conditionally Visible */}
              {showProblemDetails && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
                  <div className="p-6 lg:p-8 space-y-8 animate-fadeIn">
                    
                    {/* Description */}
                    {question.description && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Description</h3>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed pl-3">
                          {question.description}
                        </p>
                      </div>
                    )}

                    {/* Illustration */}
                    {question.illustration && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Illustration</h3>
                        </div>
                        <div className="pl-3">
                          <img
                            src={question.illustration}
                            alt="Problem illustration"
                            className="max-w-full h-auto rounded-lg border border-zinc-300 dark:border-zinc-700 shadow-md"
                          />
                        </div>
                      </div>
                    )}

                    {/* Steps */}
                    {question.steps && question.steps.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full" />
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Steps</h3>
                        </div>
                        <ol className="space-y-3 pl-3">
                          {question.steps.map((step, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Key Points */}
                    {question.key_points && question.key_points.length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <h4 className="font-semibold text-amber-900 dark:text-amber-200">Key Points</h4>
                        </div>
                        <ul className="space-y-2">
                          {question.key_points.map((point, index) => (
                            <li key={index} className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                              <span className="leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Note */}
                    {question.note && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-r-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-200">Note</h4>
                        </div>
                        <p className="text-blue-800 dark:text-blue-300 leading-relaxed">{question.note}</p>
                      </div>
                    )}

                    {/* Examples */}
                    {question.examples && question.examples.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Examples</h3>
                        </div>
                        <div className="space-y-4 pl-3">
                          {question.examples.map((example, index) => (
                            <div key={index} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                              <h4 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs font-bold">
                                  {index + 1}
                                </span>
                                Example {index + 1}
                              </h4>
                              
                              {example.image && (
                                <div className="mb-4">
                                  <img
                                    src={example.image}
                                    alt={`Example ${index + 1}`}
                                    className="max-w-full h-auto rounded-lg border border-zinc-300 dark:border-zinc-700 shadow-md"
                                  />
                                </div>
                              )}
                              
                              <div className="space-y-3">
                                <div className="bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                  <div className="px-4 py-2 bg-zinc-200 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-800">
                                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Input:</span>
                                  </div>
                                  <div className="p-4">
                                    <code className="text-sm text-zinc-800 dark:text-zinc-200 font-mono">{example.input}</code>
                                  </div>
                                </div>

                                <div className="bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                  <div className="px-4 py-2 bg-zinc-200 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-800">
                                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Output:</span>
                                  </div>
                                  <div className="p-4">
                                    <code className="text-sm text-zinc-800 dark:text-zinc-200 font-mono">{example.output}</code>
                                  </div>
                                </div>

                                {example.explanation && (
                                  <div className="pt-2">
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">Explanation: </span>
                                      {example.explanation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    {question.constraints && question.constraints.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-5 bg-gradient-to-b from-rose-500 to-red-500 rounded-full" />
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Constraints</h3>
                        </div>
                        <ul className="space-y-2 pl-3">
                          {question.constraints.map((constraint, index) => (
                            <li key={index} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                              <svg className="w-4 h-4 text-rose-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <code className="text-sm bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded font-mono leading-relaxed">
                                {constraint}
                              </code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Sidebar */}
          {isSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
              <div className="relative bg-white dark:bg-zinc-950 w-80 max-w-[85vw] border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-950">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Quick Actions</h3>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 space-y-2 cursor-pointer ">
                  {quickActions.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setUserInput(item.action)
                        setIsSidebarOpen(false)
                      }}
                      className="w-full cursor-pointer text-left px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-lg transition-colors"
                    >
                      {item.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className={`flex-1 flex ${layout === 'vertical' && !mobile ? 'flex-col' : 'flex-col xl:flex-row'} gap-6 lg:gap-8 min-h-0`}>
              
              {/* Sidebar - Desktop */}
              <div className={`hidden ${mobile ? 'hidden' : 'lg:block'} ${layout === 'vertical' ? '' : 'lg:w-80 xl:w-96'}`}>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 bg-white dark:bg-zinc-950 sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Quick Actions</h3>
                      <div className={`${layout === 'vertical' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}`}>
                        {quickActions.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => setUserInput(item.action)}
                            className="w-full text-left px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-lg transition-colors"
                          >
                            {item.text}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Code Editor</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Language</label>
                          <select
                            value={language}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 dark:focus:ring-amber-400 transition-all"
                          >
                            {languageOptions.map((lang) => (
                              <option key={lang.value} value={lang.value}>
                                {lang.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Theme</label>
                          <select
                            value={editorTheme}
                            onChange={(e) => setEditorTheme(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 dark:focus:ring-amber-400 transition-all"
                          >
                            <option value="vs-dark">Dark</option>
                            <option value="light">Light</option>
                            <option value="hc-black">High Contrast</option>
                          </select>
                        </div>

                        <div className="space-y-2 pt-2">
                          <button
                            onClick={copyCodeToChat}
                            disabled={!isEditorReady}
                            className="w-full px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Send Code to AI
                          </button>
                          
                          <button
                            onClick={() => setCode(getCodeTemplate(language))}
                            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm font-medium border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            Reset Template
                          </button>
                        </div>

                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded text-xs font-mono">Ctrl+Enter</kbd> to send code instantly
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content - Chat and Editor */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className={`flex-1 flex ${layout === 'vertical' && !mobile ? 'flex-col' : 'flex-col'} gap-6 min-h-0`}>
                  
                  {/* Chat Interface */}
                  <div className={`${mobile && showEditor ? 'hidden' : 'flex'} ${layout === 'vertical' && !mobile ? 'xl:h-1/2' : 'flex-1'} flex-col min-h-0`}>
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[500px] bg-white dark:bg-zinc-950">
                      
                      {/* Chat Header */}
                      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                              <svg
                                className={`w-4 h-4 ${theme=="dark"?" text-amber-500 ":" text-white "}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                />
                              </svg>
                            </div>

                            <div>
                              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Premium AI Mentor</h3>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400">Coding assistant</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-100 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-full">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Online</span>
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                        {messages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {message.role === 'assistant' && (
                              <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                                <svg
                                  className={`w-4 h-4 ${theme=="dark"?" text-amber-500 ":" text-white "}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                  />
                                </svg>
                              </div>
                            )}
                            
                            <div className={`max-w-[75%] ${message.role === 'user' ? 'order-1' : ''}`}>
                              <div
                                className={`p-4 rounded-lg ${
                                  message.role === 'user'
                                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800'
                                }`}
                              >
                                <div 
                                  className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                                  dangerouslySetInnerHTML={{
                                    __html: message.role === 'assistant' 
                                      ? formatMessageContent(message.content)
                                      : message.content.replace(/\n/g, '<br>')
                                  }}
                                />
                                <div className={`text-xs mt-2 ${
                                  message.role === 'user' ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-500'
                                }`}>
                                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>

                            {message.role === 'user' && (
                              <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-zinc-700 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {(isLoading || isTyping) && (
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce animation-delay-75"></div>
                                  <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce animation-delay-150"></div>
                                </div>
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Thinking</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} /> 
                      </div>

                      {/* Input */}
                      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-end gap-3">
                          <textarea
                            ref={textareaRef}
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            rows={1}
                            className="flex-1 resize-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-600 dark:focus:ring-amber-400 transition-all"
                            placeholder="Ask anything..."
                            disabled={isLoading}
                            style={{ minHeight: '44px', maxHeight: '120px' }}
                          />
                          <button
                            onClick={sendMessage}
                            disabled={isLoading || !userInput.trim()}
                            className="p-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                          >
                            {isLoading ? (
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
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

                  {/* Code Editor */}
                  <div className={`${mobile && !showEditor ? 'hidden' : 'flex'} ${layout === 'vertical' && !mobile ? 'xl:h-1/2' : 'flex-1'} flex-col min-h-0`}>
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[500px] bg-white dark:bg-zinc-950">
                      
                      {/* Editor Header */}
                      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                              <svg
                                className={`w-4 h-4 ${theme=="dark"?" text-amber-500 ":" text-white "}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                />
                              </svg>
                            </div>

                            <div>
                              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Code Editor</h3>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                {languageOptions.find(l => l.value === language)?.label}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="lg:hidden flex items-center gap-2">
                              <select
                                value={language}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className="text-xs px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                              >
                                {languageOptions.map((lang) => (
                                  <option key={lang.value} value={lang.value}>
                                    {lang.label}
                                  </option>
                                ))}
                              </select>

                              <button
                                onClick={copyCodeToChat}
                                disabled={!isEditorReady}
                                className="p-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg disabled:opacity-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setCode(getCodeTemplate(language))}
                                className="p-1.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            </div>

                            <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full">
                              <div className={`w-1.5 h-1.5 rounded-full ${isEditorReady ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                {isEditorReady ? 'Ready' : 'Loading'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Monaco Editor */}
                      <div ref={editorContainerRef} className="flex-1 relative min-h-[300px]">
                        <MonacoEditor
                          height="100%"
                          language={language}
                          value={code}
                          onChange={(value) => setCode(value || '')}
                          onMount={handleEditorDidMount}
                          theme={editorTheme}
                        />
                      </div>

                      {/* Editor Footer */}
                      <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                        <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                          <div className="flex items-center gap-3">
                            <span>{isEditorReady ? 'Ready' : 'Loading'}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">
                              <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded font-mono">Ctrl+Enter</kbd> to send
                            </span>
                          </div>
                          <span className="hidden md:inline">Auto-save enabled</span>
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

      <style jsx>{`
        .animation-delay-75 {
          animation-delay: 75ms;
        }
        .animation-delay-150 {
          animation-delay: 150ms;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(161, 161, 170, 0.3);
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(161, 161, 170, 0.5);
        }

        .monaco-editor,
        .monaco-editor-background,
        .monaco-editor .overflow-guard {
          background: transparent !important;
        }

        @media (max-width: 768px) {
          .monaco-editor {
            font-size: 13px !important;
          }
        }

        .monaco-editor {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  )
}