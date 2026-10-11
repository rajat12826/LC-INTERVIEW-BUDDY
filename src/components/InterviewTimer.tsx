'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Timer, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type TimerMode = 'stopwatch' | 'countdown'

interface TimerPreset {
  label: string
  minutes: number
  mode: TimerMode
}

const PRESETS: TimerPreset[] = [
  { label: 'Stopwatch (Count Up)', minutes: 0, mode: 'stopwatch' },
  { label: '20 min (Easy / Speed)', minutes: 20, mode: 'countdown' },
  { label: '30 min (Standard Medium)', minutes: 30, mode: 'countdown' },
  { label: '45 min (FAANG Mock)', minutes: 45, mode: 'countdown' },
]

export function InterviewTimer() {
  const [mode, setMode] = useState<TimerMode>('stopwatch')
  const [seconds, setSeconds] = useState(0)
  const [targetSeconds, setTargetSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (mode === 'countdown') {
            if (prev <= 1) {
              setIsRunning(false)
              setIsFinished(true)
              return 0
            }
            return prev - 1
          } else {
            return prev + 1
          }
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, mode])

  const togglePlay = () => {
    setIsFinished(false)
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setIsFinished(false)
    if (mode === 'countdown') {
      setSeconds(targetSeconds)
    } else {
      setSeconds(0)
    }
  }

  const selectPreset = (preset: TimerPreset) => {
    setIsRunning(false)
    setIsFinished(false)
    setMode(preset.mode)
    if (preset.mode === 'countdown') {
      const sec = preset.minutes * 60
      setTargetSeconds(sec)
      setSeconds(sec)
    } else {
      setSeconds(0)
      setTargetSeconds(0)
    }
  }

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600)
    const mins = Math.floor((totalSec % 3600) / 60)
    const secs = totalSec % 60

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 shadow-sm">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono font-medium rounded-md hover:bg-white dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-200"
            title="Interview Timer Settings"
          >
            <Timer className={`w-3.5 h-3.5 ${isRunning ? 'text-emerald-500 animate-pulse' : 'text-zinc-400'}`} />
            <span
              className={`tabular-nums ${
                isFinished
                  ? 'text-rose-500 font-bold animate-bounce'
                  : isRunning
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {isFinished ? 'TIME UP!' : formatTime(seconds)}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
          <div className="px-2 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Practice Timer Mode
          </div>
          {PRESETS.map((p) => (
            <DropdownMenuItem
              key={p.label}
              onClick={() => selectPreset(p)}
              className="text-xs cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 flex items-center justify-between"
            >
              <span>{p.label}</span>
              {mode === p.mode && (p.mode === 'stopwatch' || targetSeconds === p.minutes * 60) && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        onClick={togglePlay}
        className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 rounded-md transition-colors"
        title={isRunning ? 'Pause Timer' : 'Start Timer'}
      >
        {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>

      <button
        onClick={resetTimer}
        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 rounded-md transition-colors"
        title="Reset Timer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
