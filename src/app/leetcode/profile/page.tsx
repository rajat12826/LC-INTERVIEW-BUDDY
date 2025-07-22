// app/profile/page.tsx
// Modern, professional profile page with enhanced UI/UX
// Inspired by Google's Material Design and contemporary web standards

'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs components

// Define types for LeetCode API responses
interface LeetCodeProfile {
  username: string;
  profile: {
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

export default function ProfilePage() {
  const { user, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('charts'); // State for active tab: 'charts' or 'submissions'

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
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    });

    // Observe changes to the 'class' attribute of the html element
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Set initial dark mode state
    setDarkMode(document.documentElement.classList.contains('dark'));

    // Cleanup observer on component unmount
    return () => observer.disconnect();
  }, []);

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
        // Fetch LeetCode Profile
        const profileResponse = await fetch(`/api/leetcode-profile/${leetcodeUsername}`);
        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          throw new Error(errorData.error || `Failed to fetch LeetCode profile for ${leetcodeUsername}`);
        }
        const profileData: LeetCodeProfile = await profileResponse.json();
        setLeetcodeProfile(profileData);

        // Fetch LeetCode Submissions
        const submissionsResponse = await fetch(`/api/leetcode-submissions/${leetcodeUsername}`);
        if (!submissionsResponse.ok) {
          const errorData = await submissionsResponse.json();
          throw new Error(errorData.error || `Failed to fetch LeetCode submissions for ${leetcodeUsername}`);
        }
        const submissionsData: LeetCodeSubmission[] = await submissionsResponse.json();
        setLeetcodeSubmissions(submissionsData);

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
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'An unexpected error occurred during update.');
    } finally {
      setSaving(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-700';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-700';
      case 'hard': return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-700';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-700/30 dark:border-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Accepted'
      ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-800/50'
      : 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-800/50';
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
    color: item.name === 'Easy' ? '#10B981' : item.name === 'Medium' ? '#F59E0B' : '#EF4444' // Tailwind colors
  }));

  const submissionTrendMap = new Map<string, { date: string; total: number; accepted: number }>();

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

  const submissionTrendData = Array.from(submissionTrendMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Colors for Pie Chart segments

  // Theme-dependent classes for Recharts
  const chartAxisColor = darkMode ? '#9CA3AF' : '#6B7280'; // gray-400 / gray-500
  const chartGridColor = darkMode ? '#374151' : '#E5E7EB'; // gray-700 / gray-200
  const chartTooltipBg = darkMode ? '#374151' : '#FFFFFF'; // gray-700 / white
  const chartTooltipText = darkMode ? '#F9FAFB' : '#111827'; // gray-50 / gray-900

  if (!isClerkLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600 font-medium dark:text-gray-300">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-lg text-red-600 dark:text-red-400">Please sign in to view your profile.</p>
      </div>
    );
  }

  const themeClasses = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    cardBg: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    headerBg: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-300' : 'text-gray-600',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    input: darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600 focus:bg-gray-600' : 'bg-gray-50 border-gray-300 hover:bg-white focus:bg-white',
    accent: darkMode ? 'bg-gray-700' : 'bg-gray-50'
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} transition-colors duration-300`}>
      {/* Header Section */}
      <div className={`${themeClasses.headerBg} shadow-lg border-b transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {userName.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="h-2 w-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${themeClasses.text}`}>Profile Dashboard</h1>
                <p className={`${themeClasses.textSecondary} mt-1`}>Manage your account and LeetCode integration</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Profile Form Section */}
          <div className="xl:col-span-1">
            <Card className={`rounded-2xl shadow-xl border p-6 backdrop-blur-sm ${themeClasses.bg}  transition-colors duration-300`}>
              <CardHeader className="p-0 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <CardTitle className={`text-xl font-semibold ${themeClasses.text}`}>Personal Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert className="mb-4">
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="mb-2">
                      Display Name
                    </Label>
                    <Input
                      type="text"
                      id="name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your display name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="leetcodeUsername" className="mb-2">
                      LeetCode Username
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        id="leetcodeUsername"
                        value={leetcodeUsername}
                        onChange={(e) => setLeetcodeUsername(e.target.value)}
                        placeholder="your_leetcode_username"
                        className="pl-12"
                      />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" />
                        </svg>
                      </div>
                    </div>
                    <p className={`mt-2 text-xs ${themeClasses.textMuted}`}>
                      Connect your LeetCode account to display your coding statistics
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving Changes...
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
          <div className="xl:col-span-3 space-y-8">
            {loadingLeetcode ? (
              <Card className="rounded-2xl shadow-lg border p-8">
                <CardContent className="flex items-center justify-center h-48 p-0">
                  <div className="text-center">
                    <Skeleton className="inline-block rounded-full h-12 w-12 mb-4" />
                    <p className={`text-lg font-medium ${themeClasses.textSecondary}`}>Loading LeetCode statistics...</p>
                  </div>
                </CardContent>
              </Card>
            ) : leetcodeError ? (
              <Alert variant="destructive" className="rounded-2xl shadow-lg border p-8">
                <AlertTitle className="flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="ml-2 text-lg font-medium">Unable to Load LeetCode Data</span>
                </AlertTitle>
                <AlertDescription className="text-center">
                  <p className={`${themeClasses.textSecondary}`}>{leetcodeError}</p>
                  <p className={`text-sm ${themeClasses.textMuted} mt-2`}>Please verify your username and ensure your profile is public.</p>
                </AlertDescription>
              </Alert>
            ) : leetcodeProfile ? (
              <>
                {/* LeetCode Profile Header */}
                <Card className={`rounded-2xl shadow-xl border p-6 backdrop-blur-sm ${themeClasses.bg} transition-colors duration-300`}>
                  <CardHeader className="p-0 mb-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
                      <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                        <div className="relative">
                          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            LC
                          </div>
                          <div className="absolute -top-1 -right-1 h-6 w-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <CardTitle className={`text-2xl font-bold ${themeClasses.text}`}>
                            {leetcodeProfile.profile.realName || leetcodeProfile.username}
                          </CardTitle>
                          <CardDescription className={`${themeClasses.textSecondary}`}>@{leetcodeProfile.username}</CardDescription>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className={`text-sm ${themeClasses.textMuted}`}>Active LeetCoder</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left lg:text-right">
                        <p className={`text-3xl font-bold ${themeClasses.text}`}>#{leetcodeProfile.profile.ranking?.toLocaleString()}</p>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>Global Ranking</p>
                        <div className="flex items-center space-x-1 mt-2">
                          <div className="flex space-x-1">
                            {[1,2,3,4].map((star) => (
                              <svg key={star} className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className={`text-xs ${themeClasses.textMuted} ml-1`}>4.0</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Enhanced Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className={`text-center p-4 ${themeClasses.accent} rounded-xl border transition-all duration-200 hover:shadow-lg hover:scale-105`}>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {leetcodeProfile.submitStats.acSubmissionNum.find(s => s.difficulty === 'All')?.count || 0}
                        </p>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>Problems Solved</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600">
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                          {leetcodeProfile.submitStats.totalSubmissionNum.find(s => s.difficulty === 'All')?.count || 0}
                        </p>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>Total Submissions</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600">
                        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">{leetcodeProfile.profile.reputation?.toLocaleString() || 'N/A'}</p>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>Reputation</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600">
                        <p className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-1">
                          {Math.round(((leetcodeProfile.submitStats.acSubmissionNum.find(s => s.difficulty === 'All')?.count || 0) / Math.max(leetcodeProfile.submitStats.totalSubmissionNum.find(s => s.difficulty === 'All')?.count || 1, 1)) * 100)}%
                        </p>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>Acceptance Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs for Charts/Submissions */}
                <Tabs defaultValue="charts" value={activeTab} onValueChange={setActiveTab} className={`w-full ${themeClasses.bg}`}>
                  <TabsList className={`grid w-full grid-cols-2 mb-6 dark:bg-gray-800 `}>
                    <TabsTrigger value="charts">Charts</TabsTrigger>
                    <TabsTrigger value="submissions">Submissions</TabsTrigger>
                  </TabsList>
                  <TabsContent value="charts" className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Difficulty Distribution Pie Chart */}
                      <Card className={`rounded-2xl shadow-xl border p-6 backdrop-blur-sm ${themeClasses.bg} transition-colors duration-300`}>
                        <CardHeader className="p-0 mb-4">
                          <CardTitle className={`text-xl font-semibold ${themeClasses.text} flex items-center`}>
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center mr-3">
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            Problems by Difficulty
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="h-64 p-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {pieChartData?.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: chartTooltipBg, borderColor: chartGridColor, color: chartTooltipText }} itemStyle={{ color: chartTooltipText }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Submission Comparison Bar Chart */}
                      <Card className={`rounded-2xl shadow-xl border p-6 ${themeClasses.bg} backdrop-blur-sm transition-colors duration-300`}>
                        <CardHeader className="p-0 mb-4">
                          <CardTitle className={`text-xl font-semibold ${themeClasses.text} flex items-center`}>
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center mr-3">
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            Submissions by Difficulty
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="h-64 p-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={difficultyData}>
                              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                              <XAxis dataKey="name" stroke={chartAxisColor} tick={{ fill: chartAxisColor }} />
                              <YAxis stroke={chartAxisColor} tick={{ fill: chartAxisColor }} />
                              <Tooltip contentStyle={{ backgroundColor: chartTooltipBg, borderColor: chartGridColor, color: chartTooltipText }} itemStyle={{ color: chartTooltipText }} />
                              <Bar dataKey="solved" fill="#8884d8" name="Solved" />
                              <Bar dataKey="total" fill="#82ca9d" name="Total Submissions" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Submission Trend Line Chart */}
                      {submissionTrendData.length > 0 && (
                        <Card className={`rounded-2xl shadow-xl border p-6 backdrop-blur-sm ${themeClasses.bg} transition-colors duration-300 lg:col-span-2`}>
                          <CardHeader className="p-0 mb-4">
                            <CardTitle className={`text-xl font-semibold ${themeClasses.text} flex items-center`}>
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center mr-3">
                                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              Submission Trend
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="h-64 p-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={submissionTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                <XAxis dataKey="date" stroke={chartAxisColor} tick={{ fill: chartAxisColor }} />
                                <YAxis stroke={chartAxisColor} tick={{ fill: chartAxisColor }} />
                                <Tooltip contentStyle={{ backgroundColor: chartTooltipBg, borderColor: chartGridColor, color: chartTooltipText }} itemStyle={{ color: chartTooltipText }} />
                                <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total Submissions" activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="accepted" stroke="#82ca9d" name="Accepted Submissions" />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="submissions" className=" space-y-8">
                    {leetcodeSubmissions.length > 0 ? (
                      <Card className={`rounded-2xl shadow-xl border ${themeClasses.bg} p-6 backdrop-blur-sm transition-colors duration-300`}>
                        <CardHeader className="p-0 mb-6">
                          <CardTitle className={`text-xl font-semibold ${themeClasses.text} flex items-center`}>
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center mr-3">
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            </div>
                            Recent Submissions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="space-y-3">
                            {leetcodeSubmissions.slice(0, 10).map((submission, index) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 border border-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">{submission.title}</h4>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <span className={`px-2 py-1 rounded-full text-xs w-24 font-medium ${getStatusColor(submission.statusDisplay)}`}>
                                      {submission.statusDisplay}
                                    </span>
                                    <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded-full dark:bg-gray-500 dark:text-gray-200">
                                      {submission.lang}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(parseInt(submission.timestamp) * 1000).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <a
                                  href={`https://leetcode.com${submission.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-4 inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-400 transition-colors duration-200 shadow-sm dark:bg-gray-700 dark:text-blue-400 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:border-blue-300"
                                >
                                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  View
                                </a>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Alert className="rounded-2xl shadow-lg border p-8">
                        <AlertTitle className="flex items-center justify-center mb-4">
                          <svg className="h-8 w-8 text-gray-400 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="ml-2 text-lg font-medium">No Submissions Found</span>
                        </AlertTitle>
                        <AlertDescription className="text-center">
                          <p className={`${themeClasses.textSecondary}`}>No recent LeetCode submissions found for "{leetcodeUsername}".</p>
                          <p className={`text-sm ${themeClasses.textMuted} mt-1`}>Make sure your LeetCode profile is public and you have recent activity.</p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            ) : leetcodeUsername ? ( // If username is set but no profile, and not loading/error, means no data
              <Alert className="rounded-2xl shadow-lg border p-8">
                <AlertTitle className="flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-gray-400 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="ml-2 text-lg font-medium">No Data Found</span>
                </AlertTitle>
                <AlertDescription className="text-center">
                  <p className={`${themeClasses.textSecondary}`}>No LeetCode profile data found for "{leetcodeUsername}".</p>
                  <p className={`text-sm ${themeClasses.textMuted} mt-1`}>Please verify the username is correct and your profile is public.</p>
                </AlertDescription>
              </Alert>
            ) : ( // No LeetCode username set at all
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-8 shadow-lg dark:from-blue-900/30 dark:to-purple-900/30 dark:border-blue-800">
                <CardContent className="text-center py-6 p-0">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4 shadow-md dark:bg-blue-800/50">
                    <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <CardTitle className={`text-xl font-semibold ${themeClasses.text} mb-2`}>Connect Your LeetCode</CardTitle>
                  <CardDescription className={`${themeClasses.textSecondary} mb-4`}>
                    Link your LeetCode username to see detailed statistics, recent submissions, and track your coding progress.
                  </CardDescription>
                  <div className={`space-y-2 text-sm text-blue-600 dark:text-blue-400`}>
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span>View your coding statistics</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Track progress over time</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
            }
          </div>
        </div>
      </div>
    </div>
  );
}
