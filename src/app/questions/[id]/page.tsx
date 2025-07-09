'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuestionStore } from '@/utils/stores/useQuestionStore'

import { chatSession } from '@/utils/GeminiAIModel' 

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
}

export default function AITutorPage() {
  const params = useParams()
  const router = useRouter()
  const { getQuestionById, currentQuestion } = useQuestionStore()
  
  const [question, setQuestion] = useState<Question | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

 
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }


  useEffect(() => {
    const questionId = params.id as string
    
    
    let foundQuestion = currentQuestion
    if (!foundQuestion) {
      foundQuestion = getQuestionById(questionId) || null
    }
    
    if (foundQuestion) {
      setQuestion(foundQuestion)
      // Initialize chat with welcome message
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `👋 Hello! I'm your AI coding mentor, ready to guide you through "${foundQuestion.Question}". 

This is a **${foundQuestion.Difficulty}** level challenge focusing on: **${foundQuestion.Topics}**.

I'm here to help you:
• 🧠 Understand the problem deeply
• 💡 Explore different approaches
• 🔍 Break down complex algorithms
• 🚀 Optimize your solution

What would you like to explore first?`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [params.id, currentQuestion, getQuestionById])

  // Effect to scroll to bottom when messages update or typing status changes
  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const sendMessage = async () => {
    if (!userInput.trim() || !question) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: userInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setUserInput('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const context = `You are an expert AI tutor helping with the LeetCode problem "${question.Question}". 
      This is a ${question.Difficulty} difficulty problem with topics: ${question.Topics}.
      Problem URL: ${question["Link of Question"]}
      
      Please provide helpful, educational responses that guide the student rather than giving away the complete solution immediately. 
      Focus on explaining concepts, suggesting approaches, and helping them think through the problem.
      
      Use markdown formatting for better readability:
      - Use **bold** for important concepts
      - Use \`code\` for inline code
      - Use numbered lists for step-by-step approaches
      - Use bullet points for key insights
      - Use > for important tips or warnings
      
      Keep responses engaging and encouraging. Use emojis sparingly but effectively.
      
      Previous conversation:
      ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
      
      Student's question: ${userInput}`
        console.log(context);
        
      const result = await chatSession.sendMessage(context)
      const response = result.response
      const text = response.text()

      // Simulate typing delay for better UX
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
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
      .replace(/\`(.*?)\`/g, '<code class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-red-600 dark:text-red-400 rounded text-sm font-mono">$1</code>')
      .replace(/^• (.*$)/gim, '<div class="flex items-start gap-2 mb-1"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span><span>$1</span></div>')
      .replace(/^(\d+\.) (.*$)/gim, '<div class="flex items-start gap-3 mb-2"><span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold flex-shrink-0">$1</span><span>$2</span></div>')
      .replace(/^> (.*$)/gim, '<div class="border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/20 pl-4 py-2 my-2 rounded-r-lg"><span class="text-amber-800 dark:text-amber-200">💡 $1</span></div>')
    
    return formatted
  }

  const quickActions = [
    { icon: "💡", text: "Hint please", action: "Can you give me a hint to get started?" },
    { icon: "🎯", text: "Approach", action: "What's the best approach for this problem?" },
    { icon: "⚡", text: "Time complexity", action: "What should be the time complexity?" },
    { icon: "🔍", text: "Edge cases", action: "What edge cases should I consider?" },
    { icon: "🚀", text: "Optimization", action: "How can I optimize my solution?" }
  ]

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200 dark:border-blue-800 mx-auto"></div>
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-blue-600 dark:border-blue-400 mx-auto absolute inset-0"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-4 sm:mt-6 text-base sm:text-lg font-medium px-4">Loading your coding challenge...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Animated Background Elements - Responsive */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-96 sm:h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Grid Pattern - Responsive */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:16px_16px] sm:bg-[size:32px_32px] dark:bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] pointer-events-none" />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Enhanced Header - Fully Responsive */}
        <header className="border-b border-white/20 dark:border-gray-800/50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              {/* Back Button - Mobile Optimized */}
              <button
                onClick={() => router.back()}
                className="group inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-105"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 flex items-center justify-center mr-2 sm:mr-3 transition-colors">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </div>
                <span className="font-medium text-sm sm:text-base hidden xs:inline">Back to Problems</span>
                <span className="font-medium text-sm xs:hidden">Back</span>
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* AI Status - Hidden on very small screens */}
                <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>AI Tutor Active</span>
                </div>
                
                {/* Mobile Sidebar Toggle */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

           
                <a
                  href={question["Link of Question"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 sm:px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <span className="hidden sm:inline">View Problem</span>
                  <span className="sm:hidden">View</span>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Problem Header Card - Responsive */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20 dark:border-gray-800/50 shadow-2xl shadow-blue-500/10">
              <div className="flex flex-col gap-4 sm:gap-6">
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-3 sm:mb-4 leading-tight">
                    {question.Question}
                  </h1>
                  
                  {/* Tags - Responsive Grid */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
                    <span className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg ${
                      question.Difficulty === 'EASY' ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' :
                      question.Difficulty === 'MEDIUM' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' :
                      'bg-gradient-to-r from-rose-400 to-red-500 text-white'
                    }`}>
                      {question.Difficulty}
                    </span>
                    
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 truncate">
                        {question.Topics}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 whitespace-nowrap">
                        {question["Frequency (Number of Companies)"]} companies
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

     
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 min-h-0">
            
           
            {isSidebarOpen && (
              <div className="lg:hidden fixed inset-0 z-50 flex">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl w-80 max-w-[80vw] shadow-2xl border-r border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4 space-y-2">
                    {quickActions.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setUserInput(item.action)
                          setIsSidebarOpen(false)
                        }}
                        className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                            {item.text}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Sidebar */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-800/50 shadow-xl sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </h3>
                
                <div className="space-y-2">
                  {quickActions.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setUserInput(item.action)}
                      className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                          {item.text}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Chat Interface - Responsive */}
            <div className="flex-1 lg:col-span-3 flex flex-col min-h-0">
              <div className="flex-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/20 dark:border-gray-800/50 shadow-2xl overflow-hidden flex flex-col">
                
                {/* Chat Messages - Responsive Height */}
                <div className="flex-1 dark:bg-gray-900/90 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 min-h-0" style={{ height: 'calc(100vh - 20rem)' }}>
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-2 sm:gap-3 lg:gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      <div className={`max-w-[85%] sm:max-w-4xl ${message.role === 'user' ? 'order-1' : ''}`}>
                        <div
                          className={`p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white ml-auto'
                              : 'bg-gradient-to-r  dark:from-gray-800 dark:to-gray-750 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div 
                            className={`leading-relaxed text-sm sm:text-base ${message.role === 'assistant' ? 'prose prose-sm dark:prose-invert max-w-none' : ''}`}
                            dangerouslySetInnerHTML={{
                              __html: message.role === 'assistant' 
                                ? formatMessageContent(message.content)
                                : message.content
                            }}
                          />
                          <div className={`text-xs mt-2 sm:mt-3 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      {message.role === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center shadow-lg">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Loading/Typing Indicator */}
                  {(isLoading || isTyping) && (
                    <div className="flex gap-2 sm:gap-3 lg:gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      </div>
                      <div className="   dark:from-gray-800 dark:to-gray-750 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">AI is typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} /> 
                </div>

             
                <div className={`p-3 sm:p-4 lg:p-6 border-t border-gray-200 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 ${isInputFocused ? 'ring-2 ring-blue-500/50' : ''} transition-all duration-200 rounded-b-2xl sm:rounded-b-3xl`}>
                  <div className="flex items-center gap-3">
                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      rows={1}
                      className="flex-1 resize-none bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 px-4 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base pr-12"
                      placeholder="Ask your AI tutor anything..."
                      disabled={isLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !userInput.trim()}
                      className="p-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
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
        </main>
      </div>
    </div>
  )
}