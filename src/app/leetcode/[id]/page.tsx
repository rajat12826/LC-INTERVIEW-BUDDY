'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuestionStore } from '@/utils/stores/useQuestionStore'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Bot, Check, ChevronDown, Paperclip } from 'lucide-react'

import { chatSession } from '@/utils/GeminiAIModel'
import useMobile from '@/hooks/useMobile'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea'
import { cn } from '@/lib/utils'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[300px] flex items-center justify-center bg-[#1e1e1e]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-2 border-zinc-700 rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-zinc-400 rounded-full animate-spin" />
        </div>
        <p className="text-sm text-zinc-500 font-medium">Loading Editor</p>
      </div>
    </div>
  )
})

// ─── Types ────────────────────────────────────────────────────────────────────

type Question = {
  Difficulty: string
  Question: string
  'Frequency (Number of Companies)': number
  'Link of Question': string
  'Companies Asking This Question': string
  Topics: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  hasCode?: boolean
}

type ActiveTab = 'chat' | 'editor'

// ─── AI Loading State (from AILoadingState component) ─────────────────────────

const TASK_SEQUENCES = [
  {
    status: 'Analyzing your question',
    lines: [
      'Reading your message...',
      'Understanding context...',
      'Checking problem details...',
      'Preparing response...',
      'Finalizing answer...',
    ],
  },
  {
    status: 'Reviewing your code',
    lines: [
      'Parsing code structure...',
      'Checking for bugs...',
      'Analyzing complexity...',
      'Reviewing edge cases...',
      'Generating feedback...',
      'Optimizing suggestions...',
      'Finalizing review...',
    ],
  },
  {
    status: 'Crafting explanation',
    lines: [
      'Building explanation...',
      'Structuring concepts...',
      'Adding examples...',
      'Checking clarity...',
      'Finalizing response...',
    ],
  },
]

const LoadingAnimation = ({ progress }: { progress: number }) => (
  <div className="relative w-6 h-6">
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-label={`Loading progress: ${Math.round(progress)}%`}
    >
      <defs>
        <mask id="progress-mask">
          <rect width="240" height="240" fill="black" />
          <circle
            r="120" cx="120" cy="120" fill="white"
            strokeDasharray={`${(progress / 100) * 754}, 754`}
            transform="rotate(-90 120 120)"
          />
        </mask>
      </defs>
      <style>{`
        @keyframes rotate-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes rotate-ccw { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        .g-spin circle { transform-origin: 120px 120px; }
        .g-spin circle:nth-child(1) { animation: rotate-cw 8s linear infinite; }
        .g-spin circle:nth-child(2) { animation: rotate-ccw 8s linear infinite; }
        .g-spin circle:nth-child(3) { animation: rotate-cw 8s linear infinite; }
        .g-spin circle:nth-child(4) { animation: rotate-ccw 8s linear infinite; }
        .g-spin circle:nth-child(5) { animation: rotate-cw 8s linear infinite; }
        .g-spin circle:nth-child(6) { animation: rotate-ccw 8s linear infinite; }
        .g-spin circle:nth-child(2n) { animation-delay: 0.2s; }
        .g-spin circle:nth-child(3n) { animation-delay: 0.3s; }
      `}</style>
      <g className="g-spin" strokeWidth="16" strokeDasharray="18% 40%" mask="url(#progress-mask)">
        <circle r="150" cx="120" cy="120" stroke="#FF2E7E" opacity="0.95" />
        <circle r="130" cx="120" cy="120" stroke="#00E5FF" opacity="0.95" />
        <circle r="110" cx="120" cy="120" stroke="#4ADE80" opacity="0.95" />
        <circle r="90"  cx="120" cy="120" stroke="#FFA726" opacity="0.95" />
        <circle r="70"  cx="120" cy="120" stroke="#FFEB3B" opacity="0.95" />
        <circle r="50"  cx="120" cy="120" stroke="#FF4081" opacity="0.95" />
      </g>
    </svg>
  </div>
)

function AILoadingState() {
  const [sequenceIndex, setSequenceIndex] = useState(0)
  const [visibleLines, setVisibleLines] = useState<Array<{ text: string; number: number }>>([])
  const [scrollPosition, setScrollPosition] = useState(0)
  const codeContainerRef = useRef<HTMLDivElement>(null)
  const lineHeight = 28

  const currentSequence = TASK_SEQUENCES[sequenceIndex]
  const totalLines = currentSequence.lines.length

  useEffect(() => {
    const initialLines = []
    for (let i = 0; i < Math.min(5, totalLines); i++) {
      initialLines.push({ text: currentSequence.lines[i], number: i + 1 })
    }
    setVisibleLines(initialLines)
    setScrollPosition(0)
  }, [sequenceIndex, currentSequence.lines, totalLines])

  useEffect(() => {
    const advanceTimer = setInterval(() => {
      const firstVisibleLineIndex = Math.floor(scrollPosition / lineHeight)
      const nextLineIndex = (firstVisibleLineIndex + 3) % totalLines

      if (nextLineIndex < firstVisibleLineIndex && nextLineIndex !== 0) {
        setSequenceIndex(prev => (prev + 1) % TASK_SEQUENCES.length)
        return
      }
      if (nextLineIndex >= visibleLines.length && nextLineIndex < totalLines) {
        setVisibleLines(prev => [...prev, {
          text: currentSequence.lines[nextLineIndex],
          number: nextLineIndex + 1,
        }])
      }
      setScrollPosition(prev => prev + lineHeight)
    }, 2000)
    return () => clearInterval(advanceTimer)
  }, [scrollPosition, visibleLines, totalLines, sequenceIndex, currentSequence.lines])

  useEffect(() => {
    if (codeContainerRef.current) {
      codeContainerRef.current.scrollTop = scrollPosition
    }
  }, [scrollPosition])

  return (
    <div className="flex gap-2 sm:gap-3">
      {/* Match the AIIcon size used in messages */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center flex-shrink-0">
        <LoadingAnimation progress={(sequenceIndex / TASK_SEQUENCES.length) * 100} />
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
        {/* Status line */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {currentSequence.status}...
          </span>
        </div>

        {/* Scrolling code lines */}
        <div className="relative">
          <div
            ref={codeContainerRef}
            className="font-mono text-xs overflow-hidden w-full h-[84px] rounded-lg"
            style={{ scrollBehavior: 'smooth' }}
          >
            {visibleLines.map(line => (
              <div
                key={`${line.number}-${line.text}`}
                className="flex h-[28px] items-center px-2"
              >
                <div className="text-zinc-400 dark:text-zinc-600 pr-3 select-none w-6 text-right">
                  {line.number}
                </div>
                <div className="text-zinc-700 dark:text-zinc-300 flex-1 ml-1">
                  {line.text}
                </div>
              </div>
            ))}
          </div>

          {/* Fade-out overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, transparent 40%, var(--fade-color, rgba(250,250,250,0.9)) 100%)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── AI Prompt Input (from AI_Prompt component) ───────────────────────────────

// Model icon SVGs (inlined to avoid needing separate icon components)
const OPENAI_SVG = (
  <svg className="block dark:hidden w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 256 260" xmlns="http://www.w3.org/2000/svg">
    <path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Z" />
  </svg>
)
const OPENAI_SVG_DARK = (
  <svg className="hidden dark:block w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 256 260" xmlns="http://www.w3.org/2000/svg">
    <path fill="#fff" d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Z" />
  </svg>
)
const OpenAIIcon = () => <>{OPENAI_SVG}{OPENAI_SVG_DARK}</>

const GeminiIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gemini-fill" x1="0%" x2="68.73%" y1="100%" y2="30.395%">
        <stop offset="0%" stopColor="#1C7DFF" />
        <stop offset="52.021%" stopColor="#1C69FF" />
        <stop offset="100%" stopColor="#F0DCD6" />
      </linearGradient>
    </defs>
    <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12" fill="url(#gemini-fill)" fillRule="nonzero" />
  </svg>
)

const ClaudeIcon = () => (
  <>
    <svg className="block dark:hidden w-3.5 h-3.5 flex-shrink-0" fill="#000" fillRule="evenodd" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
    </svg>
    <svg className="hidden dark:block w-3.5 h-3.5 flex-shrink-0" fill="#fff" fillRule="evenodd" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
    </svg>
  </>
)

const AI_MODELS = ['Claude 4.5 Sonnet', 'GPT-5', 'GPT-5-mini', 'Gemini 3']
const MODEL_ICONS: Record<string, React.ReactNode> = {
  'Claude 4.5 Sonnet': <ClaudeIcon />,
  'GPT-5':             <OpenAIIcon />,
  'GPT-5-mini':        <OpenAIIcon />,
  'Gemini 3':          <GeminiIcon />,
}

// The prompt input box — extracted to match AI_Prompt exactly
interface AIPromptInputProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  isLoading: boolean
  selectedModel: string
  onModelChange: (m: string) => void
}

function AIPromptInput({ value, onChange, onSend, isLoading, selectedModel, onModelChange }: AIPromptInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 72, maxHeight: 300 })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading) {
        onSend()
        adjustHeight(true) // reset height after send
      }
    }
  }

  return (
    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-1.5 pt-4">
      {/* Top banner */}
      <div className="mx-2 mb-2.5 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2">
          {/* Reuse ClaudeIcon as the banner icon */}
          <span className="text-black dark:text-white/90">
            <ClaudeIcon />
          </span>
          <h3 className="text-black dark:text-white/90 text-xs tracking-tighter">
            Ask anything about this problem
          </h3>
        </div>
        <p className="text-black dark:text-white/90 text-xs tracking-tighter hidden sm:block">
          Shift+Enter for newline
        </p>
      </div>

      <div className="relative flex flex-col">
        {/* Textarea */}
        <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={e => { onChange(e.target.value); adjustHeight() }}
            onKeyDown={handleKeyDown}
            placeholder="Ask for a hint, explain your approach, or paste your code..."
            disabled={isLoading}
            className={cn(
              'w-full resize-none rounded-xl rounded-b-none border-none',
              'bg-black/5 dark:bg-white/5 px-4 py-3',
              'placeholder:text-black/70 dark:placeholder:text-white/70',
              'dark:text-white text-black',
              'focus-visible:ring-0 focus-visible:ring-offset-0',
              'min-h-[72px] disabled:opacity-60'
            )}
          />
        </div>

        {/* Bottom toolbar — matches AI_Prompt exactly */}
        <div className="flex h-14 items-center rounded-b-xl bg-black/5 dark:bg-white/5">
          <div className="absolute right-3 bottom-3 left-3 flex w-[calc(100%-24px)] items-center justify-between">
            {/* Left: model selector + attach */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex h-8 items-center gap-1 rounded-md pr-2 pl-1 text-xs hover:bg-black/10 dark:hover:bg-white/10 dark:text-white focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedModel}
                        className="flex items-center gap-1"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                      >
                        {MODEL_ICONS[selectedModel]}
                        <span className="hidden sm:inline">{selectedModel}</span>
                        <ChevronDown className="h-3 w-3 opacity-50" />
                      </motion.div>
                    </AnimatePresence>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    'min-w-[10rem]',
                    'border-black/10 dark:border-white/10',
                    'bg-gradient-to-b from-white via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-800'
                  )}
                >
                  {AI_MODELS.map(model => (
                    <DropdownMenuItem
                      key={model}
                      className="flex items-center justify-between gap-2"
                      onSelect={() => onModelChange(model)}
                    >
                      <div className="flex items-center gap-2">
                        {MODEL_ICONS[model] ?? <Bot className="h-4 w-4 opacity-50" />}
                        <span>{model}</span>
                      </div>
                      {selectedModel === model && <Check className="h-4 w-4 text-blue-500" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="mx-0.5 h-4 w-px bg-black/10 dark:bg-white/10" />

              {/* <label
                aria-label="Attach file"
                className={cn(
                  'cursor-pointer rounded-lg bg-black/5 dark:bg-white/5 p-2',
                  'hover:bg-black/10 dark:hover:bg-white/10',
                  'text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white',
                  'focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0'
                )}
              >
                <input className="hidden" type="file" />
                <Paperclip className="h-4 w-4 transition-colors" />
              </label> */}
            </div>

            {/* Right: send button */}
            <button
              aria-label="Send message"
              type="button"
              onClick={onSend}
              disabled={!value.trim() || isLoading}
              className={cn(
                'rounded-lg bg-black/5 dark:bg-white/5 p-2',
                'hover:bg-black/10 dark:hover:bg-white/10',
                'focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0',
                'disabled:cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 dark:text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <ArrowRight className={cn(
                  'h-4 w-4 dark:text-white transition-opacity duration-200',
                  value.trim() ? 'opacity-100' : 'opacity-30'
                )} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AITutorPage() {
  const params = useParams()
  const { theme } = useTheme()
  const router = useRouter()
  const { getQuestionById, currentQuestion } = useQuestionStore()
  const mobile = useMobile()

  const [question, setQuestion] = useState<Question | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat')
  const [selectedModel, setSelectedModel] = useState('Claude 4.5 Sonnet')

  const [code, setCode] = useState('// Write your solution here...\n\n')
  const [language, setLanguage] = useState('javascript')
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal')
  const [editorTheme, setEditorTheme] = useState('vs-dark')
  const [isEditorReady, setIsEditorReady] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<any>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  const handleEditorDidMount = (editor: any, monaco: any) => {
    try {
      editorRef.current = editor
      setIsEditorReady(true)
      const isMobile = window.innerWidth < 768
      editor.updateOptions({
        fontSize: isMobile ? 12 : 14,
        fontFamily: '"Geist Mono", "SF Mono", "JetBrains Mono", Menlo, Monaco, monospace',
        fontLigatures: true,
        lineHeight: 1.7,
        minimap: { enabled: window.innerWidth > 1280 },
        lineNumbers: isMobile ? 'off' : 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        cursorStyle: 'line',
        automaticLayout: true,
        wordWrap: 'on',
        wordWrapColumn: 120,
        theme: editorTheme,
        padding: { top: isMobile ? 12 : 20, bottom: isMobile ? 12 : 20 },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        renderLineHighlight: 'all',
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: true },
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        tabCompletion: 'on',
        scrollbar: {
          vertical: 'visible', horizontal: 'visible',
          verticalScrollbarSize: isMobile ? 4 : 10,
          horizontalScrollbarSize: isMobile ? 4 : 10,
        }
      })
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => copyCodeToChat())
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, (e: any) => {
        e?.preventDefault()
        editor.getAction('editor.action.formatDocument')?.run()
      })
      const onResize = () => editor.layout()
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    } catch (err) {
      console.error('Monaco init error:', err)
      setIsEditorReady(false)
    }
  }

  useEffect(() => {
    if (editorRef.current && isEditorReady) {
      const t = setTimeout(() => editorRef.current?.layout(), 100)
      return () => clearTimeout(t)
    }
  }, [layout, isEditorReady, activeTab])

  const copyCodeToChat = () => {
    const currentCode = editorRef.current?.getValue() || code
    if (currentCode.trim()) {
      setUserInput(`Here's my code:\n\`\`\`${language}\n${currentCode}\n\`\`\`\n\nCan you help me review this?`)
      if (mobile) setActiveTab('chat')
    }
  }

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python',     label: 'Python'     },
    { value: 'java',       label: 'Java'       },
    { value: 'cpp',        label: 'C++'        },
    { value: 'csharp',     label: 'C#'         },
    { value: 'go',         label: 'Go'         },
    { value: 'rust',       label: 'Rust'       },
    { value: 'typescript', label: 'TypeScript' },
  ]

  const getCodeTemplate = (lang: string) => {
    const q = question
    const templates: Record<string, string> = {
      javascript: `/**\n * Solution for: ${q?.Question || 'Problem'}\n * Difficulty: ${q?.Difficulty || 'Unknown'}\n * Topics: ${q?.Topics || 'Unknown'}\n */\n\nfunction solution() {\n    // Your implementation here\n    return null;\n}\n\nconsole.log(solution());`,
      python:     `"""\nSolution for: ${q?.Question || 'Problem'}\nDifficulty: ${q?.Difficulty || 'Unknown'}\nTopics: ${q?.Topics || 'Unknown'}\n"""\n\ndef solution():\n    pass\n\nif __name__ == "__main__":\n    print(solution())`,
      java:       `public class Solution {\n    public void solution() {\n        // Your implementation here\n    }\n    public static void main(String[] args) {\n        new Solution().solution();\n    }\n}`,
      cpp:        `#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solution() {}\n};\n\nint main() { Solution sol; return 0; }`,
      csharp:     `using System;\npublic class Solution {\n    public void SolutionMethod() {}\n    static void Main() { new Solution().SolutionMethod(); }\n}`,
      go:         `package main\n\nfunc solution() {}\n\nfunc main() { solution() }`,
      rust:       `fn solution() {}\n\nfn main() { solution(); }`,
      typescript: `function solution(): void {}\n\nsolution();`,
    }
    return templates[lang] || templates.javascript
  }

  useEffect(() => {
    const questionId = params.id as string
    const found = getQuestionById(questionId) || null
    if (found) {
      setQuestion(found)
      setCode(getCodeTemplate(language))
      setMessages([{
        role: 'assistant',
        content: `Welcome to your AI coding session.\n\nI'm here to guide you through **"${found.Question}"** — a **${found.Difficulty}** level challenge.\n\n**Focus Areas:**\n${found.Topics.split(',').map(t => `• ${t.trim()}`).join('\n')}\n\n**How I can help:**\n• Problem analysis and approach design\n• Code review with constructive feedback\n• Time and space complexity analysis\n• Edge case identification\n\nReady to begin? Share your approach or ask for guidance.`,
        timestamp: new Date(),
      }])
    }
  }, [params.id, currentQuestion, getQuestionById, language])

  useEffect(() => { scrollToBottom() }, [messages, isTyping])

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    setCode(getCodeTemplate(lang))
  }

  const sendMessage = async () => {
    if (!userInput.trim() || !question) return

    const userMsg: ChatMessage = {
      role: 'user', content: userInput, timestamp: new Date(), hasCode: userInput.includes('```')
    }
    setMessages(prev => [...prev, userMsg])
    setUserInput('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const context = `You are an expert AI tutor helping with the coding problem "${question.Question}".
This is a ${question.Difficulty} difficulty problem with topics: ${question.Topics}.
Problem URL: ${question['Link of Question']}

Guide the student without giving away the full solution.
When reviewing code: point out bugs, suggest improvements, explain complexity, give constructive feedback.
Use markdown: **bold**, \`inline code\`, \`\`\`language blocks\`\`\`, numbered lists, bullet points, > tips.

Previous conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Student's message: ${userInput}`

      const result = await chatSession.sendMessage(context)
      const text = result.response.text()

      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: text, timestamp: new Date() }])
        setIsTyping(false)
      }, 500)
    } catch (err) {
      console.error('AI error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error. Please try again in a moment.',
        timestamp: new Date(),
      }])
      setIsTyping(false)
    } finally {
      setIsLoading(false)
    }
  }

  const formatMessageContent = (content: string) =>
    content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-zinc-900 dark:text-zinc-100">$1</strong>')
      .replace(/\`\`\`(\w+)?\n([\s\S]*?)\n?\`\`\`/g, '<div class="my-4 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"><div class="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400 font-mono border-b border-zinc-200 dark:border-zinc-800">$1</div><pre class="bg-white dark:bg-zinc-950 p-4 overflow-x-auto"><code class="text-sm text-zinc-800 dark:text-zinc-300 font-mono">$2</code></pre></div>')
      .replace(/\`(.*?)\`/g, '<code class="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 rounded text-sm font-mono">$1</code>')
      .replace(/^• (.*$)/gim, '<div class="flex items-start gap-2 mb-1.5"><span class="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-2 flex-shrink-0"></span><span class="text-zinc-700 dark:text-zinc-300">$1</span></div>')
      .replace(/^(\d+)\. (.*$)/gim, '<div class="flex items-start gap-2.5 mb-2"><span class="flex items-center justify-center min-w-[20px] h-5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium">$1</span><span class="text-zinc-700 dark:text-zinc-300 pt-0.5">$2</span></div>')
      .replace(/^> (.*$)/gim, '<div class="border-l-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 pl-4 py-2 my-3 text-zinc-700 dark:text-zinc-300">$1</div>')

  const quickActions = [
    { text: 'Strategic Hint',    action: 'Can you give me a strategic hint to get started?'  },
    { text: 'Optimal Approach',  action: "What's the most optimal approach for this problem?" },
    { text: 'Complexity',        action: 'What should be the time and space complexity?'       },
    { text: 'Edge Cases',        action: 'What important edge cases should I consider?'        },
    { text: 'Optimize',          action: 'How can I optimize my current solution?'             },
    { text: 'Debug Code',        action: 'Can you help me debug and fix my code?'              },
    { text: 'Review Code',       action: 'Please review my code and provide feedback'          },
  ]

  const AIIcon = () => (
    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center flex-shrink-0">
      <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${theme === 'dark' ? 'text-blue-500' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    </div>
  )

  if (!question) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-2 border-zinc-200 dark:border-zinc-800 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Loading Challenge</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Preparing your environment</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">

      {/* ── HEADER ── */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50 flex-shrink-0">
        <div className="max-w-[1800px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors flex-shrink-0 cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                <span className="hidden sm:inline">Back</span>
              </button>
              <span className="hidden md:block text-sm font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[200px] lg:max-w-[400px]">{question.Question}</span>
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-full flex-shrink-0">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">AI Active</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <div className="hidden xl:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-0.5">
                {(['horizontal', 'vertical'] as const).map(l => (
                  <button key={l} onClick={() => setLayout(l)} className={`p-1.5 rounded-md transition-colors ${layout === l ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {l === 'horizontal'
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />}
                    </svg>
                  </button>
                ))}
              </div>
              <button onClick={() => setIsSidebarOpen(true)} className="xl:hidden p-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors" title="Quick Actions">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </button>
              <a href={question['Link of Question']} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs sm:text-sm font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                <span className="hidden sm:inline">View Problem</span>
                <span className="sm:hidden">View</span>
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE TAB BAR ── */}
      <div className="xl:hidden flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="flex">
          {(['chat', 'editor'] as ActiveTab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
              {tab === 'chat'
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              }
              {tab === 'chat' ? 'AI Chat' : 'Code Editor'}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col min-h-0 max-w-[1800px] mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* Problem Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8 flex-shrink-0">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 lg:p-8 bg-white dark:bg-zinc-950">
            <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-3 leading-tight">{question.Question}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${question.Difficulty === 'EASY' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900' : question.Difficulty === 'MEDIUM' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'}`}>{question.Difficulty}</span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full">
                <svg className="w-3 h-3 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[120px] sm:max-w-[200px] lg:max-w-none">{question.Topics}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full">
                <svg className="w-3 h-3 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{question['Frequency (Number of Companies)']} co.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTENT GRID ── */}
        <div className="flex-1 flex min-h-0">
          <div className={`flex-1 flex min-h-0 gap-6 lg:gap-8 ${layout === 'vertical' ? 'flex-col' : 'flex-col xl:flex-row'}`}>

            {/* Desktop Sidebar */}
            <div className={`hidden xl:block flex-shrink-0 ${layout === 'vertical' ? 'w-full' : 'w-72 2xl:w-80'}`}>
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-950 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Quick Actions</h3>
                    <div className={layout === 'vertical' ? 'grid grid-cols-2 gap-2' : 'space-y-1.5'}>
                      {quickActions.map((item, i) => (
                        <button key={i} onClick={() => setUserInput(item.action)} className="w-full text-left px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-lg transition-colors">{item.text}</button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Editor Settings</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Language</label>
                        <select value={language} onChange={e => handleLanguageChange(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all">
                          {languageOptions.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Theme</label>
                        <select value={editorTheme} onChange={e => setEditorTheme(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all">
                          <option value="vs-dark">Dark</option>
                          <option value="light">Light</option>
                          <option value="hc-black">High Contrast</option>
                        </select>
                      </div>
                      <div className="space-y-2 pt-1">
                        <button onClick={copyCodeToChat} disabled={!isEditorReady} className="w-full px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Send Code to AI</button>
                        <button onClick={() => setCode(getCodeTemplate(language))} className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm font-medium border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Reset Template</button>
                      </div>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded text-xs font-mono">Ctrl+Enter</kbd> to send code</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat + Editor panels */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className={`flex-1 flex min-h-0 gap-6 ${layout === 'vertical' ? 'flex-col' : 'flex-col xl:flex-row'}`}>

                {/* ── CHAT PANEL ── */}
                <div className={`${activeTab === 'editor' ? 'hidden xl:flex' : 'flex'} ${layout === 'vertical' ? '' : 'xl:flex-1'} flex-col min-h-0`}>
                  <div
                    className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col bg-white dark:bg-zinc-950"
                    style={{ height: mobile ? 'calc(100vh - 280px)' : undefined, minHeight: mobile ? '400px' : '500px' }}
                  >
                    {/* Chat Header */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <AIIcon />
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Mentor</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">{selectedModel}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 rounded-full">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Online</span>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4 min-h-0">
                      {messages.map((message, index) => (
                        <div key={index} className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {message.role === 'assistant' && <AIIcon />}
                          <div className={`max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'order-1' : ''}`}>
                            <div className={`p-3 sm:p-4 rounded-lg ${message.role === 'user' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800'}`}>
                              <div
                                className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: message.role === 'assistant' ? formatMessageContent(message.content) : message.content.replace(/\n/g, '<br>') }}
                              />
                              <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-500'}`}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          {message.role === 'user' && (
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-700 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* ── AILoadingState replaces old spinner dots ── */}
                      {(isLoading || isTyping) && <AILoadingState />}

                      <div ref={messagesEndRef} />
                    </div>

                    {/* ── AIPromptInput replaces old textarea ── */}
                    <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                      <AIPromptInput
                        value={userInput}
                        onChange={setUserInput}
                        onSend={sendMessage}
                        isLoading={isLoading}
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                      />
                    </div>
                  </div>
                </div>

                {/* ── CODE EDITOR PANEL ── */}
                <div className={`${activeTab === 'chat' ? 'hidden xl:flex' : 'flex'} ${layout === 'vertical' ? '' : 'xl:flex-1'} flex-col min-h-0`}>
                  <div
                    className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col bg-white dark:bg-zinc-950"
                    style={{ height: mobile ? 'calc(100vh - 280px)' : undefined, minHeight: mobile ? '400px' : '500px' }}
                  >
                    {/* Editor Header */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex-shrink-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center flex-shrink-0">
                            <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${theme === 'dark' ? 'text-blue-500' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Code Editor</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">{languageOptions.find(l => l.value === language)?.label}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 xl:hidden">
                          <select value={language} onChange={e => handleLanguageChange(e.target.value)} className="text-xs px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg max-w-[90px] sm:max-w-none">
                            {languageOptions.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                          </select>
                          <button onClick={copyCodeToChat} disabled={!isEditorReady} className="p-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg disabled:opacity-50 flex-shrink-0" title="Send to Chat">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                          </button>
                          <button onClick={() => setCode(getCodeTemplate(language))} className="p-1.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg flex-shrink-0" title="Reset">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          </button>
                        </div>
                        <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full">
                          <div className={`w-1.5 h-1.5 rounded-full ${isEditorReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{isEditorReady ? 'Ready' : 'Loading'}</span>
                        </div>
                      </div>
                    </div>

                    <div ref={editorContainerRef} className="flex-1 relative min-h-0">
                      <MonacoEditor height="100%" language={language} value={code} onChange={v => setCode(v || '')} onMount={handleEditorDidMount} theme={editorTheme} />
                    </div>

                    <div className="px-4 sm:px-6 py-2 sm:py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex-shrink-0">
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <div className="flex items-center gap-2">
                          <span>{isEditorReady ? 'Ready' : 'Loading'}</span>
                          <span className="hidden sm:inline">·</span>
                          <span className="hidden sm:inline"><kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded font-mono">Ctrl+Enter</kbd> sends code</span>
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

      {/* ── MOBILE QUICK ACTIONS DRAWER ── */}
      {isSidebarOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative ml-auto bg-white dark:bg-zinc-950 w-72 max-w-[85vw] border-l border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Quick Actions</h3>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
              {quickActions.map((item, i) => (
                <button key={i} onClick={() => { setUserInput(item.action); setActiveTab('chat'); setIsSidebarOpen(false) }} className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors">{item.text}</button>
              ))}
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-3 flex-shrink-0">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Editor</h4>
              <select value={language} onChange={e => handleLanguageChange(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                {languageOptions.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <button onClick={() => { copyCodeToChat(); setIsSidebarOpen(false) }} disabled={!isEditorReady} className="w-full px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
                Send Code to Chat
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .animation-delay-75  { animation-delay: 75ms;  }
        .animation-delay-150 { animation-delay: 150ms; }
        .overflow-y-auto::-webkit-scrollbar       { width: 4px; }
        .overflow-y-auto::-webkit-scrollbar-track  { background: transparent; }
        .overflow-y-auto::-webkit-scrollbar-thumb  { background: rgba(161,161,170,0.3); border-radius: 2px; }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: rgba(161,161,170,0.5); }
        .monaco-editor, .monaco-editor-background, .monaco-editor .overflow-guard { background: transparent !important; }
        .monaco-editor { width: 100% !important; height: 100% !important; }
      `}</style>
    </div>
  )
}