// app/profile/page.tsx
// Redesigned with Linear / Modern design system — matches random/daily AI tutor pages

'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  User, Link2, Save, TrendingUp, BarChart2, Activity,
  Award, CheckCircle2, AlertTriangle, Code2, ExternalLink,
  ChevronRight, Loader2
} from 'lucide-react';

import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── Lazy charts ─────────────────────────────────────────────────────────────

const DynamicDifficultyPieChart = dynamic(
  () => import('@/app/_components/charts/DifficultyPieChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const DynamicSubmissionBarChart = dynamic(
  () => import('@/app/_components/charts/SubmissionBarChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const DynamicSubmissionLineChart = dynamic(
  () => import('@/app/_components/charts/SubmissionLineChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeetCodeProfile {
  username: string;
  profile: {
    userAvatar?: string;
    realName: string;
    websites: string[];
    countryName: string | null;
    company: string | null;
    school: string | null;
    aboutMe: string;
    reputation: number;
    ranking: number;
  };
  submitStats: {
    acSubmissionNum:    { difficulty: string; count: number; submissions: number }[];
    totalSubmissionNum: { difficulty: string; count: number; submissions: number }[];
  };
}

interface LeetCodeSubmission {
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
  url: string;
}

interface UserProfile {
  name: string | null;
  email: string;
  is_premium: boolean;
  leetcode_username: string | null;
  current_plan: string | null;
  payment_id: string | null;
  payment_status: string | null;
}

// ─── Small primitives ─────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="w-full h-full rounded-xl bg-zinc-100 dark:bg-white/[0.03] animate-pulse" />
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'rounded-2xl overflow-hidden',
      'bg-white dark:bg-[#0a0a0c]',
      'border border-zinc-200/70 dark:border-white/[0.06]',
      'shadow-[0_2px_24px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.02)]',
      'dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_40px_rgba(0,0,0,0.45)]',
      className
    )}>
      {children}
    </div>
  );
}

function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className={`relative px-5 py-4 flex-shrink-0
      bg-zinc-50/80 dark:bg-white/[0.02]
      border-b border-zinc-200/70 dark:border-white/[0.06]`}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5E6AD2]/30 to-transparent" />
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-zinc-400 dark:text-white/30 uppercase tracking-[0.14em] mb-3">
      {children}
    </p>
  );
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const cfg = {
    easy:   { bg: 'bg-emerald-100 dark:bg-emerald-500/[0.08]', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
    medium: { bg: 'bg-amber-100 dark:bg-amber-500/[0.08]',     text: 'text-amber-700 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-500/20',   dot: 'bg-amber-500' },
    hard:   { bg: 'bg-rose-100 dark:bg-rose-500/[0.08]',       text: 'text-rose-700 dark:text-rose-400',       border: 'border-rose-200 dark:border-rose-500/20',     dot: 'bg-rose-500' },
  }[difficulty?.toLowerCase() ?? 'medium'] ?? {
    bg: 'bg-zinc-100 dark:bg-white/[0.05]', text: 'text-zinc-600 dark:text-zinc-400',
    border: 'border-zinc-200 dark:border-white/[0.08]', dot: 'bg-zinc-400'
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border', cfg.bg, cfg.text, cfg.border)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {difficulty}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  value, label, icon, accent = false, delay = 0
}: {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'rounded-2xl overflow-hidden group relative',
        'bg-white dark:bg-[#0a0a0c]',
        'border border-zinc-200/70 dark:border-white/[0.06]',
        'shadow-[0_2px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.35)]',
        'hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_8px_40px_rgba(0,0,0,0.5),0_0_60px_rgba(94,106,210,0.08)]',
        'transition-all duration-300 p-5'
      )}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5E6AD2]/25 to-transparent" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-zinc-500 dark:text-[#8A8F98] mb-1.5 tracking-wide">
            {label}
          </p>
          <p className={cn(
            'text-2xl font-bold tracking-tight',
            accent
              ? 'bg-gradient-to-br from-[#5E6AD2] to-indigo-400 bg-clip-text text-transparent'
              : 'text-zinc-900 dark:text-[#EDEDEF]'
          )}>
            {value}
          </p>
        </div>
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
          'bg-[#5E6AD2]/[0.08] dark:bg-[#5E6AD2]/[0.10]',
          'border border-[#5E6AD2]/[0.12] dark:border-[#5E6AD2]/[0.10]',
          'group-hover:bg-[#5E6AD2]/[0.12] transition-colors duration-200'
        )}>
          <span className="text-[#5E6AD2] dark:text-indigo-400">{icon}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Submission row ───────────────────────────────────────────────────────────

function SubmissionRow({ submission, index }: { submission: LeetCodeSubmission; index: number }) {
  const accepted = submission.statusDisplay === 'Accepted';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className={`group flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl
        bg-zinc-50/80 dark:bg-white/[0.02]
        border border-zinc-200/60 dark:border-white/[0.05]
        hover:border-zinc-300/70 dark:hover:border-white/[0.10]
        hover:bg-zinc-100/60 dark:hover:bg-white/[0.04]
        transition-all duration-150`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          accepted ? 'bg-emerald-500' : 'bg-rose-500'
        )} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-800 dark:text-[#EDEDEF] truncate leading-tight">
            {submission.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              'text-[10px] font-semibold px-1.5 py-0.5 rounded',
              accepted
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/[0.08]'
                : 'text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/[0.08]'
            )}>
              {submission.statusDisplay}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-white/30 bg-zinc-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-white/[0.05]">
              {submission.lang}
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-white/25">
              {new Date(parseInt(submission.timestamp) * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      <a
        href={`https://leetcode.com${submission.url}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold
          text-[#5E6AD2] dark:text-indigo-400
          bg-[#5E6AD2]/[0.07] dark:bg-[#5E6AD2]/[0.08]
          border border-[#5E6AD2]/[0.12] dark:border-[#5E6AD2]/[0.10]
          hover:bg-[#5E6AD2]/[0.12] dark:hover:bg-[#5E6AD2]/[0.14]
          active:scale-[0.97] transition-all duration-150`}>
        <ExternalLink className="w-3 h-3" />
        View
      </a>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState('charts');

  const [userName, setUserName]                       = useState('');
  const [leetcodeUsername, setLeetcodeUsername]       = useState('');
  const [leetcodeProfile, setLeetcodeProfile]         = useState<LeetCodeProfile | null>(null);
  const [leetcodeSubmissions, setLeetcodeSubmissions] = useState<LeetCodeSubmission[]>([]);
  const [loadingLeetcode, setLoadingLeetcode]         = useState(false);
  const [leetcodeError, setLeetcodeError]             = useState<string | null>(null);
  const [darkMode]                                    = useState(false); // charts compat

  // ── Fetch user profile ───────────────────────────────────────────────────
  useEffect(() => {
    async function fetchUserProfile() {
      if (!isClerkLoaded || !isSignedIn) { setLoading(false); return; }
      setLoading(true);
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
          const e = await res.json();
          setUserName(user?.firstName || user?.emailAddresses[0].emailAddress || '');
          setError(e.error || 'Failed to load profile data.');
        } else {
          const data: UserProfile = await res.json();
          setUserName(data.name || user?.firstName || user?.emailAddresses[0].emailAddress || '');
          setLeetcodeUsername(data.leetcode_username || '');
        }
      } catch (err: any) {
        setError(err.message || 'Unexpected error loading profile.');
        setUserName(user?.firstName || user?.emailAddresses[0].emailAddress || '');
      } finally {
        setLoading(false);
      }
    }
    fetchUserProfile();
  }, [isClerkLoaded, isSignedIn, user]);

  // ── Fetch LeetCode data ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchLeetcodeData() {
      if (!leetcodeUsername) {
        setLeetcodeProfile(null);
        setLeetcodeSubmissions([]);
        setLeetcodeError(null);
        return;
      }
      setLoadingLeetcode(true);
      setLeetcodeError(null);
      try {
        const pRes = await fetch(`/api/leetcode-profile/${leetcodeUsername}`);
        if (!pRes.ok) throw new Error((await pRes.json()).error || 'Failed to fetch profile');
        setLeetcodeProfile(await pRes.json());

        const sRes = await fetch(`/api/leetcode-submissions/${leetcodeUsername}`);
        if (!sRes.ok) throw new Error((await sRes.json()).error || 'Failed to fetch submissions');
        const sData: any = await sRes.json();
        setLeetcodeSubmissions(sData?.submissions ?? []);
      } catch (err: any) {
        setLeetcodeError(err.message || 'Failed to load LeetCode data.');
        setLeetcodeProfile(null);
        setLeetcodeSubmissions([]);
      } finally {
        setLoadingLeetcode(false);
      }
    }
    fetchLeetcodeData();
  }, [leetcodeUsername]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName, leetcodeUsername }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update profile.');
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Unexpected error during update.');
    } finally {
      setSaving(false);
    }
  };

  // ── Derived chart data ───────────────────────────────────────────────────
  const difficultyData = leetcodeProfile?.submitStats?.acSubmissionNum
    .filter(s => s.difficulty !== 'All')
    .map(stat => ({
      name:   stat.difficulty,
      solved: stat.count,
      total:  leetcodeProfile.submitStats?.totalSubmissionNum?.find(t => t.difficulty === stat.difficulty)?.count ?? 0,
    }));

  const pieChartData = difficultyData?.map(item => ({
    name:  item.name,
    value: item.solved,
    color: item.name === 'Easy' ? '#10B981' : item.name === 'Medium' ? '#F59E0B' : '#EF4444',
  }));

  const submissionTrendMap = new Map<string, { date: string; total: number; accepted: number }>();
  if (Array.isArray(leetcodeSubmissions)) {
    leetcodeSubmissions.forEach(s => {
      const date = new Date(parseInt(s.timestamp) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!submissionTrendMap.has(date)) submissionTrendMap.set(date, { date, total: 0, accepted: 0 });
      const entry = submissionTrendMap.get(date)!;
      entry.total += 1;
      if (s.statusDisplay === 'Accepted') entry.accepted += 1;
    });
  }
  const submissionTrendData = Array.from(submissionTrendMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalSolved     = leetcodeProfile?.submitStats?.acSubmissionNum?.find(s => s.difficulty === 'All')?.count ?? 0;
  const totalSubmissions = leetcodeProfile?.submitStats?.totalSubmissionNum?.find(s => s.difficulty === 'All')?.count ?? 0;
  const acceptanceRate  = totalSubmissions > 0 ? Math.round((totalSolved / totalSubmissions) * 100) : 0;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!isClerkLoaded || loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050506] flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none hidden dark:block overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-[#5E6AD2]/[0.07] blur-[140px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-5"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-[#5E6AD2]/20 blur-[24px]" />
            <div className={`relative w-14 h-14 rounded-2xl
              bg-gradient-to-br from-[#5E6AD2] to-[#4B57C5]
              shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_24px_rgba(94,106,210,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]
              flex items-center justify-center`}>
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          </div>
          <p className="text-sm font-medium text-zinc-600 dark:text-[#8A8F98]">Loading your profile...</p>
        </motion.div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050506] flex items-center justify-center p-4">
        <Panel className="max-w-sm w-full">
          <div className="h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
          <div className="p-8 text-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4
              bg-gradient-to-br from-rose-500 to-red-600
              shadow-[0_0_0_1px_rgba(239,68,68,0.3),0_4px_16px_rgba(239,68,68,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]`}>
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-[#EDEDEF]">Sign in to view your profile</p>
          </div>
        </Panel>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050506] flex flex-col">

      {/* ── Background ─────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`hidden dark:block absolute inset-0
          bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]`} />
        <div className={`hidden dark:block absolute top-[-8%] left-1/2 -translate-x-[40%]
          w-[900px] h-[500px] rounded-full bg-[#5E6AD2]/[0.08] blur-[150px] pf-blob-1`} />
        <div className={`hidden dark:block absolute bottom-[5%] right-[2%]
          w-[600px] h-[400px] rounded-full bg-indigo-600/[0.05] blur-[120px] pf-blob-2`} />
        <div className={`hidden dark:block absolute top-[45%] left-[-5%]
          w-[500px] h-[400px] rounded-full bg-violet-700/[0.04] blur-[100px] pf-blob-3`} />
        <div className="absolute inset-0 opacity-[0.018] dark:opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '256px',
          }} />
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(94,106,210,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(94,106,210,0.4) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }} />
      </div>

      {/* ── Hero header ────────────────────────────────────────────────── */}
      <div className={`relative z-10 border-b border-zinc-200/70 dark:border-white/[0.06]
        bg-white/80 dark:bg-[#050506]/80 backdrop-blur-xl flex-shrink-0`}>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5E6AD2]/12 to-transparent" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">

            {/* Avatar + Name */}
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                {leetcodeProfile?.profile?.userAvatar ? (
                  <div className={`relative w-14 h-14 rounded-2xl overflow-hidden
                    ring-2 ring-[#5E6AD2]/20 dark:ring-[#5E6AD2]/15
                    shadow-[0_0_0_1px_rgba(94,106,210,0.25),0_4px_16px_rgba(94,106,210,0.15)]`}>
                    <Image
                      src={leetcodeProfile.profile.userAvatar}
                      alt={userName?.charAt(0).toUpperCase() || 'U'}
                      width={56} height={56}
                      className="object-cover w-full h-full"
                      priority
                    />
                  </div>
                ) : (
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold
                    bg-gradient-to-br from-[#5E6AD2] to-[#4B57C5]
                    shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_20px_rgba(94,106,210,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]`}>
                    {userName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#050506] shadow-sm" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-[#EDEDEF]">
                    {userName || 'Your Profile'}
                  </h1>
                  {leetcodeProfile && (
                    <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                      bg-emerald-50 dark:bg-emerald-500/[0.06]
                      text-emerald-700 dark:text-emerald-400
                      border border-emerald-200/60 dark:border-emerald-500/[0.12]`}>
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 dark:text-[#8A8F98]">
                  {user?.emailAddresses[0].emailAddress}
                </p>
              </div>
            </div>

            {/* Global rank */}
            {leetcodeProfile && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl
                  bg-white dark:bg-[#0a0a0c]
                  border border-zinc-200/70 dark:border-white/[0.06]
                  shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.4)]`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                  bg-[#5E6AD2]/[0.08] dark:bg-[#5E6AD2]/[0.10]
                  border border-[#5E6AD2]/[0.12] dark:border-[#5E6AD2]/[0.10]`}>
                  <Award className="w-4 h-4 text-[#5E6AD2] dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-[#8A8F98]">Global Rank</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-[#EDEDEF] leading-tight tabular-nums">
                    #{leetcodeProfile.profile.ranking?.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-5">

            {/* Profile settings */}
            <Panel>
              <PanelHeader>
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center
                    bg-[#5E6AD2]/[0.08] dark:bg-[#5E6AD2]/[0.10]
                    border border-[#5E6AD2]/[0.12] dark:border-[#5E6AD2]/[0.10]`}>
                    <User className="w-3.5 h-3.5 text-[#5E6AD2] dark:text-indigo-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-[#EDEDEF] tracking-tight">
                    Profile Settings
                  </h2>
                </div>
              </PanelHeader>

              <div className="p-5 space-y-5">
                {/* Alerts */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-start gap-3 p-3.5 rounded-xl
                        bg-rose-50 dark:bg-rose-500/[0.06]
                        border border-rose-200/70 dark:border-rose-500/[0.15]`}>
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-start gap-3 p-3.5 rounded-xl
                        bg-emerald-50 dark:bg-emerald-500/[0.06]
                        border border-emerald-200/70 dark:border-emerald-500/[0.15]`}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">{successMessage}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Display name */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-zinc-500 dark:text-[#8A8F98] uppercase tracking-[0.08em]">
                      Display Name
                    </Label>
                    <Input
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="Enter your name"
                      className={`bg-zinc-50 dark:bg-[#050506]
                        border-zinc-200/70 dark:border-white/[0.08]
                        text-zinc-900 dark:text-[#EDEDEF]
                        placeholder:text-zinc-400 dark:placeholder:text-white/25
                        focus-visible:ring-1 focus-visible:ring-[#5E6AD2]/50 focus-visible:border-[#5E6AD2]/50
                        h-9 text-sm rounded-lg`}
                    />
                  </div>

                  {/* LeetCode username */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-zinc-500 dark:text-[#8A8F98] uppercase tracking-[0.08em]">
                      LeetCode Username
                    </Label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-white/25" />
                      <Input
                        value={leetcodeUsername}
                        onChange={e => setLeetcodeUsername(e.target.value)}
                        placeholder="your_leetcode_username"
                        className={`pl-9 bg-zinc-50 dark:bg-[#050506]
                          border-zinc-200/70 dark:border-white/[0.08]
                          text-zinc-900 dark:text-[#EDEDEF]
                          placeholder:text-zinc-400 dark:placeholder:text-white/25
                          focus-visible:ring-1 focus-visible:ring-[#5E6AD2]/50 focus-visible:border-[#5E6AD2]/50
                          h-9 text-sm rounded-lg`}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 dark:text-white/25 leading-relaxed">
                      Connect LeetCode to unlock analytics
                    </p>
                  </div>

                  {/* Save button */}
                  <button
                    type="submit"
                    disabled={saving}
                    className={cn(
                      'group relative w-full overflow-hidden rounded-lg px-4 py-2.5',
                      'flex items-center justify-center gap-2 text-sm font-semibold',
                      'bg-gradient-to-b from-[#5E6AD2] to-[#4B57C5] text-white',
                      'shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_2px_8px_rgba(94,106,210,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]',
                      'hover:shadow-[0_0_0_1px_rgba(94,106,210,0.65),0_4px_16px_rgba(94,106,210,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]',
                      'active:scale-[0.97] active:shadow-none',
                      'disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100',
                      'transition-all duration-150'
                    )}>
                    <span className={`absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%]
                      transition-transform duration-500
                      bg-gradient-to-r from-transparent via-white/20 to-transparent`} />
                    {saving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                      : <><Save className="w-4 h-4" /> Save Changes</>
                    }
                  </button>
                </form>
              </div>
            </Panel>

            {/* Quick stats sidebar tile (only when data loaded) */}
            {leetcodeProfile && (
              <Panel>
                <div className="h-px bg-gradient-to-r from-transparent via-[#5E6AD2]/20 to-transparent" />
                <div className="p-4">
                  <SectionLabel>Difficulty Breakdown</SectionLabel>
                  <div className="space-y-2">
                    {difficultyData?.map(item => {
                      const pct = item.total > 0 ? (item.solved / item.total) * 100 : 0;
                      const color = item.name === 'Easy' ? 'bg-emerald-500' : item.name === 'Medium' ? 'bg-amber-500' : 'bg-rose-500';
                      return (
                        <div key={item.name}>
                          <div className="flex items-center justify-between mb-1">
                            <DifficultyBadge difficulty={item.name} />
                            <span className="text-[11px] font-semibold tabular-nums text-zinc-700 dark:text-[#EDEDEF]">
                              {item.solved} <span className="text-zinc-400 dark:text-white/25 font-normal">/ {item.total}</span>
                            </span>
                          </div>
                          <div className="h-1 bg-zinc-100 dark:bg-white/[0.04] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                              className={cn('h-full rounded-full', color)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Panel>
            )}
          </div>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">

            {/* LeetCode loading */}
            {loadingLeetcode && (
              <Panel>
                <div className="flex flex-col items-center justify-center py-16 gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-[#5E6AD2]/20 blur-[20px]" />
                    <div className={`relative w-12 h-12 rounded-2xl
                      bg-gradient-to-br from-[#5E6AD2] to-[#4B57C5]
                      shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_20px_rgba(94,106,210,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]
                      flex items-center justify-center`}>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-[#8A8F98]">Fetching LeetCode data...</p>
                </div>
              </Panel>
            )}

            {/* LeetCode error */}
            {!loadingLeetcode && leetcodeError && (
              <Panel>
                <div className="h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
                <div className="p-8 flex flex-col sm:flex-row items-start gap-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                    bg-rose-50 dark:bg-rose-500/[0.08]
                    border border-rose-200/60 dark:border-rose-500/[0.15]`}>
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-[#EDEDEF] mb-1">Unable to Load LeetCode Data</p>
                    <p className="text-sm text-zinc-500 dark:text-[#8A8F98] leading-relaxed">{leetcodeError}</p>
                    <p className="text-xs text-zinc-400 dark:text-white/30 mt-2">Verify the username and ensure your profile is public.</p>
                  </div>
                </div>
              </Panel>
            )}

            {/* LeetCode data */}
            {!loadingLeetcode && !leetcodeError && leetcodeProfile && (
              <>
                {/* Stats grid */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatCard
                    value={totalSolved}
                    label="Problems Solved"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    delay={80}
                  />
                  <StatCard
                    value={totalSubmissions}
                    label="Total Submissions"
                    icon={<BarChart2 className="w-4 h-4" />}
                    delay={160}
                  />
                  <StatCard
                    value={leetcodeProfile.profile.reputation?.toLocaleString() ?? 'N/A'}
                    label="Reputation"
                    icon={<Award className="w-4 h-4" />}
                    delay={240}
                  />
                  <StatCard
                    value={`${acceptanceRate}%`}
                    label="Acceptance Rate"
                    icon={<TrendingUp className="w-4 h-4" />}
                    accent
                    delay={320}
                  />
                </div>

                {/* Tabs */}
                <Panel>
                  <PanelHeader>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className={`h-8 p-0.5 gap-0.5
                        bg-zinc-100/80 dark:bg-white/[0.04]
                        border border-zinc-200/60 dark:border-white/[0.06]
                        rounded-lg`}>
                        {[
                          { value: 'charts',      label: 'Analytics',    icon: <Activity className="w-3 h-3" /> },
                          { value: 'submissions', label: 'Submissions',  icon: <Code2 className="w-3 h-3" /> },
                        ].map(tab => (
                          <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className={cn(
                              'flex items-center gap-1.5 px-3 h-7 text-xs font-semibold rounded-md transition-all duration-150',
                              'text-zinc-500 dark:text-[#8A8F98]',
                              'data-[state=active]:bg-white dark:data-[state=active]:bg-[#0a0a0c]',
                              'data-[state=active]:text-zinc-900 dark:data-[state=active]:text-[#EDEDEF]',
                              'data-[state=active]:shadow-[0_1px_4px_rgba(0,0,0,0.08)] dark:data-[state=active]:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
                            )}>
                            {tab.icon}
                            {tab.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {/* Analytics tab */}
                      <TabsContent value="charts" className="mt-0">
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* Pie chart */}
                          <div className={`rounded-xl overflow-hidden
                            bg-zinc-50/60 dark:bg-white/[0.02]
                            border border-zinc-200/50 dark:border-white/[0.04] p-4`}>
                            <div className="flex items-center gap-2 mb-4">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2] animate-pulse" />
                              <p className="text-xs font-semibold text-zinc-600 dark:text-[#8A8F98] tracking-wide">
                                Difficulty Distribution
                              </p>
                            </div>
                            <div className="h-52">
                              {pieChartData && pieChartData.length > 0
                                ? <DynamicDifficultyPieChart data={pieChartData} darkMode={darkMode} />
                                : <div className="flex items-center justify-center h-full text-xs text-zinc-400 dark:text-white/25">No data</div>
                              }
                            </div>
                          </div>

                          {/* Bar chart */}
                          <div className={`rounded-xl overflow-hidden
                            bg-zinc-50/60 dark:bg-white/[0.02]
                            border border-zinc-200/50 dark:border-white/[0.04] p-4`}>
                            <div className="flex items-center gap-2 mb-4">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <p className="text-xs font-semibold text-zinc-600 dark:text-[#8A8F98] tracking-wide">
                                Submissions Overview
                              </p>
                            </div>
                            <div className="h-52">
                              {difficultyData && difficultyData.length > 0
                                ? <DynamicSubmissionBarChart data={difficultyData} darkMode={darkMode} />
                                : <div className="flex items-center justify-center h-full text-xs text-zinc-400 dark:text-white/25">No data</div>
                              }
                            </div>
                          </div>

                          {/* Line chart — full width */}
                          {submissionTrendData.length > 0 && (
                            <div className={`md:col-span-2 rounded-xl overflow-hidden
                              bg-zinc-50/60 dark:bg-white/[0.02]
                              border border-zinc-200/50 dark:border-white/[0.04] p-4`}>
                              <div className="flex items-center gap-2 mb-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                                <p className="text-xs font-semibold text-zinc-600 dark:text-[#8A8F98] tracking-wide">
                                  Activity Trend
                                </p>
                              </div>
                              <div className="h-52">
                                <DynamicSubmissionLineChart data={submissionTrendData} darkMode={darkMode} />
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* Submissions tab */}
                      <TabsContent value="submissions" className="mt-0">
                        <div className="p-5">
                          {leetcodeSubmissions.length > 0 ? (
                            <>
                              <div className="flex items-center justify-between mb-4">
                                <SectionLabel>Recent Activity</SectionLabel>
                                <span className="text-[10px] text-zinc-400 dark:text-white/25">
                                  Latest {Math.min(leetcodeSubmissions.length, 10)} submissions
                                </span>
                              </div>
                              <div className="space-y-2">
                                {leetcodeSubmissions.slice(0, 10).map((s, i) => (
                                  <SubmissionRow key={i} submission={s} index={i} />
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                bg-zinc-100 dark:bg-white/[0.04]
                                border border-zinc-200/60 dark:border-white/[0.06]`}>
                                <Code2 className="w-5 h-5 text-zinc-400 dark:text-white/25" />
                              </div>
                              <p className="text-sm font-medium text-zinc-600 dark:text-[#8A8F98]">No submissions found</p>
                              <p className="text-xs text-zinc-400 dark:text-white/25">
                                Make sure your LeetCode profile is public
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </PanelHeader>
                </Panel>
              </>
            )}

            {/* No LeetCode connected prompt */}
            {!loadingLeetcode && !leetcodeError && !leetcodeProfile && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Panel>
                  <div className="h-px bg-gradient-to-r from-transparent via-[#5E6AD2]/35 to-transparent" />
                  <div className="p-10 sm:p-14 flex flex-col items-center text-center gap-6">
                    {/* Icon */}
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl bg-[#5E6AD2]/20 blur-[28px]" />
                      <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center
                        bg-gradient-to-br from-[#5E6AD2] to-[#4B57C5]
                        shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_6px_24px_rgba(94,106,210,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]`}>
                        <Code2 className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    <div className="space-y-2 max-w-sm">
                      <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-[#EDEDEF]">
                        Connect Your LeetCode
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-[#8A8F98] leading-relaxed">
                        Link your account to unlock detailed analytics, track your progress, and visualize your coding journey.
                      </p>
                    </div>

                    {/* Feature bullets */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {[
                        { icon: <BarChart2 className="w-3.5 h-3.5" />, label: 'Track Progress' },
                        { icon: <Activity className="w-3.5 h-3.5" />,  label: 'View Analytics' },
                        { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Monitor Growth' },
                      ].map(item => (
                        <div key={item.label}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full
                            bg-[#5E6AD2]/[0.06] dark:bg-[#5E6AD2]/[0.08]
                            border border-[#5E6AD2]/[0.10] dark:border-[#5E6AD2]/[0.10]
                            text-[#5E6AD2] dark:text-indigo-400 text-xs font-medium`}>
                          {item.icon}
                          {item.label}
                        </div>
                      ))}
                    </div>

                    {/* Arrow hint */}
                    <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-white/25">
                      <ChevronRight className="w-3.5 h-3.5" />
                      Enter your username in Profile Settings to get started
                    </div>
                  </div>
                </Panel>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* ── Styles ─────────────────────────────────────────────────────── */}
      <style jsx>{`
        @keyframes pf-float-1 { 0%,100%{ transform:translateY(0px) rotate(0deg) scale(1); }    50%{ transform:translateY(-20px) rotate(1deg) scale(1.02); } }
        @keyframes pf-float-2 { 0%,100%{ transform:translateY(0px) rotate(0deg); }              50%{ transform:translateY(-28px) rotate(-1deg); } }
        @keyframes pf-float-3 { 0%,100%{ transform:translateY(0px); } 33%{ transform:translateY(-12px); } 66%{ transform:translateY(-22px); } }

        .pf-blob-1 { animation: pf-float-1 14s ease-in-out infinite; }
        .pf-blob-2 { animation: pf-float-2 18s ease-in-out infinite; }
        .pf-blob-3 { animation: pf-float-3 22s ease-in-out infinite; }
      `}</style>
    </div>
  );
}