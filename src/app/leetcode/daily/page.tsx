'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowRight, Bot, Check, ChevronDown,
  Zap, Target, Clock, AlertTriangle, Rocket, Lightbulb, X
} from 'lucide-react'
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
import { chatSession } from '@/utils/GeminiAIModel'
import ToggleButton from '@/app/_components/layout/AnimatedDarkModeToggle'

// ─── Types ────────────────────────────────────────────────────────────────────

type Question = {
  questionId: string
  questionFrontendId: string
  title: string
  titleSlug: string
  difficulty: string
  content: string
}

interface DailyLeetCodeResponse {
  date: string
  link: string
  question: Question
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_MODELS = ['Claude 4.5 Sonnet', 'GPT-5', 'GPT-5-mini', 'Gemini 3']

const TASK_SEQUENCES = [
  {
    status: 'Analyzing your question',
    lines: ['Reading your message...', 'Understanding context...', 'Checking problem details...', 'Preparing response...', 'Finalizing answer...'],
  },
  {
    status: 'Reviewing approach',
    lines: ['Parsing algorithm logic...', 'Checking complexity...', 'Reviewing edge cases...', 'Generating feedback...', 'Finalizing review...'],
  },
  {
    status: 'Crafting explanation',
    lines: ['Building explanation...', 'Structuring concepts...', 'Adding examples...', 'Checking clarity...', 'Finalizing response...'],
  },
]

const QUICK_ACTIONS = [
  { icon: <Lightbulb className="w-3.5 h-3.5" />, text: 'Hint',       action: 'Can you give me a strategic hint to get started without spoiling the solution?' },
  { icon: <Target className="w-3.5 h-3.5" />,    text: 'Approach',   action: "What's the best algorithmic approach for this problem? Walk me through the thinking." },
  { icon: <Clock className="w-3.5 h-3.5" />,     text: 'Complexity', action: 'What should the optimal time and space complexity be for this problem?' },
  { icon: <AlertTriangle className="w-3.5 h-3.5" />, text: 'Edge Cases', action: 'What important edge cases should I consider and test for?' },
  { icon: <Rocket className="w-3.5 h-3.5" />,    text: 'Optimize',   action: 'How can I optimize my current solution further?' },
  { icon: <Zap className="w-3.5 h-3.5" />,       text: 'Walk-through', action: 'Can you walk me through the problem step by step without giving away the full solution?' },
]

// ─── Model Icons ──────────────────────────────────────────────────────────────

const OpenAIIcon = () => (
  <>
    <svg className="block dark:hidden w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 256 260" xmlns="http://www.w3.org/2000/svg">
      <path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Z" />
    </svg>
    <svg className="hidden dark:block w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 256 260" xmlns="http://www.w3.org/2000/svg">
      <path fill="#fff" d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Z" />
    </svg>
  </>
)

const GeminiIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gem-grad-dt" x1="0%" x2="68.73%" y1="100%" y2="30.395%">
        <stop offset="0%" stopColor="#1C7DFF" />
        <stop offset="52.021%" stopColor="#1C69FF" />
        <stop offset="100%" stopColor="#F0DCD6" />
      </linearGradient>
    </defs>
    <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12" fill="url(#gem-grad-dt)" fillRule="nonzero" />
  </svg>
)

const ClaudeIcon = () => (
  <>
    <svg className="block dark:hidden w-3.5 h-3.5 flex-shrink-0" fill="#000" fillRule="evenodd" viewBox="0 0 24 24">
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
    </svg>
    <svg className="hidden dark:block w-3.5 h-3.5 flex-shrink-0" fill="#fff" fillRule="evenodd" viewBox="0 0 24 24">
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
    </svg>
  </>
)

const MODEL_ICONS: Record<string, React.ReactNode> = {
  'Claude 4.5 Sonnet': <ClaudeIcon />,
  'GPT-5':             <OpenAIIcon />,
  'GPT-5-mini':        <OpenAIIcon />,
  'Gemini 3':          <GeminiIcon />,
}

// ─── AIIcon ───────────────────────────────────────────────────────────────────

const AIIcon = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
  <div className={cn(
    'rounded-xl flex-shrink-0 flex items-center justify-center',
    'bg-gradient-to-br from-[#5E6AD2] to-[#4B57C5]',
    'shadow-[0_0_0_1px_rgba(94,106,210,0.35),0_2px_8px_rgba(94,106,210,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]',
    size === 'sm' ? 'w-7 h-7' : 'w-8 h-8 sm:w-9 sm:h-9'
  )}>
    <svg
      className={cn('text-white', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-[18px] sm:h-[18px]')}
      fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  </div>
)

// ─── Panel primitives ─────────────────────────────────────────────────────────

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'rounded-2xl overflow-hidden flex flex-col',
      'bg-white dark:bg-[#0a0a0c]',
      'border border-zinc-200/70 dark:border-white/[0.06]',
      'shadow-[0_2px_24px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.02)]',
      'dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_40px_rgba(0,0,0,0.45)]',
      className
    )}>
      {children}
    </div>
  )
}

function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative px-4 sm:px-5 py-3.5 sm:py-4 flex-shrink-0
      bg-zinc-50/80 dark:bg-white/[0.02]
      border-b border-zinc-200/70 dark:border-white/[0.06]">
      <div className="absolute top-0 left-0 right-0 h-px
        bg-gradient-to-r from-transparent via-[#5E6AD2]/30 to-transparent" />
      {children}
    </div>
  )
}

// ─── AI Loading State ─────────────────────────────────────────────────────────

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
    }, 1800)
    return () => clearInterval(t)
  }, [scrollPos, lines, total, seqIdx, seq.lines])

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = scrollPos
  }, [scrollPos])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-2.5 sm:gap-3"
    >
      <AIIcon size="sm" />
      <div className="rounded-xl border border-zinc-200/60 dark:border-white/[0.06]
        bg-zinc-50/80 dark:bg-white/[0.03] p-3 min-w-0
        shadow-[0_1px_4px_rgba(0,0,0,0.04)] dark:shadow-none">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-[3px]">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-[#5E6AD2]"
                style={{ animation: `dt-bounce 1.2s ease-in-out ${i * 0.15}s infinite` }}
              />
            ))}
          </div>
          <span className="text-[11px] font-medium text-zinc-500 dark:text-[#8A8F98] tracking-wide">
            {seq.status}...
          </span>
        </div>
        <div className="relative">
          <div
            ref={containerRef}
            className="font-mono text-xs overflow-hidden w-full h-[56px] rounded-lg"
            style={{ scrollBehavior: 'smooth' }}
          >
            {lines.map(l => (
              <div key={`${l.number}-${l.text}`} className="flex h-[28px] items-center px-2">
                <span className="text-zinc-400/40 dark:text-white/20 pr-3 select-none w-6 text-right tabular-nums">
                  {l.number}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400 flex-1 ml-1">{l.text}</span>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 pointer-events-none rounded-lg dt-code-fade" />
        </div>
      </div>
    </motion.div>
  )
}

// ─── AI Prompt Input ──────────────────────────────────────────────────────────

interface AIPromptInputProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  isLoading: boolean
  selectedModel: string
  onModelChange: (m: string) => void
}

function AIPromptInput({ value, onChange, onSend, isLoading, selectedModel, onModelChange }: AIPromptInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 68, maxHeight: 280 })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading) { onSend(); adjustHeight(true) }
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden
      bg-zinc-100/60 dark:bg-white/[0.04]
      border border-zinc-200/70 dark:border-white/[0.07]
      transition-all duration-200
      focus-within:border-[#5E6AD2]/40 dark:focus-within:border-[#5E6AD2]/25
      focus-within:shadow-[0_0_0_3px_rgba(94,106,210,0.08)]
      dark:focus-within:shadow-[0_0_0_1px_rgba(94,106,210,0.15)]">

      {/* Hint row */}
      <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClaudeIcon />
          <span className="text-[11px] font-medium text-zinc-500 dark:text-[#8A8F98] tracking-tight">
            Ask your AI tutor anything
          </span>
        </div>
        <span className="hidden sm:block text-[10px] text-zinc-400 dark:text-white/25 font-mono">
          Shift+Enter ↵
        </span>
      </div>

      {/* Textarea */}
      <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={e => { onChange(e.target.value); adjustHeight() }}
          onKeyDown={handleKeyDown}
          placeholder="Ask for a hint, explain your approach, or request a concept walkthrough..."
          disabled={isLoading}
          className={cn(
            'w-full resize-none border-none rounded-none bg-transparent',
            'px-4 py-2 min-h-[68px]',
            'placeholder:text-zinc-400 dark:placeholder:text-white/25',
            'text-zinc-900 dark:text-[#EDEDEF] text-sm leading-relaxed',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
            'disabled:opacity-50'
          )}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2
        border-t border-zinc-200/50 dark:border-white/[0.04]
        bg-zinc-50/60 dark:bg-white/[0.015]">

        {/* Model picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs
              hover:bg-zinc-200/60 dark:hover:bg-white/[0.06]
              text-zinc-600 dark:text-[#8A8F98]
              focus-visible:ring-1 focus-visible:ring-[#5E6AD2]/50 focus-visible:ring-offset-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedModel}
                  className="flex items-center gap-1.5"
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 3 }}
                  transition={{ duration: 0.1 }}>
                  {MODEL_ICONS[selectedModel]}
                  <span className="hidden xs:inline font-medium">{selectedModel}</span>
                  <ChevronDown className="h-2.5 w-2.5 opacity-40" />
                </motion.div>
              </AnimatePresence>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[11rem]
            border-zinc-200/60 dark:border-white/[0.08]
            bg-white dark:bg-[#0a0a0c]
            shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]
            dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_40px_rgba(0,0,0,0.5)]">
            {AI_MODELS.map(model => (
              <DropdownMenuItem
                key={model}
                className="flex items-center justify-between gap-2
                  text-zinc-700 dark:text-[#EDEDEF]
                  hover:bg-zinc-100 dark:hover:bg-white/[0.06]
                  focus:bg-zinc-100 dark:focus:bg-white/[0.06] cursor-pointer"
                onSelect={() => onModelChange(model)}>
                <div className="flex items-center gap-2">
                  {MODEL_ICONS[model] ?? <Bot className="h-3.5 w-3.5 opacity-40" />}
                  <span className="text-sm">{model}</span>
                </div>
                {selectedModel === model && <Check className="h-3 w-3 text-[#5E6AD2]" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Send */}
        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || isLoading}
          className={cn(
            'group relative overflow-hidden rounded-lg px-3 py-1.5',
            'flex items-center gap-1.5 text-xs font-semibold',
            'bg-gradient-to-b from-[#5E6AD2] to-[#4B57C5] text-white',
            'shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_2px_8px_rgba(94,106,210,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]',
            'hover:shadow-[0_0_0_1px_rgba(94,106,210,0.65),0_4px_16px_rgba(94,106,210,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]',
            'active:scale-[0.97] active:shadow-none',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100',
            'transition-all duration-150'
          )}>
          <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%]
            transition-transform duration-500
            bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          {isLoading
            ? <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            : <><span>Send</span><ArrowRight className="h-3 w-3" /></>
          }
        </button>
      </div>
    </div>
  )
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const cfg = {
    easy:   { bg: 'bg-emerald-100 dark:bg-emerald-500/[0.08]', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
    medium: { bg: 'bg-amber-100 dark:bg-amber-500/[0.08]',     text: 'text-amber-700 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-500/20',   dot: 'bg-amber-500' },
    hard:   { bg: 'bg-rose-100 dark:bg-rose-500/[0.08]',       text: 'text-rose-700 dark:text-rose-400',       border: 'border-rose-200 dark:border-rose-500/20',     dot: 'bg-rose-500' },
  }[difficulty?.toLowerCase() ?? 'medium'] ?? {
    bg: 'bg-zinc-100 dark:bg-white/[0.05]', text: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-200 dark:border-white/[0.08]', dot: 'bg-zinc-400'
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border', cfg.bg, cfg.text, cfg.border)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {difficulty}
    </span>
  )
}

// ─── Message formatting ───────────────────────────────────────────────────────

const CODE_BLOCK_HTML =
  '<div class="my-3 rounded-xl border border-zinc-200/60 dark:border-white/[0.06] overflow-hidden">' +
  '<div class="bg-zinc-100 dark:bg-white/[0.04] px-3.5 py-2 text-[11px] font-mono text-zinc-500 dark:text-[#8A8F98] border-b border-zinc-200/60 dark:border-white/[0.06] tracking-wide uppercase">$1</div>' +
  '<pre class="bg-zinc-50 dark:bg-[#050506] p-4 overflow-x-auto m-0">' +
  '<code class="text-xs text-zinc-800 dark:text-zinc-300 font-mono leading-relaxed">$2</code></pre></div>'

function formatMessage(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-zinc-900 dark:text-[#EDEDEF]">$1</strong>')
    .replace(/```(\w+)?\n([\s\S]*?)\n?```/g, CODE_BLOCK_HTML)
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-zinc-100 dark:bg-white/[0.08] text-zinc-800 dark:text-zinc-200 rounded text-xs font-mono border border-zinc-200/50 dark:border-white/[0.06]">$1</code>')
    .replace(/^• (.*$)/gim,
      '<div class="flex items-start gap-2 mb-1.5">' +
      '<span class="mt-[7px] w-1 h-1 rounded-full bg-[#5E6AD2]/50 flex-shrink-0"></span>' +
      '<span class="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">$1</span></div>'
    )
    .replace(/^(\d+)\. (.*$)/gim,
      '<div class="flex items-start gap-2.5 mb-2">' +
      '<span class="flex items-center justify-center min-w-[18px] h-[18px] rounded-md bg-[#5E6AD2]/10 dark:bg-[#5E6AD2]/[0.15] text-[#5E6AD2] text-[10px] font-bold border border-[#5E6AD2]/20 flex-shrink-0 mt-0.5">$1</span>' +
      '<span class="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">$2</span></div>'
    )
    .replace(/^> (.*$)/gim,
      '<div class="border-l-2 border-[#5E6AD2]/40 bg-indigo-50/60 dark:bg-[#5E6AD2]/[0.05] pl-4 py-2.5 my-3 rounded-r-xl">' +
      '<span class="text-zinc-700 dark:text-zinc-300 text-sm italic">$1</span></div>'
    )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn('flex gap-2.5 sm:gap-3', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && <AIIcon size="sm" />}

      <div className={cn('max-w-[88%] sm:max-w-[82%]', isUser && 'order-1')}>
        <div className={cn(
          'px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl',
          isUser
            ? 'bg-gradient-to-br from-[#5E6AD2] to-[#4B57C5] text-white shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_16px_rgba(94,106,210,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]'
            : 'bg-zinc-50/90 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.05)] dark:shadow-none'
        )}>
          {isUser
            ? <p className="text-sm leading-relaxed text-white whitespace-pre-wrap break-words">{message.content}</p>
            : <div
                className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
              />
          }
          <p className={cn('text-[10px] mt-2 select-none tabular-nums', isUser ? 'text-indigo-200/70' : 'text-zinc-400 dark:text-white/25')}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-xl bg-zinc-200 dark:bg-white/[0.08]
          border border-zinc-300/50 dark:border-white/[0.08]
          flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-[#8A8F98]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DailyAITutorPage() {
  const router = useRouter()

  const [question, setQuestion]           = useState<Question | null>(null)
  const [messages, setMessages]           = useState<ChatMessage[]>([])
  const [userInput, setUserInput]         = useState('')
  const [isLoading, setIsLoading]         = useState(false)
  const [isTyping, setIsTyping]           = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [dailyProblemLink, setDailyProblemLink] = useState<string | null>(null)
  const [fetchError, setFetchError]       = useState(false)
  const [selectedModel, setSelectedModel] = useState('Claude 4.5 Sonnet')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(() => {
    async function fetchDailyQuestion() {
      setIsLoading(true)
      try {
        const res = await fetch('/api/daily-leetcode')
        if (!res.ok) throw new Error('Failed to fetch')
        const data: DailyLeetCodeResponse = await res.json()
        const fullLink = `https://leetcode.com${data.link}`
        setDailyProblemLink(fullLink)
        const q: Question = {
          questionId:         data.question.questionId,
          questionFrontendId: data.question.questionFrontendId,
          title:              data.question.title,
          titleSlug:          data.question.titleSlug,
          difficulty:         data.question.difficulty,
          content:            data.question.content,
        }
        setQuestion(q)
        setMessages([{
          role: 'assistant',
          content:
            `Welcome to today's Daily Challenge session.\n\n` +
            `I'll be your guide for **"${q.title}"** — a **${q.difficulty}** level problem.\n\n` +
            `**What I can help with:**\n` +
            `• Understand the problem requirements deeply\n` +
            `• Explore different algorithmic approaches\n` +
            `• Analyze time & space complexity trade-offs\n` +
            `• Identify and handle tricky edge cases\n` +
            `• Review and optimize your solution\n\n` +
            `Share your thoughts, ask for a hint, or tell me where you'd like to start!`,
          timestamp: new Date(),
        }])
      } catch {
        setFetchError(true)
        setMessages([{
          role: 'assistant',
          content: "Failed to load today's LeetCode problem. Please try refreshing the page.",
          timestamp: new Date(),
        }])
      } finally {
        setIsLoading(false)
      }
    }
    fetchDailyQuestion()
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, isTyping])

  const sendMessage = useCallback(async () => {
    if (!userInput.trim() || !question) return
    const userMsg: ChatMessage = { role: 'user', content: userInput, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setUserInput('')
    setIsLoading(true)
    setIsTyping(true)
    try {
      const context =
        `You are an expert AI tutor helping with the LeetCode problem "${question.title}".` +
        `\nDifficulty: ${question.difficulty}` +
        `\nProblem content: ${question.content}` +
        `\nProblem URL: ${dailyProblemLink}` +
        `\n\nGuide the student educationally without revealing the full solution immediately.` +
        `\nExplain concepts, suggest approaches, help them think through the problem.` +
        `\nFormat with markdown: **bold**, \`code\`, numbered lists, bullets, > tips.` +
        `\n\nConversation so far:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}` +
        `\n\nStudent: ${userInput}`
      const result = await chatSession.sendMessage(context)
      const text = result.response.text()
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: text, timestamp: new Date() }])
        setIsTyping(false)
      }, 400)
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error. Please try again.',
        timestamp: new Date(),
      }])
      setIsTyping(false)
    } finally {
      setIsLoading(false)
    }
  }, [userInput, question, messages, dailyProblemLink])

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (!question && !fetchError) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050506] flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none hidden dark:block overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-[#5E6AD2]/[0.07] blur-[140px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-5 px-4"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-[#5E6AD2]/20 blur-[24px]" />
            <div className={`relative w-16 h-16 rounded-2xl
              bg-gradient-to-br from-[#5E6AD2] to-[#4B57C5]
              shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_24px_rgba(94,106,210,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]
              flex items-center justify-center`}>
              <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-[#EDEDEF] tracking-tight mb-1.5">
              Loading Daily Challenge
            </h2>
            <p className="text-sm text-zinc-500 dark:text-[#8A8F98]">Fetching today's LeetCode problem...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────────

  if (fetchError && !question) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050506] flex items-center justify-center p-4">
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-0 rounded-3xl bg-rose-500/10 blur-[40px]" />
          <div className={`relative rounded-2xl overflow-hidden
            bg-white dark:bg-[#0a0a0c]
            border border-zinc-200/60 dark:border-white/[0.06]
            shadow-[0_2px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_40px_rgba(0,0,0,0.5)]`}>
            <div className="h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
            <div className="px-8 py-12 text-center space-y-5">
              <div className={`inline-flex w-14 h-14 rounded-2xl items-center justify-center
                bg-gradient-to-br from-rose-500 to-red-600
                shadow-[0_0_0_1px_rgba(239,68,68,0.3),0_4px_16px_rgba(239,68,68,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]`}>
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-[#EDEDEF] tracking-tight mb-1.5">Failed to Load</h3>
                <p className="text-sm text-zinc-500 dark:text-[#8A8F98] leading-relaxed">
                  Could not fetch today's problem. Check your connection and try again.
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className={`w-full px-5 py-2.5 rounded-xl text-sm font-semibold
                  bg-gradient-to-b from-[#5E6AD2] to-[#4B57C5] text-white
                  shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_2px_8px_rgba(94,106,210,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]
                  hover:shadow-[0_0_0_1px_rgba(94,106,210,0.55),0_4px_16px_rgba(94,106,210,0.3)]
                  active:scale-[0.98] transition-all duration-150`}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Main ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050506] flex flex-col">

      {/* ── Background (dark mode only) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Radial depth gradient */}
        <div className={`hidden dark:block absolute inset-0
          bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]`} />

        {/* Floating ambient blobs */}
        <div className={`hidden dark:block absolute top-[-8%] left-1/2 -translate-x-[40%]
          w-[900px] h-[500px] rounded-full bg-[#5E6AD2]/[0.08] blur-[150px] dt-blob-1`} />
        <div className={`hidden dark:block absolute bottom-[5%] right-[2%]
          w-[600px] h-[400px] rounded-full bg-indigo-600/[0.05] blur-[120px] dt-blob-2`} />
        <div className={`hidden dark:block absolute top-[35%] left-[-5%]
          w-[500px] h-[400px] rounded-full bg-purple-700/[0.04] blur-[100px] dt-blob-3`} />

        {/* Noise */}
        <div className="absolute inset-0 opacity-[0.018] dark:opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '256px',
          }} />

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(94,106,210,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(94,106,210,0.4) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }} />
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className={`relative z-50 sticky top-0
        border-b border-zinc-200/70 dark:border-white/[0.06]
        bg-white/80 dark:bg-[#050506]/90 backdrop-blur-xl flex-shrink-0
        shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:shadow-none`}>
        <div className={`absolute bottom-0 left-0 right-0 h-px
          bg-gradient-to-r from-transparent via-[#5E6AD2]/12 to-transparent`} />

        <div className={`max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-3.5`}>
          <div className="flex items-center justify-between gap-3">

            {/* Left */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => router.back()}
                className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg
                  text-xs sm:text-sm font-medium
                  text-zinc-600 dark:text-[#8A8F98]
                  hover:bg-zinc-100 dark:hover:bg-white/[0.05]
                  hover:text-zinc-900 dark:hover:text-[#EDEDEF]
                  border border-transparent hover:border-zinc-200/60 dark:hover:border-white/[0.06]
                  active:scale-[0.97] transition-all duration-150 flex-shrink-0`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Back to Problems</span>
                <span className="sm:hidden">Back</span>
              </button>

              <div className="hidden md:block h-4 w-px bg-zinc-200 dark:bg-white/[0.08]" />

              {/* Daily badge */}
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full
                bg-[#5E6AD2]/[0.07] dark:bg-[#5E6AD2]/[0.10]
                border border-[#5E6AD2]/[0.12] dark:border-[#5E6AD2]/[0.15]`}>
                <div className="w-1 h-1 rounded-full bg-[#5E6AD2] animate-pulse" />
                <span className="text-[11px] font-semibold tracking-[0.08em] text-[#5E6AD2] dark:text-indigo-300">
                  Daily Challenge
                </span>
              </div>

              {question && (
                <span className="hidden lg:block text-sm font-medium text-zinc-500 dark:text-[#8A8F98] truncate max-w-xs">
                  {question.title}
                </span>
              )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full
                bg-emerald-50 dark:bg-emerald-500/[0.06]
                border border-emerald-200/60 dark:border-emerald-500/[0.12]`}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">AI Active</span>
              </div>

              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`lg:hidden p-2 rounded-lg
                  text-zinc-600 dark:text-[#8A8F98]
                  hover:bg-zinc-100 dark:hover:bg-white/[0.05]
                  border border-transparent hover:border-zinc-200/60 dark:hover:border-white/[0.06]
                  transition-all duration-150`}>
                <Zap className="w-4 h-4" />
              </button>
 <ToggleButton/>
              {dailyProblemLink && (
                <a
                  href={dailyProblemLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl overflow-hidden
                    bg-gradient-to-b from-[#5E6AD2] to-[#4B57C5] text-white
                    text-xs sm:text-sm font-semibold
                    shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_2px_8px_rgba(94,106,210,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]
                    hover:shadow-[0_0_0_1px_rgba(94,106,210,0.65),0_4px_20px_rgba(94,106,210,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]
                    active:scale-[0.97] transition-all duration-150`}>
                  <span className={`absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%]
                    transition-transform duration-500
                    bg-gradient-to-r from-transparent via-white/20 to-transparent`} />
                  <span className="hidden sm:inline">View Problem</span>
                  <span className="sm:hidden">View</span>
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ───────────────────────────────────────────────────────── */}
      <main className={`relative z-10 flex-1 flex flex-col min-h-0
        max-w-[1400px] mx-auto w-full
        px-3 sm:px-5 lg:px-8 py-4 sm:py-5 lg:py-6`}>

        {/* Problem header */}
        {question && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4 sm:mb-5 flex-shrink-0"
          >
            <div className={`rounded-2xl overflow-hidden
              bg-white dark:bg-[#0a0a0c]
              border border-zinc-200/70 dark:border-white/[0.06]
              shadow-[0_2px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_32px_rgba(0,0,0,0.4)]`}>
              <div className="h-px bg-gradient-to-r from-transparent via-[#5E6AD2]/35 to-transparent" />
              <div className="px-4 sm:px-6 py-4 sm:py-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-mono font-semibold tracking-[0.14em] uppercase text-zinc-400 dark:text-white/30">
                        #{question.questionFrontendId}
                      </span>
                      <span className="text-[10px] text-zinc-300 dark:text-white/15">·</span>
                      <span className="text-[10px] font-mono font-semibold tracking-[0.14em] uppercase text-[#5E6AD2]/60 dark:text-indigo-400/60">
                        Daily Problem
                      </span>
                    </div>

                    <h1 className="text-lg sm:text-2xl lg:text-[1.75rem] font-bold tracking-tight leading-tight text-zinc-900 dark:text-[#EDEDEF] mb-3">
                      {question.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-2">
                      <DifficultyBadge difficulty={question.difficulty} />
                      {dailyProblemLink && (
                        <a
                          href={dailyProblemLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                            text-[11px] font-medium
                            text-zinc-500 dark:text-[#8A8F98]
                            bg-zinc-100 dark:bg-white/[0.04]
                            border border-zinc-200/60 dark:border-white/[0.06]
                            hover:text-[#5E6AD2] dark:hover:text-indigo-300
                            hover:border-[#5E6AD2]/30 dark:hover:border-[#5E6AD2]/20
                            transition-all duration-150`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          LeetCode
                        </a>
                      )}
                    </div>
                  </div>

                  <div className={`hidden sm:flex w-12 h-12 rounded-2xl items-center justify-center flex-shrink-0
                    bg-[#5E6AD2]/[0.06] dark:bg-[#5E6AD2]/[0.07]
                    border border-[#5E6AD2]/[0.10] dark:border-[#5E6AD2]/[0.09]`}>
                    <svg className="w-5 h-5 text-[#5E6AD2]/50 dark:text-[#5E6AD2]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Content grid */}
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-4 sm:gap-5">

            {/* Desktop sidebar */}
            <div className="hidden lg:flex flex-col flex-shrink-0 w-56 xl:w-60">
              <div className={`rounded-2xl overflow-hidden
                bg-white dark:bg-[#0a0a0c]
                border border-zinc-200/70 dark:border-white/[0.06]
                shadow-[0_2px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_32px_rgba(0,0,0,0.4)]
                sticky top-[72px] max-h-[calc(100vh-7rem)] overflow-y-auto`}>
                <div className="h-px bg-gradient-to-r from-transparent via-[#5E6AD2]/20 to-transparent" />
                <div className="p-4">
                  <p className="text-[10px] font-semibold text-zinc-400 dark:text-white/30 uppercase tracking-[0.14em] mb-3">
                    Quick Actions
                  </p>
                  <div className="space-y-1">
                    {QUICK_ACTIONS.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => setUserInput(item.action)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium rounded-xl
                          text-zinc-600 dark:text-[#8A8F98]
                          hover:bg-zinc-100 dark:hover:bg-white/[0.05]
                          hover:text-zinc-900 dark:hover:text-[#EDEDEF]
                          border border-zinc-200/60 dark:border-white/[0.06]
                          hover:border-zinc-300/70 dark:hover:border-white/[0.10]
                          active:scale-[0.98] transition-all duration-150 group text-left`}>
                        <span className="text-zinc-400 dark:text-white/25 group-hover:text-[#5E6AD2] dark:group-hover:text-indigo-400 transition-colors flex-shrink-0">
                          {item.icon}
                        </span>
                        {item.text}
                      </button>
                    ))}
                  </div>

                  <div className="my-4 h-px bg-zinc-100 dark:bg-white/[0.04]" />

                  <p className="text-[10px] font-semibold text-zinc-400 dark:text-white/30 uppercase tracking-[0.14em] mb-3">
                    Session
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Messages',   value: messages.length.toString() },
                      { label: 'Difficulty', value: question?.difficulty ?? '—', colored: true },
                      { label: 'Model',      value: selectedModel.split(' ')[0] },
                    ].map(({ label, value, colored }) => (
                      <div key={label}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl
                          bg-zinc-50 dark:bg-white/[0.02]
                          border border-zinc-100 dark:border-white/[0.04]`}>
                        <span className="text-[11px] text-zinc-500 dark:text-[#8A8F98]">{label}</span>
                        <span className={cn(
                          'text-[11px] font-semibold',
                          colored
                            ? (
                                question?.difficulty === 'Easy'   ? 'text-emerald-600 dark:text-emerald-400' :
                                question?.difficulty === 'Medium' ? 'text-amber-600 dark:text-amber-400' :
                                question?.difficulty === 'Hard'   ? 'text-rose-600 dark:text-rose-400' :
                                'text-zinc-700 dark:text-[#EDEDEF]'
                              )
                            : 'text-zinc-700 dark:text-[#EDEDEF]'
                        )}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat panel */}
            <div className="flex-1 flex flex-col min-h-0">

              {/* Mobile quick-action pills */}
              <div className="lg:hidden mb-2.5 flex gap-1.5 overflow-x-auto pb-0.5 dt-no-scrollbar">
                {QUICK_ACTIONS.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setUserInput(item.action)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
                      bg-white dark:bg-white/[0.04]
                      border border-zinc-200/60 dark:border-white/[0.06]
                      text-zinc-600 dark:text-[#8A8F98]
                      hover:bg-zinc-100 dark:hover:bg-white/[0.08]
                      hover:text-zinc-900 dark:hover:text-[#EDEDEF]
                      shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none
                      active:scale-[0.97] transition-all duration-150 whitespace-nowrap`}>
                    <span className="text-[#5E6AD2]">{item.icon}</span>
                    {item.text}
                  </button>
                ))}
              </div>

              <Panel className="flex-1 min-h-[480px] sm:min-h-[560px]">

                {/* Chat header */}
                <PanelHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <AIIcon />
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#EDEDEF] tracking-tight leading-none mb-0.5">
                          AI Tutor
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-[#8A8F98] hidden sm:block">
                          {selectedModel}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full
                      bg-emerald-50 dark:bg-emerald-500/[0.06]
                      border border-emerald-200/60 dark:border-emerald-500/[0.12]`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Online</span>
                    </div>
                  </div>
                </PanelHeader>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-4 lg:px-5 py-4 sm:py-5 space-y-3.5 dt-chat-scroll">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                      <MessageBubble key={i} message={msg} />
                    ))}
                  </AnimatePresence>
                  {(isLoading || isTyping) && <AILoadingState />}
                  <div ref={messagesEndRef} className="h-1" />
                </div>

                {/* Input */}
                <div className={`p-3 sm:p-4 border-t border-zinc-200/60 dark:border-white/[0.06] flex-shrink-0
                  bg-white/60 dark:bg-transparent`}>
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
          </div>
        </div>
      </main>

      {/* ── MOBILE DRAWER ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`lg:hidden fixed inset-y-0 right-0 z-[61]
                w-64 max-w-[82vw] flex flex-col
                bg-white dark:bg-[#0a0a0c]
                border-l border-zinc-200/70 dark:border-white/[0.06]
                shadow-[-12px_0_48px_rgba(0,0,0,0.12)]
                dark:shadow-[-12px_0_60px_rgba(0,0,0,0.55)]`}>
              <div className={`absolute inset-y-0 left-0 w-px
                bg-gradient-to-b from-transparent via-[#5E6AD2]/15 to-transparent`} />

              <div className={`flex items-center justify-between px-5 py-4
                border-b border-zinc-200/60 dark:border-white/[0.06] flex-shrink-0`}>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#5E6AD2]" />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-[#EDEDEF] tracking-tight">
                    Quick Actions
                  </span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className={`p-1.5 rounded-lg text-zinc-500 dark:text-[#8A8F98]
                    hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all`}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                {QUICK_ACTIONS.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { setUserInput(item.action); setIsSidebarOpen(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                      text-zinc-700 dark:text-[#8A8F98]
                      hover:bg-zinc-100 dark:hover:bg-white/[0.05]
                      hover:text-zinc-900 dark:hover:text-[#EDEDEF]
                      border border-zinc-200/60 dark:border-white/[0.06]
                      hover:border-zinc-300 dark:hover:border-white/[0.10]
                      active:scale-[0.98] transition-all duration-150 group`}>
                    <span className="text-zinc-400 dark:text-white/30 group-hover:text-[#5E6AD2] dark:group-hover:text-indigo-400 transition-colors">
                      {item.icon}
                    </span>
                    {item.text}
                  </button>
                ))}
              </div>

              <div className="border-t border-zinc-200/60 dark:border-white/[0.06] p-4 flex-shrink-0 space-y-1.5">
                {[
                  { label: 'Model',      value: selectedModel.split(' ').slice(0, 2).join(' ') },
                  { label: 'Difficulty', value: question?.difficulty ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl
                      bg-zinc-50 dark:bg-white/[0.02]
                      border border-zinc-100 dark:border-white/[0.04]`}>
                    <span className="text-[11px] text-zinc-500 dark:text-[#8A8F98]">{label}</span>
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-[#EDEDEF]">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Styles ─────────────────────────────────────────────────────── */}
      <style jsx>{`
        @keyframes dt-float-1  { 0%,100%{ transform:translateY(0px) rotate(0deg) scale(1);    } 50%{ transform:translateY(-22px) rotate(1deg) scale(1.02); } }
        @keyframes dt-float-2  { 0%,100%{ transform:translateY(0px) rotate(0deg);              } 50%{ transform:translateY(-30px) rotate(-1deg);             } }
        @keyframes dt-float-3  { 0%,100%{ transform:translateY(0px); } 33%{ transform:translateY(-14px); } 66%{ transform:translateY(-24px); } }
        @keyframes dt-bounce   { 0%,80%,100%{ transform:scale(0) translateY(0); opacity:0.4; } 40%{ transform:scale(1) translateY(-4px); opacity:1; } }

        .dt-blob-1 { animation: dt-float-1 12s ease-in-out infinite; }
        .dt-blob-2 { animation: dt-float-2 16s ease-in-out infinite; }
        .dt-blob-3 { animation: dt-float-3 20s ease-in-out infinite; }

        .dt-code-fade { background: linear-gradient(to bottom, transparent 30%, rgba(249,250,251,0.97) 100%); }
        :global(.dark) .dt-code-fade { background: linear-gradient(to bottom, transparent 30%, rgba(10,10,12,0.97) 100%); }

        .dt-no-scrollbar::-webkit-scrollbar { display: none; }
        .dt-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .dt-chat-scroll::-webkit-scrollbar { width: 3px; }
        .dt-chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .dt-chat-scroll::-webkit-scrollbar-thumb { background: rgba(161,161,170,0.2); border-radius: 99px; }
        .dt-chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(161,161,170,0.4); }
        :global(.dark) .dt-chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); }
        :global(.dark) .dt-chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
      `}</style>
    </div>
  )
}