"use client"
import { useQuestionStore } from '@/utils/stores/useQuestionStore'
import React, { useEffect } from 'react'
import Navbar from '../_components/layout/Navbar'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@/providers/NavigationProvider'
import LoadingProblems from './loading'
import LoadingPremium from './premium/loading'
import LoadingDaily from './daily/loading'
import LoadingRandom from './random/loading'
import LoadingProfile from './profile/loading'

function RouteSkeleton({ targetPath }: { targetPath: string | null }) {
    if (targetPath?.includes('/profile')) return <LoadingProfile />;
    if (targetPath?.includes('/daily')) return <LoadingDaily />;
    if (targetPath?.includes('/random')) return <LoadingRandom />;
    if (targetPath?.includes('/premium')) return <LoadingPremium />;
    return <LoadingProblems />;
}

function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    const setQuestions = useQuestionStore((state) => state.setAllQuestions)
    const setPQuestions = useQuestionStore((state) => state.setPremiumQuestions)
    const setRandomQuestion = useQuestionStore((state) => state.setRandomQuestion)
    const { isNavigating, targetPath } = useNavigation()

    // staleTime: Infinity means this only runs once per session — never on tab switch
    const { data, isLoading, error } = useQuery({
        queryKey: ['questionsData'],
        queryFn: async () => {
            const [qRes, pRes] = await Promise.all([
                fetch('/api/questions'),
                fetch('/api/premiumQ')
            ]);
            if (!qRes.ok || !pRes.ok) throw new Error('Failed to fetch questions');

            const qData = await qRes.json();
            const pData = await pRes.json();
            return { qData, pData };
        },
        staleTime: Infinity,
    });

    // Sync fetched data into the Zustand store once available
    useEffect(() => {
        if (!data) return;
        // /api/questions returns { questions, problems, allCompanies, allTopics }
        if (data.qData?.questions?.length) {
            setQuestions(data.qData.questions);
            setRandomQuestion();
        }
        // /api/premiumQ returns a flat array
        if (Array.isArray(data.pData) && data.pData.length) {
            setPQuestions(data.pData);
        }
    }, [data, setQuestions, setPQuestions, setRandomQuestion]);

    return (
        <div>
            <Navbar />

            {isLoading ? (
                <LoadingProblems />
            ) : error ? (
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)] text-rose-500 font-medium">
                    Error loading problem sets. Please refresh the page.
                </div>
            ) : isNavigating ? (
                <RouteSkeleton targetPath={targetPath} />
            ) : (
                children
            )}
        </div>
    )
}

export default Layout