
"use client"
import { useQuestionStore } from '@/utils/stores/useQuestionStore'
import React, { useEffect, useState } from 'react'
import Navbar from '../_components/layout/Navbar'

function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    const setQuestions = useQuestionStore((state) => state.setAllQuestions)
    const setPQuestions = useQuestionStore((state) => state.setPremiumQuestions)
    const setRandomQuestion = useQuestionStore((state) => state.setRandomQuestion)
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
              
                const response = await fetch('/api/questions');
                const responseP = await fetch('/api/premiumQ');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                if (!responseP.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json(); // Parse the JSON response
                const dataP = await responseP.json(); 
                setQuestions(data);
                setPQuestions(dataP) // Set questions in Zustand store
                setRandomQuestion(); // Set random question after all questions are loaded
            } catch (err: any) {
                console.error("Failed to load questions:", err);
                setError("Failed to load questions. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuestions();
    }, [setQuestions, setRandomQuestion]); // Dependency array remains the same

    if (isLoading) {
        return (
            <div>
                <Navbar />
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                    Loading questions...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Navbar />
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)] text-red-600">
                    Error: {error}
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            {children}
        </div>
    )
}

export default Layout