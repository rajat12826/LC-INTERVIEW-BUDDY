'use client'

import { SignIn } from '@clerk/nextjs'
import { dark as clerkDark } from '@clerk/themes'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Page() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const isDark = mounted ? resolvedTheme === 'dark' : false

  /* ── Shared logo mark ── */
  const LogoMark = () => (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,#5E6AD2,#6872D9)', boxShadow: '0 0 0 1px rgba(94,106,210,0.4),0 4px 12px rgba(94,106,210,0.3)' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 3h4v4H3V3zm6 0h4v4H9V3zM3 9h4v4H3V9zm6 2l2-2 2 2-2 2-2-2z" fill="white" fillOpacity="0.9"/>
        </svg>
      </div>
      <span className={`text-sm font-mono tracking-widest uppercase ${isDark ? 'text-white/40' : 'text-[#5E6AD2]/60'}`}>
        LCBuddy
      </span>
    </Link>
  )

  /* ── Shared heading content ── */
  const HeadingContent = () => (
    <>
      <h1 className={`text-4xl sm:text-5xl font-semibold tracking-tight leading-tight bg-clip-text text-transparent ${
        isDark
          ? 'bg-gradient-to-b from-[#EDEDEF] to-[rgba(237,237,239,0.7)] text-white'
          : 'bg-gradient-to-b from-[#1a1a2e] to-[#1a1a2e]/60'
      }`}>
        Interview Buddy
      </h1>
      <p className={`text-base leading-relaxed mt-3 ${isDark ? 'text-[#8A8F98]' : 'text-gray-500'}`}>
        Practice top LeetCode-style problems with your{' '}
        <span className="shimmer-shared font-medium">AI tutor</span>{' '}
        and ace your next technical interview.
      </p>
    </>
  )

  /* ── Shared Clerk appearance: light ── */
  const lightAppearance = {
    layout: { logoPlacement: 'none' as const },
    variables: {
      colorBackground: 'transparent',
      colorInputBackground: '#ffffff',
      colorInputText: '#111827',
      colorText: '#111827',
      colorTextSecondary: '#6b7280',
      colorPrimary: '#16328b',
      colorDanger: '#ef4444',
      borderRadius: '8px',
      fontFamily: 'inherit',
    },
    elements: {
      rootBox: 'w-full',
      card: 'shadow-none',
      footer: '!bg-transparent',
      footerAction: '!bg-transparent',
      footerPages: '!bg-transparent',
    },
  }

  /* ── Shared Clerk appearance: dark ── */
  const darkAppearance = {
    baseTheme: clerkDark,
    layout: { logoPlacement: 'none' as const },
    variables: {
      colorBackground: '#050506',
      colorInputBackground: '#0F0F12',
      colorInputText: '#EDEDEF',
      colorText: '#EDEDEF',
      colorTextSecondary: '#8A8F98',
      colorPrimary: '#5E6AD2',
      colorDanger: '#f87171',
      colorNeutral: '#8A8F98',
      borderRadius: '8px',
      fontFamily: 'inherit',
    },
    elements: {
      rootBox: 'w-full',
      card: 'shadow-none !bg-transparent',
      footer: '!bg-[#050506]',
      footerAction: '!bg-[#050506]',
      footerPages: '!bg-[#050506]',
    },
  }

  return (
    <div className={`relative min-h-screen overflow-hidden flex items-center justify-center ${
      isDark ? 'bg-[#050506]' : 'bg-gradient-to-br from-gray-50 via-white to-blue-50/30'
    }`}>

      {/* ── Dark: radial gradient ── */}
      {isDark && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]" />}

      {/* ── Background texture: noise (dark) / dot-grid (light) ── */}
      {isDark ? (
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat', backgroundSize: '128px 128px',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] [background-size:24px_24px] pointer-events-none" />
      )}

      {/* ── Dark: grid overlay ── */}
      {isDark && (
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
      )}

      {/* ── Dark: ambient blobs ── */}
      {isDark && <>
        <div className="absolute pointer-events-none" style={{ top:'-10%', left:'50%', transform:'translateX(-50%)', width:'900px', height:'600px', background:'radial-gradient(ellipse,rgba(94,106,210,0.25) 0%,transparent 70%)', filter:'blur(120px)', animation:'floatA 10s ease-in-out infinite' }} />
        <div className="absolute pointer-events-none" style={{ top:'20%', left:'-15%', width:'600px', height:'700px', background:'radial-gradient(ellipse,rgba(120,80,200,0.15) 0%,transparent 70%)', filter:'blur(100px)', animation:'floatB 8s ease-in-out infinite' }} />
        <div className="absolute pointer-events-none" style={{ bottom:'10%', right:'-10%', width:'500px', height:'600px', background:'radial-gradient(ellipse,rgba(60,90,210,0.12) 0%,transparent 70%)', filter:'blur(90px)', animation:'floatC 9s ease-in-out infinite' }} />
      </>}

      <style>{`
        /* Keyframes */
        @keyframes floatA{0%,100%{transform:translateX(-50%) translateY(0) rotate(0deg)}50%{transform:translateX(-50%) translateY(-20px) rotate(1deg)}}
        @keyframes floatB{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-15px) rotate(-1deg)}}
        @keyframes floatC{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-18px) rotate(1.5deg)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

        .fu0{animation:fadeUp .6s cubic-bezier(.16,1,.3,1) both}
        .fu1{animation:fadeUp .6s cubic-bezier(.16,1,.3,1) .08s both}
        .fu2{animation:fadeUp .6s cubic-bezier(.16,1,.3,1) .16s both}
        .fu3{animation:fadeUp .6s cubic-bezier(.16,1,.3,1) .24s both}
        .fu4{animation:fadeUp .6s cubic-bezier(.16,1,.3,1) .32s both}

        .shimmer-shared{
          background:linear-gradient(90deg,#5E6AD2,#818cf8,#5E6AD2);
          background-size:200% auto;
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          background-clip:text;
          animation:shimmer 4s linear infinite;
        }

        /* ── Clerk overrides (dark) ── */
        .cl-rootBox{width:100%}
        .cl-card{border-radius:16px!important;backdrop-filter:blur(12px)!important}
        .cl-formButtonPrimary{border-radius:8px!important;font-size:14px!important;font-weight:500!important;text-transform:none!important;transition:all 200ms cubic-bezier(.16,1,.3,1)!important}
        .cl-formButtonPrimary:hover{transform:translateY(-1px)!important}
        .cl-formButtonPrimary:active{transform:scale(0.98)!important}
        .cl-formFieldInput{border-radius:8px!important;transition:border-color 200ms ease,box-shadow 200ms ease!important}
        .cl-formFieldInput:focus{outline:none!important}
        .cl-socialButtonsBlockButton{border-radius:8px!important;transition:all 200ms cubic-bezier(.16,1,.3,1)!important}

        /* Dark-specific */
        .clerk-dark .cl-card{background:linear-gradient(to bottom,rgba(255,255,255,0.07),rgba(255,255,255,0.02))!important;border:1px solid rgba(255,255,255,0.06)!important;box-shadow:0 0 0 1px rgba(255,255,255,0.06),0 8px 40px rgba(0,0,0,0.5),0 0 80px rgba(94,106,210,0.08)!important}
        .clerk-dark .cl-headerTitle{color:#EDEDEF!important;font-weight:600!important;letter-spacing:-0.02em!important}
        .clerk-dark .cl-headerSubtitle{color:#8A8F98!important}
        .clerk-dark .cl-socialButtonsBlockButton{background:rgba(255,255,255,0.05)!important;border:1px solid rgba(255,255,255,0.08)!important;color:#EDEDEF!important}
        .clerk-dark .cl-socialButtonsBlockButton:hover{background:rgba(255,255,255,0.08)!important;border-color:rgba(255,255,255,0.12)!important}
        .clerk-dark .cl-dividerLine{background:rgba(255,255,255,0.06)!important}
        .clerk-dark .cl-dividerText{color:#8A8F98!important}
        .clerk-dark .cl-formFieldLabel{color:#8A8F98!important;font-size:13px!important}
        .clerk-dark .cl-formFieldInput{background:#0F0F12!important;border:1px solid rgba(255,255,255,0.10)!important;color:#EDEDEF!important}
        .clerk-dark .cl-formFieldInput:focus{border-color:#5E6AD2!important;box-shadow:0 0 0 3px rgba(94,106,210,0.20)!important}
        .clerk-dark .cl-formFieldInput::placeholder{color:rgba(255,255,255,0.25)!important}
        .clerk-dark .cl-formButtonPrimary{background:#5E6AD2!important;box-shadow:0 0 0 1px rgba(94,106,210,0.5),0 4px 12px rgba(94,106,210,0.3),inset 0 1px 0 rgba(255,255,255,0.15)!important}
        .clerk-dark .cl-formButtonPrimary:hover{background:#6872D9!important;box-shadow:0 0 0 1px rgba(94,106,210,0.6),0 8px 20px rgba(94,106,210,0.4),inset 0 1px 0 rgba(255,255,255,0.2)!important}
        .clerk-dark .cl-footerActionText{color:#8A8F98!important}
        .clerk-dark .cl-footerActionLink{color:#5E6AD2!important}
        .clerk-dark .cl-footerActionLink:hover{color:#818cf8!important}
        .clerk-dark .cl-footer,.clerk-dark .cl-footerAction,.clerk-dark .cl-footerPages,.clerk-dark .cl-internal-b3fm6y{background:#050506!important;background-color:#050506!important}
        .clerk-dark .cl-identityPreviewText{color:#EDEDEF!important}
        .clerk-dark .cl-identityPreviewEditButton{color:#5E6AD2!important}

        /* Light-specific */
        .clerk-light .cl-card{background:rgba(255,255,255,0.90)!important;border:1px solid rgba(59,130,246,0.12)!important;box-shadow:0 0 0 1px rgba(59,130,246,0.06),0 8px 32px rgba(59,130,246,0.08),0 2px 8px rgba(0,0,0,0.04)!important}
        .clerk-light .cl-headerTitle{color:#111827!important;font-weight:700!important;letter-spacing:-0.02em!important}
        .clerk-light .cl-headerSubtitle{color:#6b7280!important}
        .clerk-light .cl-socialButtonsBlockButton{background:#ffffff!important;border:1px solid rgba(0,0,0,0.10)!important;color:#374151!important;box-shadow:0 1px 3px rgba(0,0,0,0.06)!important}
        .clerk-light .cl-socialButtonsBlockButton:hover{background:#f0f4ff!important;border-color:rgba(59,130,246,0.25)!important;box-shadow:0 2px 8px rgba(59,130,246,0.12)!important}
        .clerk-light .cl-dividerLine{background:rgba(0,0,0,0.08)!important}
        .clerk-light .cl-dividerText{color:#9ca3af!important}
        .clerk-light .cl-formFieldLabel{color:#374151!important;font-size:13px!important}
        .clerk-light .cl-formFieldInput{background:#ffffff!important;border:1px solid rgba(0,0,0,0.12)!important;color:#111827!important;box-shadow:0 1px 2px rgba(0,0,0,0.04)!important}
        .clerk-light .cl-formFieldInput:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.15)!important}
        .clerk-light .cl-formFieldInput::placeholder{color:#9ca3af!important}
        .clerk-light .cl-formButtonPrimary{background:#16328b!important;box-shadow:0 0 0 1px rgba(22,50,139,0.3),0 4px 12px rgba(22,50,139,0.2),inset 0 1px 0 rgba(255,255,255,0.15)!important}
        .clerk-light .cl-formButtonPrimary:hover{background:#2563eb!important;box-shadow:0 0 0 1px rgba(37,99,235,0.4),0 8px 20px rgba(37,99,235,0.25),inset 0 1px 0 rgba(255,255,255,0.2)!important}
        .clerk-light .cl-footerActionText{color:#6b7280!important}
        .clerk-light .cl-footerActionLink{color:#2563eb!important}
        .clerk-light .cl-footerActionLink:hover{color:#16328b!important}
        .clerk-light .cl-footer,.clerk-light .cl-footerAction,.clerk-light .cl-footerPages,.clerk-light .cl-internal-b3fm6y{background:transparent!important;background-color:transparent!important}
        .clerk-light .cl-identityPreviewText{color:#111827!important}
        .clerk-light .cl-identityPreviewEditButton{color:#2563eb!important}
      `}</style>

      {/* ── Main content ── */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6 py-12 flex flex-col items-center text-center">

        {/* Logo */}
        <div className="fu0 mb-8 w-full flex justify-center">
          <LogoMark />
        </div>

        {/* Heading */}
        <div className="fu1 w-full mb-3 space-y-0">
          <HeadingContent />
        </div>

        {/* Divider */}
        <div className="fu2 w-full my-7">
          <div className="w-full h-px" style={{
            background: isDark
              ? 'linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent)'
              : 'linear-gradient(to right,transparent,rgba(59,130,246,0.18),transparent)'
          }} />
        </div>

        {/* Clerk — wrapper uses full width and centers everything */}
        <div className={`fu3 w-full flex justify-center ${isDark ? 'clerk-dark' : 'clerk-light'}`}>
          <div className="w-full max-w-sm">
            <SignIn appearance={isDark ? darkAppearance : lightAppearance} />
          </div>
        </div>

        {/* Footer label */}
        <p className={`fu4 mt-8 text-xs font-mono tracking-widest uppercase ${isDark ? 'text-white/20' : 'text-gray-400'}`}>
          Built for engineers, by engineers
        </p>
      </div>
    </div>
  )
}