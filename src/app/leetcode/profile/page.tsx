'use client';

import React, { useState, useEffect, useRef, useMemo, FormEvent } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from "html-to-image";
import { User, Link2, Save, AlertTriangle, Code2, CheckCircle2, Loader2, Download, Share2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCode } from '@/components/ui/qrcode';
import { AnimatedShinyButton } from '@/components/ui/animated-shiny-button';

// Required for the exact aesthetic
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
// --- Custom Styles for Heatmap to match github theme ---
const HeatmapStyles = () => (
  <style jsx global>{`
    .react-calendar-heatmap text {
      font-size: 10px;
      fill: #aaa;
    }
    .react-calendar-heatmap .color-empty { fill: #1c1c1c; }
    .react-calendar-heatmap .color-github-1 { fill: #12351F; }
    .react-calendar-heatmap .color-github-2 { fill: #155229; }
    .react-calendar-heatmap .color-github-3 { fill: #1E8A44; }
    .react-calendar-heatmap .color-github-4 { fill: #29D398; }
    
    .react-calendar-heatmap rect:hover { stroke: #555; stroke-width: 1px; }
  `}</style>
);

// --- Exact Component Replications ---

const Circle = ({ total }: { total: number }) => {
  const circumference = 2 * Math.PI * 46;
  const percentage = (total / 3000) * 100; // Using 3000 as approx max LC questions
  const dashLength = circumference * (percentage / 100);

  return (
    <div className="mt-4 flex min-w-[100px] justify-center">
      <div className="shrink-1 z-base relative max-h-[100px] max-w-[100px]">
        <svg className="h-[100px] w-[100px] origin-center -rotate-90 transform" viewBox="0 0 100 100">
          <circle fill="none" cx="50" cy="50" r="46" strokeWidth="3" strokeLinecap="round" stroke="#4B4A4B" />
          {dashLength > 0 && (
            <circle
              fill="none" cx="50" cy="50" r="46" strokeWidth="5" strokeLinecap="round"
              stroke="#FFC11F" strokeDasharray={`${dashLength} ${circumference}`} strokeDashoffset="0"
            />
          )}
        </svg>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform cursor-default text-center">
          <div className="text-[24px] font-medium text-black dark:text-[#FFFEFE] ">{total}</div>
          <div className="whitespace-nowrap text-xs text-[#9FA0A5]">Solved</div>
        </div>
      </div>
    </div>
  );
};

const Questions = ({ type, solved, total, line, line2 }: any) => {
  const percentage = Math.round((solved / Math.max(total, 1)) * 100);
  return (
    <div className="flex flex-col w-[230px]">
      <div className="flex justify-between items-end w-full mb-1">
        <p className="text-[#9FA0A5] text-sm font-medium">{type}</p>
        <div className="flex items-end font-mono">
          <span className="text-sm font-semibold text-[#FFFEFE]">{solved}</span>
          <span className="text-xs font-medium text-[#626367] ml-1">/{total}</span>
        </div>
      </div>
      <div className={`rounded-full h-[8px] w-full ${line} overflow-hidden`}>
        <div className={`rounded-full h-full transition-all duration-1000 ${line2}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

function worthCalculator(streak: number, easySolved: number, mediumSolved: number, hardSolved: number, activeYears: number, totalActiveDays: number) {
  return (
    easySolved * 1 +
    mediumSolved * 2 +
    hardSolved * 5 +
    streak * (streak >= 30 ? 10 : 5) +
    activeYears * 2 +
    totalActiveDays * 10
  );
}

// --- Main Page ---

export default function ProfilePage() {
  const { user, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const queryClient = useQueryClient();

  const [userName, setUserName] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState({ show: false, content: "", x: 0, y: 0 });

  // 1. Fetch settings from backend (Postgres via Clerk/Supabase)
  const { data: userProfile, isLoading: isProfileLoading, error: profileErrorData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load profile data.');
      return res.json();
    },
    enabled: isClerkLoaded && isSignedIn,
  });

  useEffect(() => {
    if (userProfile) {
      setUserName(userProfile.name || user?.firstName || user?.emailAddresses[0]?.emailAddress || '');
      setLeetcodeUsername(userProfile.leetcode_username || '');
    } else if (profileErrorData) {
      setUserName(user?.firstName || user?.emailAddresses[0]?.emailAddress || '');
      setError(profileErrorData.message);
    }
    setGroqApiKey(localStorage.getItem('user_groq_api_key') || '');
  }, [userProfile, profileErrorData, user]);

  // 2. Fetch Leetcode Data
  const { data: leetcodeData, isLoading: isLeetcodeLoading } = useQuery({
    queryKey: ['leetcodeProfileData', userProfile?.leetcode_username],
    queryFn: async () => {
      const username = userProfile!.leetcode_username;
      const res = await fetch(`/api/leetcode-profile/${username}`);
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch leetcode profile');
      return res.json();
    },
    enabled: !!userProfile?.leetcode_username,
  });

  // Settings Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (newData: { name: string, leetcodeUsername: string }) => {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update profile.');
      return res.json();
    },
    onSuccess: () => {
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (err: any) => setError(err.message || 'Unexpected error.')
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (groqApiKey.trim()) localStorage.setItem('user_groq_api_key', groqApiKey.trim());
    else localStorage.removeItem('user_groq_api_key');
    updateProfileMutation.mutate({ name: userName, leetcodeUsername });
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  const downloadAsImage = async () => {
    if (downloadRef.current) {
      try {
        setIsDownloading(true);
        // Brief wait to ensure the offscreen element is fully rendered if it just mounted
        await new Promise(resolve => setTimeout(resolve, 50));

        const dataUrl = await toPng(downloadRef.current, {
          pixelRatio: 2,
          backgroundColor: "#0e0e0e",
          cacheBust: true,
          style: {
            transform: "scale(1)",
            transformOrigin: "top left",
          },
        });

        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "leetcode-stats.png";
        link.click();
      } catch (err) {
        console.error("Error generating image:", err);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const [isDownloadingQr, setIsDownloadingQr] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQrAsImage = async () => {
    if (qrRef.current && cardData) {
      try {
        setIsDownloadingQr(true);
        const dataUrl = await toPng(qrRef.current, {
          pixelRatio: 4, // High resolution for QR codes
          backgroundColor: "#ffffff",
          cacheBust: true,
        });
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${cardData.username}-leetcode-qr.png`;
        link.click();
      } catch (err) {
        console.error("Error generating QR image:", err);
      } finally {
        setIsDownloadingQr(false);
      }
    }
  };
  const loading = !isClerkLoaded || isProfileLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col md:flex-row gap-8 max-w-[1200px] mx-auto p-4 lg:p-8 pt-24">
        {/* Left Column Skeleton */}
        <div className="w-full lg:col-span-8 space-y-6">
          <Skeleton className="h-[600px] w-full rounded shadow-xl" />
        </div>
        {/* Right Column Skeleton */}
        <div className="w-full lg:col-span-4 space-y-6">
          <Skeleton className="h-[300px] w-full rounded shadow-xl" />
          <Skeleton className="h-[350px] w-full rounded shadow-xl" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">Sign in to view your profile.</div>;
  }

  // --- Prepare Data for Worth Card ---
  let cardData: any = null;
  let heatmapValues: any[] = [];
  let startDate = new Date();
  let endDate = new Date();

  if (leetcodeData) {
    const ac = leetcodeData.submitStats?.acSubmissionNum || [];
    const total = leetcodeData.allQuestionsCount || [];
    const getCount = (arr: any[], diff: string) => arr.find(a => a.difficulty === diff)?.count || 0;

    cardData = {
      image: leetcodeData.profile?.userAvatar || `https://ui-avatars.com/api/?name=${userName}&background=0D1117&color=ffffff`,
      fullName: leetcodeData.profile?.realName || userName,
      username: leetcodeData.username,
      totalSolved: getCount(ac, 'All'),
      easyTotal: getCount(total, 'Easy'),
      mediumTotal: getCount(total, 'Medium'),
      hardTotal: getCount(total, 'Hard'),
      easySolved: getCount(ac, 'Easy'),
      mediumSolved: getCount(ac, 'Medium'),
      hardSolved: getCount(ac, 'Hard'),
      streak: 0, // Not provided directly by the graphql API
      totalActiveDays: 0,
      activeYears: 1,
      totalQuestions: getCount(total, 'All'),
      totalAttempted: leetcodeData.submitStats?.totalSubmissionNum?.find((a: any) => a.difficulty === 'All')?.count || 0,
      totalSubmissionsAll: leetcodeData.submitStats?.totalSubmissionNum?.find((a: any) => a.difficulty === 'All')?.submissions || 0,
      acSubmissionsAll: ac.find((a: any) => a.difficulty === 'All')?.submissions || 0,
      globalRank: leetcodeData.profile?.ranking || 0,
      contestRanking: leetcodeData.enrichment?.contestRanking
    };

    const cal = leetcodeData.enrichment?.submissionCalendar;
    if (cal) {
      cardData.totalActiveDays = Object.values(cal).filter((v: any) => v > 0).length;
      endDate = new Date();
      startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate() + 1);

      heatmapValues = Object.entries(cal)
        .map(([timestamp, count]) => ({
          date: new Date(parseInt(timestamp) * 1000),
          count: count,
        }))
        .filter((value: any) => value.date >= startDate && value.date <= endDate);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background text-foreground font-sans p-4 sm:p-8 flex flex-col items-center">
      <HeatmapStyles />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8">

        {/* LEFT COLUMN: The Worth Card exactly like repo */}
        <div className="lg:col-span-8 flex justify-center w-full flex-col items-center">

          <div className="flex gap-2 w-full max-w-[700px] justify-end mb-4">
            <button
              type="button"
              onClick={downloadAsImage}
              disabled={!cardData || isLeetcodeLoading || isDownloading}
              className={`border flex items-center text-center bg-gradient-to-r from-[#cb42b2] to-[#f38d90] bg-clip-text text-transparent justify-center gap-2 px-4 h-[40px] rounded-md font-semibold text-sm ${isLeetcodeLoading || !cardData || isDownloading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-80 transition-opacity"
                }`}
            >
              {isDownloading ? <Loader2 className="w-4 h-4 text-[#f38d90] animate-spin" /> : "Download Image"}
              {!isDownloading && <Download className="w-4 h-4 text-[#f38d90]" />}
            </button>
          </div>

          {cardData ? (
            <div
              ref={contentRef}
              className="max-w-[700px] w-full mx-auto rounded border border-gray-200 dark:border-gray-600 px-8 py-6 bg-white dark:bg-[#0e0e0e]"
            >
              <div className="flex justify-center items-center md:flex-row flex-col w-full gap-8 lg:gap-12">
                <div className="flex flex-col items-center text-center">
                  <img
                    src={`/api/proxy-image?url=${encodeURIComponent(cardData.image)}`}
                    alt={cardData.fullName}
                    crossOrigin="anonymous"
                    className="rounded-full w-[90px] h-[90px] border-2 border-gray-200 dark:border-gray-800 object-cover"
                  />
                  <div className="mt-3">
                    <h2 className="text-2xl font-semibold text-foreground">{cardData.fullName}</h2>
                    <p className="text-muted-foreground font-mono text-sm">@{cardData.username}</p>
                  </div>
                </div>

                <div className="h-32 w-[1px] rounded bg-gray-200 dark:bg-gray-700 hidden md:block" />

                <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
                  <Circle total={cardData.totalSolved} />
                  <div className="flex flex-col gap-3">
                    <Questions type={"Easy"} solved={cardData.easySolved} total={cardData.easyTotal} line="bg-[#2db55d26]" line2="bg-[#01B8A2]" />
                    <Questions type={"Medium"} solved={cardData.mediumSolved} total={cardData.mediumTotal} line="bg-[#ffb80026]" line2="bg-[#FFC11F]" />
                    <Questions type={"Hard"} solved={cardData.hardSolved} total={cardData.hardTotal} line="bg-[#ef474326]" line2="bg-[#EF4642]" />
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Solved</p>
                  <p className="text-xl font-medium text-foreground">{cardData.totalSolved}/{cardData.totalQuestions}</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Attempted</p>
                  <p className="text-xl font-medium text-foreground">{cardData.totalAttempted}</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Acceptance</p>
                  <p className="text-xl font-medium text-[#09C4FF]">{cardData.totalSubmissionsAll > 0 ? Math.round((cardData.acSubmissionsAll / cardData.totalSubmissionsAll) * 100) : 0}%</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Global Rank</p>
                  <p className="text-xl font-medium text-foreground">{cardData.globalRank.toLocaleString()}</p>
                </div>
              </div>

              {cardData.contestRanking && (
                <div className="mt-4 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-lg p-5">
                  <h3 className="text-[13px] font-semibold text-foreground mb-5">Contest performance</h3>
                  <div className="flex flex-wrap gap-8 justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Rating</p>
                      <p className="text-xl font-medium text-foreground">{Math.round(cardData.contestRanking.rating)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Global Rank</p>
                      <p className="text-xl font-medium text-foreground">#{cardData.contestRanking.globalRanking?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Top</p>
                      <p className="text-xl font-medium text-[#F5A623]">{cardData.contestRanking.topPercentage?.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Attended</p>
                      <p className="text-xl font-medium text-foreground">{cardData.contestRanking.attendedContestsCount}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8">
                <CalendarHeatmap
                  startDate={startDate}
                  endDate={endDate}
                  values={heatmapValues}
                  transformDayElement={(element, value, index) => {
                    let color = '#1c1c1c';
                    if (value && value.count > 0) {
                      const c = Math.min(value.count, 4);
                      if (c === 1) color = '#12351F';
                      else if (c === 2) color = '#155229';
                      else if (c === 3) color = '#1E8A44';
                      else if (c === 4) color = '#29D398';
                    }
                    return React.cloneElement(element as React.ReactElement<any>, {
                      style: { fill: color, rx: 2, ry: 2 },
                    });
                  }}
                  onMouseOver={(e: any, v: any) => {
                    if (v && v.date) {
                      const rect = e.target.getBoundingClientRect();
                      setTooltip({
                        show: true,
                        content: `${v.count} submission${v.count !== 1 ? "s" : ""} on ${new Date(v.date).toDateString()}`,
                        x: rect.left + window.scrollX, y: rect.top + window.scrollY - 40
                      });
                    }
                  }}
                  onMouseLeave={() => setTooltip({ ...tooltip, show: false })}
                  gutterSize={2}
                  horizontal={true}
                />

                <h2 className="text-sm font-semibold mt-6 text-gray-400 text-center">
                  <span className="text-[#e6c705] dark:text-[#f3e58d] text-3xl font-mono">
                    {worthCalculator(cardData.streak, cardData.easySolved, cardData.mediumSolved, cardData.hardSolved, cardData.activeYears, cardData.totalActiveDays)}$
                  </span>
                  <br />
                  <span className="mt-1 block uppercase tracking-wider text-[10px]">Estimated Worth</span>
                </h2>

                <p className="text-gray-500 text-xs font-mono mt-6 flex w-full items-center justify-center flex-col md:flex-row">
                  Get Yours at:&nbsp;
                  <Link href="https://lc-interview-buddy.app" className="text-blue-400 hover:underline">
                    lc-interview-buddy.app
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[700px] h-[400px] rounded bg-[#0e0e0e] border border-gray-600 p-8 flex items-center justify-center flex-col gap-4">
              {isLeetcodeLoading ? (
                <><Loader2 className="w-8 h-8 text-gray-400 animate-spin" /><p className="text-sm text-gray-500 font-mono">Analyzing LeetCode Profile...</p></>
              ) : (
                <><AlertTriangle className="w-8 h-8 text-gray-500" /><p className="text-sm text-gray-500 font-mono">Configure a valid LeetCode username.</p></>
              )}
            </div>
          )}

          {tooltip.show && (
            <div className="absolute bg-gray-800 text-white p-2 rounded shadow-lg text-xs z-50 pointer-events-none w-max border border-gray-700 font-mono"
              style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}>
              {tooltip.content}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Settings Form */}
        <div className="lg:col-span-4 w-full">
          <div className="bg-white dark:bg-[#0e0e0e] border border-gray-200 dark:border-gray-700/80 rounded px-6 py-5 shadow-xl">
            <div className="flex items-center gap-2.5 mb-5 border-b border-gray-200 dark:border-gray-800 pb-4">
              <User className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground tracking-tight font-mono">Configuration</h2>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 rounded bg-rose-500/10 border border-rose-500/20 flex gap-2 text-rose-400 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                </motion.div>
              )}
              {successMessage && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 rounded bg-emerald-500/10 border border-emerald-500/20 flex gap-2 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4 font-mono">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-gray-500 uppercase">Display Name</Label>
                <Input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Enter your name"
                  className="bg-gray-50 dark:bg-[#1c1c1c] border-gray-200 dark:border-gray-700 text-sm text-foreground placeholder:text-gray-400 dark:placeholder:text-gray-600 h-10 rounded-sm" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] text-gray-500 uppercase">LeetCode Username</Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-600" />
                  <Input value={leetcodeUsername} onChange={e => setLeetcodeUsername(e.target.value)} placeholder="your_leetcode_username"
                    className="pl-9 bg-gray-50 dark:bg-[#1c1c1c] border-gray-200 dark:border-gray-700 text-sm text-foreground placeholder:text-gray-400 dark:placeholder:text-gray-600 h-10 rounded-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] text-gray-500 uppercase">Groq API Key (Optional)</Label>
                <div className="relative">
                  <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-600" />
                  <Input type="password" value={groqApiKey} onChange={e => setGroqApiKey(e.target.value)} placeholder="gsk_..."
                    autoComplete="off"
                    className="pl-9 bg-gray-50 dark:bg-[#1c1c1c] border-gray-200 dark:border-gray-700 text-sm text-foreground placeholder:text-gray-400 dark:placeholder:text-gray-600 h-10 rounded-sm" />
                </div>
              </div>

              <button type="submit" disabled={updateProfileMutation.isPending}
                className="w-full mt-2 h-10 rounded-sm bg-gray-900 dark:bg-gray-200 hover:bg-gray-800 dark:hover:bg-white text-background font-bold text-xs transition-colors flex items-center justify-center gap-2">
                {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                SAVE CHANGES
              </button>
            </form>
          </div>

          {/* Share Profile Card */}
          {cardData && (
            <div className="bg-white dark:bg-[#0e0e0e] border border-gray-200 dark:border-gray-700/80 rounded px-6 py-5 shadow-xl flex flex-col items-center mt-6">
              <div className="flex items-center gap-2.5 w-full mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
                <Download className="w-4 h-4 text-[#09C4FF]" />
                <h2 className="text-sm font-semibold text-foreground tracking-tight font-mono">Profile QR Code</h2>
              </div>
              <div
                ref={qrRef}
                className="bg-white p-4 rounded-xl mb-6 flex items-center justify-center shadow-2xl"
              >
                <QRCode
                  value={`https://leetcode.com/u/${cardData.username}/`}
                  size={180}
                  fgColor="#000000"
                  bgColor="#ffffff"
                  errorCorrectionLevel="H"
                />
              </div>
              <AnimatedShinyButton
                type="button"
                onClick={downloadQrAsImage}
                disabled={isDownloadingQr}
                className={`w-full max-w-[200px] mt-2 ${isDownloadingQr ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isDownloadingQr ? <Loader2 className="w-4 h-4 mr-2 text-[#67e8f9] animate-spin" /> : <Download className="w-4 h-4 mr-2 text-[#67e8f9]" />}
                <span>{isDownloadingQr ? "Downloading..." : "Download QR"}</span>
              </AnimatedShinyButton>
              <p className="text-[10px] text-gray-500 mt-4 text-center">
                Download this QR code so others can scan and visit your LeetCode profile instantly.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* OFF-SCREEN CLONE FOR FLAWLESS VERTICAL DOWNLOAD */}
      {cardData && (
        <div className="absolute top-[-9999px] left-[-9999px]">
          <div
            ref={downloadRef}
            className="w-[700px] rounded border border-gray-600 px-8 py-8 bg-[#0e0e0e] flex flex-col items-center"
          >
            <div className="flex flex-col items-center w-full">
              <div className="flex flex-col items-center mb-6">
                <img
                  src={`/api/proxy-image?url=${encodeURIComponent(cardData.image)}`}
                  alt={cardData.fullName}
                  crossOrigin="anonymous"
                  className="rounded-full w-[90px] h-[90px] border-2 border-gray-800 object-cover"
                />
                <div className="flex flex-col justify-center items-center text-center mt-3">
                  <h2 className="text-2xl font-semibold text-white">{cardData.fullName}</h2>
                  <p className="text-gray-400 font-mono text-sm">@{cardData.username}</p>
                </div>
              </div>

              <div className="flex flex-row items-center justify-center w-full gap-12 mt-2">
                <Circle total={cardData.totalSolved} />
                <div className="flex flex-col gap-3">
                  <Questions type={"Easy"} solved={cardData.easySolved} total={cardData.easyTotal} line="bg-[#2db55d26]" line2="bg-[#01B8A2]" />
                  <Questions type={"Medium"} solved={cardData.mediumSolved} total={cardData.mediumTotal} line="bg-[#ffb80026]" line2="bg-[#FFC11F]" />
                  <Questions type={"Hard"} solved={cardData.hardSolved} total={cardData.hardTotal} line="bg-[#ef474326]" line2="bg-[#EF4642]" />
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-4 gap-4 w-full">
              <div className="bg-[#111111] border border-gray-800 rounded-lg p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Solved</p>
                <p className="text-xl font-medium text-white">{cardData.totalSolved}/{cardData.totalQuestions}</p>
              </div>
              <div className="bg-[#111111] border border-gray-800 rounded-lg p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Attempted</p>
                <p className="text-xl font-medium text-white">{cardData.totalAttempted}</p>
              </div>
              <div className="bg-[#111111] border border-gray-800 rounded-lg p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Acceptance</p>
                <p className="text-xl font-medium text-[#09C4FF]">{cardData.totalSubmissionsAll > 0 ? Math.round((cardData.acSubmissionsAll / cardData.totalSubmissionsAll) * 100) : 0}%</p>
              </div>
              <div className="bg-[#111111] border border-gray-800 rounded-lg p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Global Rank</p>
                <p className="text-xl font-medium text-white">{cardData.globalRank.toLocaleString()}</p>
              </div>
            </div>

            {cardData.contestRanking && (
              <div className="mt-4 bg-[#111111] border border-gray-800 rounded-lg p-5 w-full">
                <h3 className="text-[13px] font-semibold text-gray-200 mb-5 text-center">Contest performance</h3>
                <div className="flex flex-wrap gap-8 justify-around">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Rating</p>
                    <p className="text-xl font-medium text-white">{Math.round(cardData.contestRanking.rating)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Global Rank</p>
                    <p className="text-xl font-medium text-white">#{cardData.contestRanking.globalRanking?.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Top</p>
                    <p className="text-xl font-medium text-[#F5A623]">{cardData.contestRanking.topPercentage?.toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Attended</p>
                    <p className="text-xl font-medium text-white">{cardData.contestRanking.attendedContestsCount}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 w-full">
              <CalendarHeatmap
                startDate={startDate}
                endDate={endDate}
                values={heatmapValues}
                transformDayElement={(element, value, index) => {
                  let color = '#1c1c1c';
                  if (value && value.count > 0) {
                    const c = Math.min(value.count, 4);
                    if (c === 1) color = '#12351F';
                    else if (c === 2) color = '#155229';
                    else if (c === 3) color = '#1E8A44';
                    else if (c === 4) color = '#29D398';
                  }
                  return React.cloneElement(element as React.ReactElement<any>, {
                    style: { fill: color, rx: 2, ry: 2 },
                  });
                }}
                gutterSize={2}
                horizontal={true}
              />

              <h2 className="text-sm font-semibold mt-8 text-gray-400 text-center">
                <span className="text-[#f3e58d] text-4xl font-mono">
                  {worthCalculator(cardData.streak, cardData.easySolved, cardData.mediumSolved, cardData.hardSolved, cardData.activeYears, cardData.totalActiveDays)}$
                </span>
                <br />
                <span className="mt-2 block uppercase tracking-wider text-[12px]">Estimated Worth</span>
              </h2>

              <p className="text-gray-500 text-sm font-mono mt-8 flex w-full items-center justify-center">
                Get Yours at:&nbsp;
                <span className="text-blue-400">lc-interview-buddy.app</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}