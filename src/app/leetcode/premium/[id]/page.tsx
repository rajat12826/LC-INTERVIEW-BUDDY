'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuestionStore } from '@/utils/stores/useQuestionStore'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Bot, Check, ChevronDown, Crown } from 'lucide-react'

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
import ToggleButton from '@/app/_components/layout/AnimatedDarkModeToggle'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[300px] flex items-center justify-center bg-[#0a0a0c]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border border-amber-500/20 rounded-full" />
          <div className="absolute inset-0 border border-transparent border-t-amber-500 rounded-full animate-spin" />
        </div>
        <p className="text-xs text-zinc-500 font-medium tracking-wide">Loading Editor</p>
      </div>
    </div>
  ),
})

// ─── Types ────────────────────────────────────────────────────────────────────

type PQuestion = {
  title: string
  link: string
  difficulty: string
  description?: string
  steps?: string[]
  illustration?: string
  note?: string
  key_points?: string[]
  examples?: Array<{ image?: string; input: string; output: string; explanation?: string }>
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

type ActiveTab = 'chat' | 'editor'

// ─── AI Loading State ─────────────────────────────────────────────────────────

const TASK_SEQUENCES = [
  {
    status: 'Analyzing your question',
    lines: ['Reading your message...', 'Understanding context...', 'Checking problem details...', 'Preparing response...', 'Finalizing answer...'],
  },
  {
    status: 'Reviewing your code',
    lines: ['Parsing code structure...', 'Checking for bugs...', 'Analyzing complexity...', 'Reviewing edge cases...', 'Generating feedback...', 'Optimizing suggestions...', 'Finalizing review...'],
  },
  {
    status: 'Crafting explanation',
    lines: ['Building explanation...', 'Structuring concepts...', 'Adding examples...', 'Checking clarity...', 'Finalizing response...'],
  },
]

const LoadingAnimation = ({ progress }: { progress: number }) => (
  <div className="relative w-6 h-6">
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <mask id="pm">
          <rect width="240" height="240" fill="black" />
          <circle r="120" cx="120" cy="120" fill="white"
            strokeDasharray={`${(progress / 100) * 754}, 754`}
            transform="rotate(-90 120 120)" />
        </mask>
      </defs>
      <style>{`
        @keyframes rcw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes rccw { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        .gs circle { transform-origin: 120px 120px; }
        .gs circle:nth-child(1) { animation: rcw 8s linear infinite; }
        .gs circle:nth-child(2) { animation: rccw 8s linear infinite; }
        .gs circle:nth-child(3) { animation: rcw 8s linear infinite; }
        .gs circle:nth-child(4) { animation: rccw 8s linear infinite; }
        .gs circle:nth-child(5) { animation: rcw 8s linear infinite; }
        .gs circle:nth-child(6) { animation: rccw 8s linear infinite; }
        .gs circle:nth-child(2n) { animation-delay: 0.2s; }
        .gs circle:nth-child(3n) { animation-delay: 0.3s; }
      `}</style>
      <g className="gs" strokeWidth="16" strokeDasharray="18% 40%" mask="url(#pm)">
        <circle r="150" cx="120" cy="120" stroke="#f59e0b" opacity="0.9" />
        <circle r="130" cx="120" cy="120" stroke="#fb923c" opacity="0.9" />
        <circle r="110" cx="120" cy="120" stroke="#fbbf24" opacity="0.9" />
        <circle r="90"  cx="120" cy="120" stroke="#ea580c" opacity="0.9" />
        <circle r="70"  cx="120" cy="120" stroke="#f97316" opacity="0.9" />
        <circle r="50"  cx="120" cy="120" stroke="#fcd34d" opacity="0.9" />
      </g>
    </svg>
  </div>
)

function AILoadingState() {
  const [seqIdx, setSeqIdx] = useState(0)
  const [lines, setLines] = useState<Array<{ text: string; number: number }>>([])
  const [scrollPos, setScrollPos] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const LH = 28

  const seq = TASK_SEQUENCES[seqIdx]
  const total = seq.lines.length

  useEffect(() => {
    setLines(seq.lines.slice(0, Math.min(5, total)).map((t, i) => ({ text: t, number: i + 1 })))
    setScrollPos(0)
  }, [seqIdx, seq.lines, total])

  useEffect(() => {
    const t = setInterval(() => {
      const firstIdx = Math.floor(scrollPos / LH)
      const nextIdx = (firstIdx + 3) % total
      if (nextIdx < firstIdx && nextIdx !== 0) { setSeqIdx(p => (p + 1) % TASK_SEQUENCES.length); return }
      if (nextIdx >= lines.length && nextIdx < total)
        setLines(p => [...p, { text: seq.lines[nextIdx], number: nextIdx + 1 }])
      setScrollPos(p => p + LH)
    }, 2000)
    return () => clearInterval(t)
  }, [scrollPos, lines, total, seqIdx, seq.lines])

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = scrollPos
  }, [scrollPos])

  return (
    <div className="flex gap-2 sm:gap-3">
      <AIIcon />
      <div className={`rounded-xl border border-zinc-200/60 dark:border-white/[0.06] bg-zinc-50/80 dark:bg-white/[0.03] backdrop-blur-sm p-3
        shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_16px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 mb-2`}>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[11px] font-medium tracking-wide text-zinc-500 dark:text-[#8A8F98]">{seq.status}...</span>
        </div>
        <div className="relative">
          <div ref={containerRef} className="font-mono text-xs overflow-hidden w-full h-[84px] rounded-lg" style={{ scrollBehavior: 'smooth' }}>
            {lines.map(l => (
              <div key={`${l.number}-${l.text}`} className="flex h-[28px] items-center px-2">
                <div className="text-zinc-400/50 dark:text-white/20 pr-3 select-none w-6 text-right">{l.number}</div>
                <div className="text-zinc-700 dark:text-zinc-300 flex-1 ml-1">{l.text}</div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 pointer-events-none rounded-lg"
            style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(249,250,251,0.95) 100%)' }}
            data-dark-fade="true" />
        </div>
      </div>
   
  )
}

// ─── AI Prompt Input ──────────────────────────────────────────────────────────

const OPENAI_SVG = <svg className="block dark:hidden w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 256 260" xmlns="http://www.w3.org/2000/svg"><path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Z" /></svg>
const OPENAI_SVG_DARK = <svg className="hidden dark:block w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 256 260" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Z" /></svg>
const OpenAIIcon = () => <>{OPENAI_SVG}{OPENAI_SVG_DARK}</>

const GeminiIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="gfp2" x1="0%" x2="68.73%" y1="100%" y2="30.395%"><stop offset="0%" stopColor="#1C7DFF" /><stop offset="52.021%" stopColor="#1C69FF" /><stop offset="100%" stopColor="#F0DCD6" /></linearGradient></defs>
    <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12" fill="url(#gfp2)" fillRule="nonzero" />
  </svg>
)

const ClaudeIcon = () => (
  <>
    <svg className="block dark:hidden w-3.5 h-3.5 flex-shrink-0" fill="#000" fillRule="evenodd" viewBox="0 0 24 24"><path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" /></svg>
    <svg className="hidden dark:block w-3.5 h-3.5 flex-shrink-0" fill="#fff" fillRule="evenodd" viewBox="0 0 24 24"><path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" /></svg>
  </>
)

const AI_MODELS = ['Claude 4.5 Sonnet', 'GPT-5', 'GPT-5-mini', 'Gemini 3']
const MODEL_ICONS: Record<string, React.ReactNode> = {
  'Claude 4.5 Sonnet': <ClaudeIcon />,
  'GPT-5':             <OpenAIIcon />,
  'GPT-5-mini':        <OpenAIIcon />,
  'Gemini 3':          <GeminiIcon />,
}

// Shared AIIcon component
const AIIcon = () => (
  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex-shrink-0
    bg-gradient-to-br from-amber-500 to-orange-600
    shadow-[0_0_0_1px_rgba(245,158,11,0.3),0_2px_8px_rgba(245,158,11,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]
    flex items-center justify-center`}>
    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  </div>
)

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
      if (value.trim() && !isLoading) { onSend(); adjustHeight(true) }
    }
  }

  return (
    <div className={`rounded-2xl overflow-hidden
      bg-zinc-100/70 dark:bg-white/[0.04]
      border border-zinc-200/60 dark:border-white/[0.06]
      shadow-[0_1px_4px_rgba(0,0,0,0.04)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.02)]`}>
      {/* Top bar */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClaudeIcon />
          <span className="text-xs font-medium text-zinc-600 dark:text-[#8A8F98] tracking-tight">
            Ask anything about this problem
          </span>
        </div>
        <span className="hidden sm:block text-[11px] text-zinc-400 dark:text-white/30 tracking-wide">
          Shift+Enter for newline
        </span>
      </div>

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
            'w-full resize-none border-none rounded-none',
            'bg-transparent px-4 py-2',
            'placeholder:text-zinc-400 dark:placeholder:text-white/30',
            'text-zinc-900 dark:text-[#EDEDEF] text-sm',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
            'min-h-[72px] disabled:opacity-50'
          )}
        />
      </div>

      {/* Toolbar */}
      <div className={`flex items-center justify-between px-3 py-2
        border-t border-zinc-200/40 dark:border-white/[0.04]
        bg-zinc-50/50 dark:bg-white/[0.02]`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={`flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs
              hover:bg-zinc-200/60 dark:hover:bg-white/[0.06]
              text-zinc-700 dark:text-[#8A8F98]
              focus-visible:ring-1 focus-visible:ring-amber-500 focus-visible:ring-offset-0`}>
              <AnimatePresence mode="wait">
                <motion.div key={selectedModel} className="flex items-center gap-1.5"
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.12 }}>
                  {MODEL_ICONS[selectedModel]}
                  <span className="hidden sm:inline font-medium">{selectedModel}</span>
                  <ChevronDown className="h-3 w-3 opacity-40" />
                </motion.div>
              </AnimatePresence>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={`min-w-[10rem] border-zinc-200/60 dark:border-white/[0.08]
            bg-white dark:bg-[#0a0a0c]
            shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_40px_rgba(0,0,0,0.5)]`}>
            {AI_MODELS.map(model => (
              <DropdownMenuItem key={model} className={`flex items-center justify-between gap-2 text-zinc-700 dark:text-[#EDEDEF]
                hover:bg-zinc-100 dark:hover:bg-white/[0.06] focus:bg-zinc-100 dark:focus:bg-white/[0.06]`}
                onSelect={() => onModelChange(model)}>
                <div className="flex items-center gap-2">
                  {MODEL_ICONS[model] ?? <Bot className="h-4 w-4 opacity-50" />}
                  <span className="text-sm">{model}</span>
                </div>
                {selectedModel === model && <Check className="h-3.5 w-3.5 text-amber-500" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button aria-label="Send message" type="button" onClick={onSend}
          disabled={!value.trim() || isLoading}
          className={cn(
            'relative rounded-lg px-3 py-1.5 text-xs font-semibold overflow-hidden',
            'bg-gradient-to-b from-amber-500 to-orange-600',
            'text-white',
            'shadow-[0_0_0_1px_rgba(245,158,11,0.4),0_2px_8px_rgba(245,158,11,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]',
            'hover:shadow-[0_0_0_1px_rgba(245,158,11,0.5),0_4px_16px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]',
            'active:scale-[0.97]',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
            'transition-all duration-150 flex items-center gap-1.5'
          )}>
          {isLoading
            ? <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            : <><span>Send</span><ArrowRight className="h-3 w-3" /></>
          }
        </button>
      </div>
    </div>
  )
}

// ─── Panel wrapper ─────────────────────────────────────────────────────────────
function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'rounded-2xl overflow-hidden flex flex-col',
      'bg-white dark:bg-[#0a0a0c]',
      'border border-zinc-200/60 dark:border-white/[0.06]',
      'shadow-[0_2px_20px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.02)]',
      'dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_40px_rgba(0,0,0,0.4)]',
      className
    )}>
      {children}
    </div>
  )
}

function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className={`relative px-4 sm:px-5 py-3 sm:py-4 flex-shrink-0
      bg-zinc-50/80 dark:bg-white/[0.02]
      border-b border-zinc-200/60 dark:border-white/[0.06]`}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      {children}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat')
  const [selectedModel, setSelectedModel] = useState('Claude 4.5 Sonnet')
  const [showProblemDetails, setShowProblemDetails] = useState(false)

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
      const isMob = window.innerWidth < 768
      editor.updateOptions({
        fontSize: isMob ? 12 : 13,
        fontFamily: '"Geist Mono", "JetBrains Mono", "SF Mono", Menlo, Monaco, monospace',
        fontLigatures: true,
        lineHeight: 1.7,
        minimap: { enabled: window.innerWidth > 1280 },
        lineNumbers: isMob ? 'off' : 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        cursorStyle: 'line',
        automaticLayout: true,
        wordWrap: 'on',
        wordWrapColumn: 120,
        theme: editorTheme,
        padding: { top: isMob ? 12 : 20, bottom: isMob ? 12 : 20 },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        renderLineHighlight: 'all',
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: true },
        suggestOnTriggerCharacters: true,
        scrollbar: { vertical: 'visible', horizontal: 'visible', verticalScrollbarSize: isMob ? 4 : 8, horizontalScrollbarSize: isMob ? 4 : 8 },
      })
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => copyCodeToChat())
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, (e: any) => { e?.preventDefault(); editor.getAction('editor.action.formatDocument')?.run() })
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
    const t = Array.isArray(question?.topics) ? question.topics.join(', ') : (question?.topics || 'Unknown')
    const templates: Record<string, string> = {
      javascript: `/**\n * ${question?.title || 'Problem'} — ${question?.difficulty || 'Unknown'}\n * Topics: ${t}\n */\n\nfunction solution() {\n    // Your implementation here\n    return null;\n}\n\nconsole.log(solution());`,
      python:     `"""\n${question?.title || 'Problem'} — ${question?.difficulty || 'Unknown'}\nTopics: ${t}\n"""\n\ndef solution():\n    pass\n\nif __name__ == "__main__":\n    print(solution())`,
      java:       `public class Solution {\n    public void solution() {}\n    public static void main(String[] args) { new Solution().solution(); }\n}`,
      cpp:        `#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solution() {}\n};\n\nint main() { Solution sol; return 0; }`,
      csharp:     `using System;\npublic class Solution {\n    public void SolutionMethod() {}\n    static void Main() { new Solution().SolutionMethod(); }\n}`,
      go:         `package main\n\nfunc solution() {}\n\nfunc main() { solution() }`,
      rust:       `fn solution() {}\n\nfn main() { solution(); }`,
      typescript: `function solution(): void {}\n\nsolution();`,
    }
    return templates[lang] || templates.javascript
  }

  useEffect(() => {
    const found = getQuestionPById(params.id as string) || null
    if (found) {
      setQuestion(found)
      setCode(getCodeTemplate(language))
      const ts = Array.isArray(found.topics)
        ? found.topics.map((t: any) => `• ${t.trim()}`).join('\n')
        : found.topics ? `• ${found.topics.trim()}` : '• No specific topics'
      setMessages([{
        role: 'assistant',
        content: `Welcome to your Premium AI coding session.\n\nI'm here to guide you through **"${found.title}"** — a **${found.difficulty}** level challenge.\n\n**Focus Areas:**\n${ts}\n\n**How I can help:**\n• Problem analysis and approach design\n• Code review with constructive feedback\n• Time and space complexity analysis\n• Edge case identification\n\nReady to begin? Share your approach or ask for guidance.`,
        timestamp: new Date(),
      }])
    }
  }, [params.id, getQuestionPById, language])

  useEffect(() => { scrollToBottom() }, [messages, isTyping])

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    setCode(getCodeTemplate(lang))
  }

  const sendMessage = async () => {
    if (!userInput.trim() || !question) return
    const userMsg: ChatMessage = { role: 'user', content: userInput, timestamp: new Date(), hasCode: userInput.includes('```') }
    setMessages(prev => [...prev, userMsg])
    setUserInput('')
    setIsLoading(true)
    setIsTyping(true)
    try {
      const topicsStr = Array.isArray(question.topics) ? question.topics.join(', ') : (question.topics || 'Unknown')
      const result = await chatSession.sendMessage(
        `You are an expert AI tutor for "${question.title}" (${question.difficulty}, topics: ${topicsStr}). URL: ${question.link}\nGuide the student. Use markdown formatting. Previous:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}\nStudent: ${userInput}`
      )
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: result.response.text(), timestamp: new Date() }])
        setIsTyping(false)
      }, 500)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I encountered an error. Please try again.', timestamp: new Date() }])
      setIsTyping(false)
    } finally {
      setIsLoading(false)
    }
  }

  const CODE_BLOCK_REPLACEMENT =
    '<div class="my-3 rounded-xl border border-zinc-200/60 dark:border-white/[0.06] overflow-hidden shadow-sm dark:shadow-none">' +
    '<div class="bg-zinc-100 dark:bg-white/[0.04] px-3.5 py-2 text-[11px] font-mono text-zinc-500 dark:text-[#8A8F98] border-b border-zinc-200/60 dark:border-white/[0.06] tracking-wide">$1</div>' +
    '<pre class="bg-white dark:bg-[#050506] p-4 overflow-x-auto">' +
    '<code class="text-xs text-zinc-800 dark:text-zinc-300 font-mono leading-relaxed">$2</code></pre></div>'

  const formatMessageContent = (content: string) =>
    content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-zinc-900 dark:text-[#EDEDEF]">$1</strong>')
      .replace(/```(\w+)?\n([\s\S]*?)\n?```/g, CODE_BLOCK_REPLACEMENT)
      .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-zinc-100 dark:bg-white/[0.08] text-zinc-800 dark:text-zinc-300 rounded-md text-xs font-mono border border-zinc-200/50 dark:border-white/[0.06]">$1</code>')
      .replace(/^• (.*$)/gim, '<div class="flex items-start gap-2 mb-1.5"><span class="w-1 h-1 rounded-full bg-amber-500/60 mt-2 flex-shrink-0"></span><span class="text-zinc-700 dark:text-zinc-300 text-sm">$1</span></div>')
      .replace(/^(\d+)\. (.*$)/gim, '<div class="flex items-start gap-2.5 mb-2"><span class="flex items-center justify-center min-w-[18px] h-[18px] rounded-md bg-amber-500/10 dark:bg-amber-500/[0.12] text-amber-700 dark:text-amber-400 text-[11px] font-semibold border border-amber-500/20">$1</span><span class="text-zinc-700 dark:text-zinc-300 pt-0.5 text-sm">$2</span></div>')
      .replace(/^> (.*$)/gim, '<div class="border-l-2 border-amber-500/40 bg-amber-50/50 dark:bg-amber-500/[0.05] pl-4 py-2 my-3 text-zinc-700 dark:text-zinc-300 text-sm italic rounded-r-lg">$1</div>')

  const quickActions = [
    { text: 'Strategic Hint',   action: 'Can you give me a strategic hint to get started?'  },
    { text: 'Optimal Approach', action: "What's the most optimal approach for this problem?" },
    { text: 'Complexity',       action: 'What should be the time and space complexity?'       },
    { text: 'Edge Cases',       action: 'What important edge cases should I consider?'        },
    { text: 'Optimize',         action: 'How can I optimize my current solution?'             },
    { text: 'Debug Code',       action: 'Can you help me debug and fix my code?'              },
    { text: 'Review Code',      action: 'Please review my code and provide feedback'          },
  ]

  if (!question) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050506] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 blur-[16px]" />
            <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600
              shadow-[0_0_0_1px_rgba(245,158,11,0.3),0_4px_20px_rgba(245,158,11,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]
              flex items-center justify-center`}>
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-[#EDEDEF] tracking-tight mb-1">Loading Premium Challenge</h2>
            <p className="text-sm text-zinc-500 dark:text-[#8A8F98]">Preparing your environment</p>
          </div>
        </div>
      </div>
    )
  }

  const difficultyConfig = {
    easy:   { bg: 'bg-emerald-100 dark:bg-emerald-500/[0.08]', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20' },
    medium: { bg: 'bg-amber-100 dark:bg-amber-500/[0.08]',   text: 'text-amber-700 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-500/20' },
    hard:   { bg: 'bg-rose-100 dark:bg-rose-500/[0.08]',     text: 'text-rose-700 dark:text-rose-400',     border: 'border-rose-200 dark:border-rose-500/20' },
  }[question.difficulty?.toLowerCase() || 'medium'] || { bg: 'bg-zinc-100 dark:bg-white/[0.06]', text: 'text-zinc-700 dark:text-zinc-300', border: 'border-zinc-200 dark:border-white/[0.08]' }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050506] flex flex-col">

      {/* Ambient background blobs — dark mode */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden hidden dark:block">
        <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-amber-500/[0.06] blur-[120px] animate-blob-float" />
        <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[400px] rounded-full bg-orange-500/[0.04] blur-[100px] animate-blob-float-slow" />
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className={`relative z-50 border-b border-zinc-200/60 dark:border-white/[0.06]
        bg-white/80 dark:bg-[#050506]/90 backdrop-blur-xl flex-shrink-0
        shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:shadow-none`}>
        {/* Top glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        <div className="max-w-[1800px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button onClick={() => router.back()}
                className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg
                  text-zinc-700 dark:text-[#8A8F98]
                  hover:bg-zinc-100 dark:hover:bg-white/[0.05]
                  hover:text-zinc-900 dark:hover:text-[#EDEDEF]
                  border border-transparent hover:border-zinc-200/60 dark:hover:border-white/[0.06]
                  transition-all duration-150 flex-shrink-0 cursor-pointer`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                <span className="hidden sm:inline">Back</span>
              </button>

              <div className="hidden md:block h-4 w-px bg-zinc-200 dark:bg-white/[0.08]" />

              <span className="hidden md:block text-sm font-medium text-zinc-600 dark:text-[#8A8F98] truncate max-w-[200px] lg:max-w-[400px]">
                {question.title}
              </span>

              {/* Premium badge */}
              <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full
                bg-gradient-to-r from-amber-500/10 to-orange-500/10
                dark:from-amber-500/[0.08] dark:to-orange-500/[0.06]
                border border-amber-500/20 dark:border-amber-500/[0.15]
                shadow-[0_0_0_1px_rgba(245,158,11,0.05)]`}>
                <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px] font-semibold tracking-wide text-amber-700 dark:text-amber-300">Premium AI</span>
                <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Layout toggle — desktop */}
              <div className="hidden xl:flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06]">
                {(['horizontal', 'vertical'] as const).map(l => (
                  <button key={l} onClick={() => setLayout(l)}
                    className={`p-1.5 rounded-md transition-all duration-150 ${layout === l
                      ? 'bg-white dark:bg-white/[0.08] text-zinc-900 dark:text-[#EDEDEF] shadow-sm'
                      : 'text-zinc-500 dark:text-[#8A8F98] hover:text-zinc-700 dark:hover:text-[#EDEDEF]'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {l === 'horizontal'
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />}
                    </svg>
                  </button>
                ))}
              </div>

              {/* Mobile quick actions trigger */}
              <button onClick={() => setIsSidebarOpen(true)}
                className={`xl:hidden p-2 rounded-lg text-zinc-600 dark:text-[#8A8F98]
                  hover:bg-zinc-100 dark:hover:bg-white/[0.05] hover:text-zinc-900 dark:hover:text-[#EDEDEF]
                  border border-transparent hover:border-zinc-200/60 dark:hover:border-white/[0.06]
                  transition-all duration-150`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </button>
               <ToggleButton/>

              {/* View Problem */}
              <a href={question.link} target="_blank" rel="noopener noreferrer"
                className={`group relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl overflow-hidden
                  bg-gradient-to-b from-amber-500 to-orange-600
                  text-white text-xs sm:text-sm font-semibold
                  shadow-[0_0_0_1px_rgba(245,158,11,0.4),0_2px_8px_rgba(245,158,11,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]
                  hover:shadow-[0_0_0_1px_rgba(245,158,11,0.5),0_4px_20px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]
                  active:scale-[0.97]
                  transition-all duration-150`}>
                <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="hidden sm:inline">View Problem</span>
                <span className="sm:hidden">View</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE TAB BAR ─────────────────────────────────────────────── */}
      <div className={`xl:hidden relative z-40 flex-shrink-0
        border-b border-zinc-200/60 dark:border-white/[0.06]
        bg-white/80 dark:bg-[#050506]/90 backdrop-blur-xl`}>
        <div className="flex">
          {(['chat', 'editor'] as ActiveTab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 border-b-2 ${
                activeTab === tab
                  ? 'border-amber-500 text-zinc-900 dark:text-[#EDEDEF]'
                  : 'border-transparent text-zinc-500 dark:text-[#8A8F98] hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}>
              {tab === 'chat'
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              }
              {tab === 'chat' ? 'AI Chat' : 'Code Editor'}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN ───────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col min-h-0 max-w-[1800px] mx-auto w-full px-3 sm:px-5 lg:px-8 py-4 sm:py-6">

        {/* ── Problem Header ── */}
        <div className="mb-4 sm:mb-5 flex-shrink-0">
          <div className={`rounded-2xl overflow-hidden
            bg-white dark:bg-[#0a0a0c]
            border border-zinc-200/60 dark:border-white/[0.06]
            shadow-[0_2px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_32px_rgba(0,0,0,0.4)]`}>
            {/* Accent line top */}
            <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-[#EDEDEF] tracking-tight leading-tight mb-3">
                    {question.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${difficultyConfig.bg} ${difficultyConfig.text} ${difficultyConfig.border}`}>
                      {question.difficulty}
                    </span>
                    {question.topics && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
                        bg-zinc-100 dark:bg-white/[0.04]
                        border border-zinc-200/60 dark:border-white/[0.06]`}>
                        <svg className="w-3 h-3 text-zinc-400 dark:text-[#8A8F98] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                        <span className="text-[11px] font-medium text-zinc-600 dark:text-[#8A8F98] truncate max-w-[120px] sm:max-w-[200px] lg:max-w-none">
                          {Array.isArray(question.topics) ? question.topics.join(', ') : question.topics}
                        </span>
                      </div>
                    )}
                    {question.companies && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
                        bg-zinc-100 dark:bg-white/[0.04]
                        border border-zinc-200/60 dark:border-white/[0.06]`}>
                        <svg className="w-3 h-3 text-zinc-400 dark:text-[#8A8F98] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        <span className="text-[11px] font-medium text-zinc-600 dark:text-[#8A8F98] whitespace-nowrap">{question.companies}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setShowProblemDetails(!showProblemDetails)}
                  className={`flex-shrink-0 p-2 rounded-xl
                    bg-zinc-100 dark:bg-white/[0.04]
                    border border-zinc-200/60 dark:border-white/[0.06]
                    hover:bg-zinc-200 dark:hover:bg-white/[0.08]
                    text-zinc-500 dark:text-[#8A8F98]
                    transition-all duration-150`}>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${showProblemDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {showProblemDetails && (
              <div className="border-t border-zinc-200/60 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.01]">
                <div className="p-4 sm:p-5 lg:p-6 space-y-5">
                  {question.description && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-0.5 h-4 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#EDEDEF]">Description</h3>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-[#8A8F98] leading-relaxed pl-3">{question.description}</p>
                    </div>
                  )}
                  {question.illustration && (
                    <div className="pl-3">
                      <img src={question.illustration} alt="Problem illustration" className="max-w-full h-auto rounded-xl border border-zinc-200 dark:border-white/[0.06]" />
                    </div>
                  )}
                  {question.steps && question.steps.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-0.5 h-4 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#EDEDEF]">Steps</h3>
                      </div>
                      <ol className="space-y-2 pl-3">
                        {question.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className={`flex items-center justify-center w-5 h-5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white text-[10px] font-bold flex-shrink-0 mt-0.5 shadow-[0_2px_4px_rgba(245,158,11,0.2)]`}>{i + 1}</span>
                            <span className="text-sm text-zinc-600 dark:text-[#8A8F98] leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {question.key_points && question.key_points.length > 0 && (
                    <div className={`rounded-xl overflow-hidden border border-amber-200/60 dark:border-amber-500/[0.15]
                      bg-amber-50/50 dark:bg-amber-500/[0.04]`}>
                      <div className="h-px bg-gradient-to-r from-amber-500/30 via-orange-500/20 to-transparent" />
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-2.5">
                          <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wide">Key Points</h4>
                        </div>
                        <ul className="space-y-1.5">
                          {question.key_points.map((pt, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300/80">
                              <span className="w-1 h-1 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {question.note && (
                    <div className={`rounded-xl overflow-hidden border border-blue-200/60 dark:border-blue-500/[0.12]
                      bg-blue-50/50 dark:bg-blue-500/[0.04]`}>
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wide">Note</h4>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-300/80">{question.note}</p>
                      </div>
                    </div>
                  )}
                  {question.examples && question.examples.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-0.5 h-4 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#EDEDEF]">Examples</h3>
                      </div>
                      <div className="space-y-3 pl-3">
                        {question.examples.map((ex, i) => (
                          <div key={i} className="rounded-xl border border-zinc-200/60 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
                            <div className="px-3 py-2 border-b border-zinc-100 dark:border-white/[0.04] bg-zinc-50 dark:bg-white/[0.02]">
                              <span className="text-xs font-semibold text-zinc-600 dark:text-[#8A8F98]">Example {i + 1}</span>
                            </div>
                            <div className="p-3 space-y-2">
                              {ex.image && <img src={ex.image} alt="" className="max-w-full h-auto rounded-lg border border-zinc-200 dark:border-white/[0.06] mb-2" />}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-lg bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/[0.04] p-2">
                                  <div className="text-[10px] font-semibold text-zinc-400 dark:text-white/30 uppercase tracking-wide mb-1">Input</div>
                                  <code className="text-xs font-mono text-zinc-800 dark:text-zinc-300">{ex.input}</code>
                                </div>
                                <div className="rounded-lg bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/[0.04] p-2">
                                  <div className="text-[10px] font-semibold text-zinc-400 dark:text-white/30 uppercase tracking-wide mb-1">Output</div>
                                  <code className="text-xs font-mono text-zinc-800 dark:text-zinc-300">{ex.output}</code>
                                </div>
                              </div>
                              {ex.explanation && <p className="text-xs text-zinc-500 dark:text-[#8A8F98] leading-relaxed">{ex.explanation}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {question.constraints && question.constraints.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-0.5 h-4 rounded-full bg-gradient-to-b from-rose-500 to-red-500" />
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#EDEDEF]">Constraints</h3>
                      </div>
                      <ul className="space-y-1.5 pl-3">
                        {question.constraints.map((c, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <svg className="w-3 h-3 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <code className="text-xs bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06] px-2 py-0.5 rounded-md font-mono text-zinc-700 dark:text-zinc-300">{c}</code>
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

        {/* ── CONTENT GRID ─────────────────────────────────────────────── */}
        <div className="flex-1 flex min-h-0">
          <div className={`flex-1 flex min-h-0 gap-4 sm:gap-5 ${layout === 'vertical' ? 'flex-col' : 'flex-col xl:flex-row'}`}>

            {/* ── Desktop Sidebar ── */}
            <div className={`hidden xl:block flex-shrink-0 ${layout === 'vertical' ? 'w-full' : 'w-64 2xl:w-72'}`}>
              <div className={`rounded-2xl overflow-hidden
                bg-white dark:bg-[#0a0a0c]
                border border-zinc-200/60 dark:border-white/[0.06]
                shadow-[0_2px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_32px_rgba(0,0,0,0.4)]
                sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto`}>
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                <div className="p-4 space-y-5">
                  {/* Quick Actions */}
                  <div>
                    <div className="text-[10px] font-semibold text-zinc-400 dark:text-white/30 uppercase tracking-[0.12em] mb-2.5">Quick Actions</div>
                    <div className={layout === 'vertical' ? 'grid grid-cols-2 gap-1.5' : 'space-y-1'}>
                      {quickActions.map((item, i) => (
                        <button key={i} onClick={() => setUserInput(item.action)}
                          className={`w-full text-left px-3 py-2 text-xs font-medium rounded-xl
                            text-zinc-700 dark:text-[#8A8F98]
                            hover:bg-zinc-100 dark:hover:bg-white/[0.05]
                            hover:text-zinc-900 dark:hover:text-[#EDEDEF]
                            border border-zinc-200/60 dark:border-white/[0.06]
                            hover:border-zinc-300 dark:hover:border-white/[0.10]
                            transition-all duration-150`}>
                          {item.text}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-zinc-100 dark:bg-white/[0.04]" />

                  {/* Editor Settings */}
                  <div>
                    <div className="text-[10px] font-semibold text-zinc-400 dark:text-white/30 uppercase tracking-[0.12em] mb-2.5">Editor Settings</div>
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-600 dark:text-[#8A8F98] mb-1.5">Language</label>
                        <select value={language} onChange={e => handleLanguageChange(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.08] rounded-lg text-zinc-800 dark:text-[#EDEDEF] focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all">
                          {languageOptions.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-600 dark:text-[#8A8F98] mb-1.5">Theme</label>
                        <select value={editorTheme} onChange={e => setEditorTheme(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.08] rounded-lg text-zinc-800 dark:text-[#EDEDEF] focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all">
                          <option value="vs-dark">Dark</option>
                          <option value="light">Light</option>
                          <option value="hc-black">High Contrast</option>
                        </select>
                      </div>
                      <button onClick={copyCodeToChat} disabled={!isEditorReady}
                        className={`group relative w-full px-3 py-2 rounded-xl overflow-hidden
                          bg-gradient-to-b from-amber-500 to-orange-600
                          text-white text-xs font-semibold
                          shadow-[0_0_0_1px_rgba(245,158,11,0.3),0_2px_8px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]
                          hover:shadow-[0_0_0_1px_rgba(245,158,11,0.4),0_4px_16px_rgba(245,158,11,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]
                          disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                          active:scale-[0.98] transition-all duration-150`}>
                        <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        Send Code to AI
                      </button>
                      <button onClick={() => setCode(getCodeTemplate(language))}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-medium
                          bg-zinc-50 dark:bg-white/[0.04]
                          text-zinc-700 dark:text-[#8A8F98]
                          border border-zinc-200/60 dark:border-white/[0.06]
                          hover:bg-zinc-100 dark:hover:bg-white/[0.08]
                          hover:text-zinc-900 dark:hover:text-[#EDEDEF]
                          transition-all duration-150`}>
                        Reset Template
                      </button>
                      <div className="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.04]">
                        <p className="text-[11px] text-zinc-500 dark:text-white/30">
                          <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] rounded text-[10px] font-mono shadow-sm">Ctrl+Enter</kbd>
                          {' '}to send code
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Chat + Editor ── */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className={`flex-1 flex min-h-0 gap-4 sm:gap-5 ${layout === 'vertical' ? 'flex-col' : 'flex-col xl:flex-row'}`}>

                {/* ── CHAT PANEL ── */}
                <div className={`${activeTab === 'editor' ? 'hidden xl:flex' : 'flex'} ${layout === 'vertical' ? '' : 'xl:flex-1'} flex-col min-h-0`}>
                  <Panel className={cn(mobile ? 'h-[calc(100vh-280px)] min-h-[400px]' : 'min-h-[500px]')}>
                    {/* Chat Header */}
                    <PanelHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <AIIcon />
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#EDEDEF] tracking-tight">Premium AI Mentor</h3>
                            <p className="text-[11px] text-zinc-500 dark:text-[#8A8F98] hidden sm:block">{selectedModel}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full
                          bg-gradient-to-r from-amber-500/10 to-orange-500/10
                          dark:from-amber-500/[0.08] dark:to-orange-500/[0.06]
                          border border-amber-500/20 dark:border-amber-500/[0.15]`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Online</span>
                        </div>
                      </div>
                    </PanelHeader>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-0">
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'assistant' && <AIIcon />}
                          <div className={`max-w-[85%] sm:max-w-[78%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                            <div className={`px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-white/[0.10] dark:to-white/[0.06] text-white dark:text-[#EDEDEF] border border-zinc-700/50 dark:border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                                : 'bg-zinc-50/80 dark:bg-white/[0.03] text-zinc-900 dark:text-[#EDEDEF] border border-zinc-200/60 dark:border-white/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.04)] dark:shadow-none'
                            }`}>
                              <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: msg.role === 'assistant' ? formatMessageContent(msg.content) : msg.content.replace(/\n/g, '<br>') }} />
                              <div className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/40 dark:text-white/30' : 'text-zinc-400 dark:text-white/25'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          {msg.role === 'user' && (
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-zinc-200 dark:bg-white/[0.08] border border-zinc-300/50 dark:border-white/[0.08] flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-600 dark:text-[#8A8F98]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                          )}
                        </div>
                      ))}
                      {(isLoading || isTyping) && <AILoadingState />}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 sm:p-4 border-t border-zinc-200/60 dark:border-white/[0.06] flex-shrink-0">
                      <AIPromptInput
                        value={userInput}
                        onChange={setUserInput}
                        onSend={sendMessage}
                        isLoading={isLoading}
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                      />
                    </div>
                  </Panel>
                </div>

                {/* ── CODE EDITOR PANEL ── */}
                <div className={`${activeTab === 'chat' ? 'hidden xl:flex' : 'flex'} ${layout === 'vertical' ? '' : 'xl:flex-1'} flex-col min-h-0`}>
                  <Panel className={cn(mobile ? 'h-[calc(100vh-280px)] min-h-[400px]' : 'min-h-[500px]')}>
                    {/* Editor Header */}
                    <PanelHeader>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex-shrink-0
                            bg-zinc-900 dark:bg-white/[0.08]
                            border border-zinc-700/50 dark:border-white/[0.08]
                            flex items-center justify-center`}>
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#EDEDEF] tracking-tight">Code Editor</h3>
                            <p className="text-[11px] text-zinc-500 dark:text-[#8A8F98] hidden sm:block">{languageOptions.find(l => l.value === language)?.label}</p>
                          </div>
                        </div>
                        {/* Mobile editor controls */}
                        <div className="flex items-center gap-1.5 xl:hidden">
                          <select value={language} onChange={e => handleLanguageChange(e.target.value)}
                            className="text-xs px-2 py-1.5 bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.08] rounded-lg text-zinc-800 dark:text-[#EDEDEF] max-w-[90px] sm:max-w-none focus:outline-none">
                            {languageOptions.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                          </select>
                          <button onClick={copyCodeToChat} disabled={!isEditorReady}
                            className={`p-1.5 rounded-lg bg-gradient-to-b from-amber-500 to-orange-600 text-white disabled:opacity-40
                              shadow-[0_0_0_1px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                          </button>
                          <button onClick={() => setCode(getCodeTemplate(language))}
                            className="p-1.5 rounded-lg border border-zinc-200/60 dark:border-white/[0.08] text-zinc-500 dark:text-[#8A8F98] hover:bg-zinc-100 dark:hover:bg-white/[0.05]">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          </button>
                        </div>
                        {/* Desktop ready indicator */}
                        <div className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full
                          bg-zinc-100 dark:bg-white/[0.04]
                          border border-zinc-200/60 dark:border-white/[0.06]`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isEditorReady ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                          <span className="text-[11px] font-medium text-zinc-600 dark:text-[#8A8F98]">{isEditorReady ? 'Ready' : 'Loading'}</span>
                        </div>
                      </div>
                    </PanelHeader>

                    {/* Monaco */}
                    <div ref={editorContainerRef} className="flex-1 relative min-h-0">
                      <MonacoEditor height="100%" language={language} value={code} onChange={v => setCode(v || '')} onMount={handleEditorDidMount} theme={editorTheme} />
                    </div>

                    {/* Editor Footer */}
                    <div className="px-4 py-2 border-t border-zinc-200/60 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.01] flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 dark:text-white/25">
                          <span>{isEditorReady ? 'Ready' : 'Loading'}</span>
                          <span className="hidden sm:inline">·</span>
                          <span className="hidden sm:inline"><kbd className="px-1 py-0.5 bg-white dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] rounded text-[10px] font-mono">Ctrl+Enter</kbd> sends code</span>
                        </div>
                        <span className="hidden md:inline text-[11px] text-zinc-400 dark:text-white/25">Auto-save enabled</span>
                      </div>
                    </div>
                  </Panel>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── MOBILE QUICK ACTIONS DRAWER ────────────────────────────────── */}
      {isSidebarOpen && (
        <div className="xl:hidden fixed inset-0 z-[60] flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <div className={`relative ml-auto w-72 max-w-[85vw] flex flex-col
            bg-white dark:bg-[#0a0a0c]
            border-l border-zinc-200/60 dark:border-white/[0.06]
            shadow-[-8px_0_40px_rgba(0,0,0,0.12)] dark:shadow-[-8px_0_60px_rgba(0,0,0,0.5)]`}>
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-amber-500/20 to-transparent" />
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200/60 dark:border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#EDEDEF] tracking-tight">Quick Actions</h3>
              </div>
              <button onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-zinc-500 dark:text-[#8A8F98] hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
              {quickActions.map((item, i) => (
                <button key={i} onClick={() => { setUserInput(item.action); setActiveTab('chat'); setIsSidebarOpen(false) }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl
                    text-zinc-700 dark:text-[#8A8F98]
                    hover:bg-zinc-100 dark:hover:bg-white/[0.05]
                    hover:text-zinc-900 dark:hover:text-[#EDEDEF]
                    border border-zinc-200/60 dark:border-white/[0.06]
                    transition-all duration-150`}>
                  {item.text}
                </button>
              ))}
            </div>
            <div className="border-t border-zinc-200/60 dark:border-white/[0.06] p-4 space-y-3 flex-shrink-0">
              <div className="text-[10px] font-semibold text-zinc-400 dark:text-white/30 uppercase tracking-[0.12em]">Editor</div>
              <select value={language} onChange={e => handleLanguageChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.08] rounded-xl text-zinc-800 dark:text-[#EDEDEF] focus:outline-none">
                {languageOptions.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <button onClick={() => { copyCodeToChat(); setIsSidebarOpen(false) }} disabled={!isEditorReady}
                className={`group relative w-full px-4 py-2.5 rounded-xl overflow-hidden
                  bg-gradient-to-b from-amber-500 to-orange-600
                  text-white text-sm font-semibold
                  shadow-[0_0_0_1px_rgba(245,158,11,0.3),0_2px_8px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]
                  disabled:opacity-40 disabled:cursor-not-allowed
                  active:scale-[0.98] transition-all duration-150`}>
                <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                Send Code to Chat
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blob-float { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-20px) scale(1.02); } }
        @keyframes blob-float-slow { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-30px); } }
        .animate-blob-float { animation: blob-float 12s ease-in-out infinite; }
        .animate-blob-float-slow { animation: blob-float-slow 16s ease-in-out infinite; }
        [data-dark-fade] { background: linear-gradient(to bottom, transparent 40%, rgba(249,250,251,0.95) 100%); }
        .dark [data-dark-fade] { background: linear-gradient(to bottom, transparent 40%, rgba(10,10,12,0.95) 100%); }
        .overflow-y-auto::-webkit-scrollbar { width: 4px; }
        .overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
        .overflow-y-auto::-webkit-scrollbar-thumb { background: rgba(161,161,170,0.25); border-radius: 2px; }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: rgba(161,161,170,0.45); }
        .monaco-editor, .monaco-editor-background, .monaco-editor .overflow-guard { background: transparent !important; }
        .monaco-editor { width: 100% !important; height: 100% !important; }
      `}</style>
    </div>
  )
}