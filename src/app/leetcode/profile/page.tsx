// app/profile/page.tsx
// Redesigned with distinctive UI following Master Design System principles
// Clean, bold, and memorable interface with React Bits-inspired components

'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const DynamicDifficultyPieChart = dynamic(() => import('@/app/_components/charts/DifficultyPieChart'), {
  ssr: false,
  loading: () => <div className="w-full h-64 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 animate-pulse" />,
});

const DynamicSubmissionBarChart = dynamic(() => import('@/app/_components/charts/SubmissionBarChart'), {
  ssr: false,
  loading: () => <div className="w-full h-64 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 animate-pulse" />,
});

const DynamicSubmissionLineChart = dynamic(() => import('@/app/_components/charts/SubmissionLineChart'), {
  ssr: false,
  loading: () => <div className="w-full h-64 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 animate-pulse" />,
});

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { profile } from 'console';
import Image from 'next/image';

// Define types for LeetCode API responses
interface LeetCodeProfile {
  username: string;
  profile: {
    userAvatar?:string;
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
    acSubmissionNum: { difficulty: string; count: number; submissions: number }[];
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

// Animated Grid Background Component
const GridBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]" />
    <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[600px] w-[600px] rounded-full bg-blue-400/20 blur-[100px] dark:bg-blue-600/10" />
  </div>
);

// Animated Stat Card Component
const StatCard = ({
  value,
  label,
  icon,
  color = "emerald",
  delay = 0
}: {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  color?: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const colorClasses = {
    emerald: "from-blue-500 to-teal-500 dark:from-blue-400 dark:to-teal-400",
    amber: "from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400",
    rose: "from-rose-500 to-pink-500 dark:from-rose-400 dark:to-pink-400",
    violet: "from-violet-500 to-purple-500 dark:from-violet-400 dark:to-purple-400",
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-700/60 p-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 ${isVisible ? 'opacity-100 tranzinc-y-0' : 'opacity-0 tranzinc-y-4'
        }`}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent dark:from-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} shadow-lg`}>
          {icon}
        </div>
      </div>

      {/* Animated border shimmer */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
};

// Animated Badge Component
const AnimatedBadge = ({
  children,
  variant = "default"
}: {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "default";
}) => {
  const variants = {
    success: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    warning: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    error: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800",
    default: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300 hover:scale-105 ${variants[variant]}`}>
      {children}
    </span>
  );
};

export default function ProfilePage() {
  const { user, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('charts');

  // Form states
  const [userName, setUserName] = useState<string>('');
  const [leetcodeUsername, setLeetcodeUsername] = useState<string>('');

  // LeetCode data states
  const [leetcodeProfile, setLeetcodeProfile] = useState<LeetCodeProfile | null>(null);
  const [leetcodeSubmissions, setLeetcodeSubmissions] = useState<LeetCodeSubmission[]>([]);
  const [loadingLeetcode, setLoadingLeetcode] = useState(false);
  const [leetcodeError, setLeetcodeError] = useState<string | null>(null);

  // State to track dark mode dynamically based on html class
  const [darkMode, setDarkMode] = useState(false);

  // Effect to listen for changes to the 'dark' class on the html element
  // useEffect(() => {
  //   const observer = new MutationObserver(() => {
  //     setDarkMode(document.documentElement.classList.contains('dark'));
  //   });

  //   observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  //   setDarkMode(document.documentElement.classList.contains('dark'));

  //   return () => observer.disconnect();
  // }, []);

  // Fetch user profile from Supabase on component mount
  useEffect(() => {
    async function fetchUserProfile() {
      if (!isClerkLoaded || !isSignedIn) {
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error fetching user profile:', errorData.error);
          setUserName(user?.firstName || user?.emailAddresses[0].emailAddress || '');
          setLeetcodeUsername('');
          setError(errorData.error || 'Failed to load profile data.');
        } else {
          const data: UserProfile = await response.json();
          setUserName(data.name || user?.firstName || user?.emailAddresses[0].emailAddress || '');
          setLeetcodeUsername(data.leetcode_username || '');
        }
      } catch (err: any) {
        console.error('Network or unexpected error fetching user profile:', err);
        setError(err.message || 'An unexpected error occurred while loading profile data.');
        setUserName(user?.firstName || user?.emailAddresses[0].emailAddress || '');
        setLeetcodeUsername('');
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [isClerkLoaded, isSignedIn, user]);

  // Fetch LeetCode data when leetcodeUsername changes
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
        const profileResponse = await fetch(`/api/leetcode-profile/${leetcodeUsername}`);
        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          throw new Error(errorData.error || `Failed to fetch LeetCode profile for ${leetcodeUsername}`);
        }
        const profileData: LeetCodeProfile = await profileResponse.json();
        setLeetcodeProfile(profileData);

        const submissionsResponse = await fetch(`/api/leetcode-submissions/${leetcodeUsername}`);
        if (!submissionsResponse.ok) {
          const errorData = await submissionsResponse.json();
          throw new Error(errorData.error || `Failed to fetch LeetCode submissions for ${leetcodeUsername}`);
        }
           const response2=await fetch(`/api/leetcode-similar/two-sum?depth=2`,{
        method:'GET',
         headers: {
          'Content-Type': 'application/json',
        },
      })
      console.log(response2.json());
        const submissionsData: any = await submissionsResponse.json();
        setLeetcodeSubmissions(submissionsData?.submissions);

      } catch (err: any) {
        console.error('Error fetching LeetCode data:', err);
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
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: userName, leetcodeUsername }),
      });
   
      

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile.');
      }

      setSuccessMessage('Profile updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'An unexpected error occurred during update.');
    } finally {
      setSaving(false);
    }
  };

  // Prepare chart data
  const difficultyData = leetcodeProfile?.submitStats.acSubmissionNum
    .filter(s => s.difficulty !== 'All')
    .map(stat => ({
      name: stat.difficulty,
      solved: stat.count,
      total: leetcodeProfile?.submitStats.totalSubmissionNum.find(t => t.difficulty === stat.difficulty)?.count || 0
    }));

  const pieChartData = difficultyData?.map(item => ({
    name: item.name,
    value: item.solved,
    color: item.name === 'Easy' ? '#10B981' : item.name === 'Medium' ? '#F59E0B' : '#EF4444'
  }));

  const submissionTrendMap = new Map<string, { date: string; total: number; accepted: number }>();

  if (Array.isArray(leetcodeSubmissions)) {
    leetcodeSubmissions.forEach(submission => {
      const date = new Date(parseInt(submission.timestamp) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!submissionTrendMap.has(date)) {
        submissionTrendMap.set(date, { date, total: 0, accepted: 0 });
      }
      const entry = submissionTrendMap.get(date)!;
      entry.total += 1;
      if (submission.statusDisplay === 'Accepted') {
        entry.accepted += 1;
      }
    });
  }

  const submissionTrendData = Array.from(submissionTrendMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!isClerkLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-zinc-200 border-t-blue-500 dark:border-zinc-800 dark:border-t-blue-400 mb-6"></div>
          <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <GridBackground />

      {/* Hero Header */}
      <div className="relative border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Avatar with gradient ring */}
              <div className="relative group">
          {
  leetcodeProfile?.profile?.userAvatar ? (
    <div className="relative h-20 w-20 rounded-full overflow-hidden">
      <Image
        src={leetcodeProfile.profile.userAvatar}
        alt={userName?.charAt(0).toUpperCase() || 'U'}
        width={80}
        height={80}
        className="rounded-full object-cover"
        priority
      />
    </div>
  ) : (
    <div className="relative h-20 w-20">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-teal-500 to-blue-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
      <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
        {userName?.charAt(0).toUpperCase() || 'U'}
      </div>
    </div>
  )
}

              </div>

              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 dark:from-white dark:via-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent mb-2">
                  {userName || 'Your Profile'}
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                  Manage your coding journey
                </p>
              </div>
            </div>

            {leetcodeProfile && (
              <div className="flex items-center gap-3">
                <AnimatedBadge variant="success">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                  Active
                </AnimatedBadge>
                <div className="text-right">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    #{leetcodeProfile.profile.ranking?.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Global Rank</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Sidebar - Profile Settings */}
          <div className="lg:col-span-4">
            <Card className="border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-teal-600">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Profile Settings
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-rose-200 dark:border-rose-800">
                    <AlertTitle className="font-semibold">Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
                    <AlertTitle className="font-semibold text-blue-900 dark:text-blue-100">Success</AlertTitle>
                    <AlertDescription className="text-blue-800 dark:text-blue-200">{successMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      Display Name
                    </Label>
                    <Input
                      type="text"
                      id="name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your name"
                      className="border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leetcodeUsername" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      LeetCode Username
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        id="leetcodeUsername"
                        value={leetcodeUsername}
                        onChange={(e) => setLeetcodeUsername(e.target.value)}
                        placeholder="your_leetcode_username"
                        className="pl-10 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                      Connect your LeetCode to track your progress
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {loadingLeetcode ? (
              <Card className="border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
                <CardContent className="flex flex-col items-center justify-center h-64 p-12">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-zinc-200 border-t-blue-500 dark:border-zinc-800 dark:border-t-blue-400 mb-6"></div>
                  <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">Loading LeetCode data...</p>
                </CardContent>
              </Card>
            ) : leetcodeError ? (
              <Alert variant="destructive" className="border-rose-200 dark:border-rose-800 p-8">
                <AlertTitle className="text-lg font-semibold mb-2">Unable to Load LeetCode Data</AlertTitle>
                <AlertDescription className="text-zinc-700 dark:text-zinc-300">
                  {leetcodeError}
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                    Please verify your username and ensure your profile is public.
                  </p>
                </AlertDescription>
              </Alert>
            ) : leetcodeProfile ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatCard
                    value={leetcodeProfile.submitStats.acSubmissionNum.find(s => s.difficulty === 'All')?.count || 0}
                    label="Problems Solved"
                    color="emerald"
                    delay={100}
                    icon={
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />

                  <StatCard
                    value={leetcodeProfile.submitStats.totalSubmissionNum.find(s => s.difficulty === 'All')?.count || 0}
                    label="Total Submissions"
                    color="amber"
                    delay={200}
                    icon={
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    }
                  />

                  <StatCard
                    value={leetcodeProfile.profile.reputation?.toLocaleString() || 'N/A'}
                    label="Reputation"
                    color="violet"
                    delay={300}
                    icon={
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    }
                  />

                  <StatCard
                    value={`${Math.round(((leetcodeProfile.submitStats.acSubmissionNum.find(s => s.difficulty === 'All')?.count || 0) / Math.max(leetcodeProfile.submitStats.totalSubmissionNum.find(s => s.difficulty === 'All')?.count || 1, 1)) * 100)}%`}
                    label="Acceptance Rate"
                    color="rose"
                    delay={400}
                    icon={
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    }
                  />
                </div>

                {/* Tabs for Charts/Submissions */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 p-1">
                    <TabsTrigger
                      value="charts"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-600 data-[state=active]:text-white font-semibold rounded-lg transition-all"
                    >
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger
                      value="submissions"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-600 data-[state=active]:text-white font-semibold rounded-lg transition-all"
                    >
                      Submissions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="charts" className="mt-8 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <Card className="border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
                        <CardHeader>
                          <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            Difficulty Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="h-64">
                          {pieChartData && pieChartData.length > 0 ? (
                            <DynamicDifficultyPieChart data={pieChartData} darkMode={darkMode} />
                          ) : (
                            <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
                              No data available
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
                        <CardHeader>
                          <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                            Submissions Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="h-64">
                          {difficultyData && difficultyData.length > 0 ? (
                            <DynamicSubmissionBarChart data={difficultyData} darkMode={darkMode} />
                          ) : (
                            <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
                              No data available
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {submissionTrendData.length > 0 && (
                        <Card className="lg:col-span-2 border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
                          <CardHeader>
                            <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
                              Activity Trend
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="h-64">
                            <DynamicSubmissionLineChart data={submissionTrendData} darkMode={darkMode} />
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="submissions" className="mt-8">
                    {leetcodeSubmissions.length > 0 ? (
                      <Card className="border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
                        <CardHeader>
                          <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                            Recent Activity
                          </CardTitle>
                          <CardDescription className="text-zinc-600 dark:text-zinc-400">
                            Your latest {leetcodeSubmissions.slice(0, 10).length} submissions
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {leetcodeSubmissions.slice(0, 10).map((submission, index) => (
                            <div
                              key={index}
                              className="group flex items-center justify-between p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-zinc-50/50 dark:bg-zinc-800/50 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                            >
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-zinc-900 dark:text-white mb-2 truncate">
                                  {submission.title}
                                </h4>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <AnimatedBadge variant={submission.statusDisplay === 'Accepted' ? 'success' : 'error'}>
                                    {submission.statusDisplay}
                                  </AnimatedBadge>
                                  <AnimatedBadge variant="default">
                                    {submission.lang}
                                  </AnimatedBadge>
                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {new Date(parseInt(submission.timestamp) * 1000).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <a
                                href={`https://leetcode.com${submission.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                              >
                                <span>View</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ) : (
                      <Alert className="border-zinc-200 dark:border-zinc-800 p-8">
                        <AlertTitle className="text-lg font-semibold mb-2 text-zinc-900 dark:text-white">
                          No Submissions Found
                        </AlertTitle>
                        <AlertDescription className="text-zinc-600 dark:text-zinc-400">
                          No recent submissions found for "{leetcodeUsername}". Make sure your profile is public.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            ) : leetcodeUsername ? (
              <Alert className="border-zinc-200 dark:border-zinc-800 p-8">
                <AlertTitle className="text-lg font-semibold mb-2 text-zinc-900 dark:text-white">
                  No Data Found
                </AlertTitle>
                <AlertDescription className="text-zinc-600 dark:text-zinc-400">
                  Could not find LeetCode profile for "{leetcodeUsername}". Please verify the username.
                </AlertDescription>
              </Alert>
            ) : (
              <Card className="border-blue-200/60 dark:border-blue-800/60 bg-gradient-to-br from-blue-50/50 to-teal-50/50 dark:from-blue-950/20 dark:to-teal-950/20 backdrop-blur-xl">
                <CardContent className="text-center py-16 px-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-600 mb-6 shadow-xl">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>

                  <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
                    Connect Your LeetCode
                  </CardTitle>

                  <CardDescription className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
                    Link your LeetCode account to unlock detailed analytics, track your progress, and visualize your coding journey.
                  </CardDescription>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Track Progress</span>
                    </div>

                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                      <span>View Analytics</span>
                    </div>

                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span>Monitor Growth</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}