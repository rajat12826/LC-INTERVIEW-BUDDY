// src/utils/useLoadPremiumProblems.ts
"use client"
import { useEffect, useState } from 'react'
import { useQuestionStore } from '@/utils/stores/useQuestionStore'
import { useQuestionsData } from '@/hooks/useQuestionsData'

type PremiumProblem = {
  id: string; // Extracted from the link for routing/identification
  title: string;
  link: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  steps?: string[];
  illustration?: string;
  note?: string;
  key_points?: string[];
  examples: Array<{
    input: string;
    output: string | number;
    explanation?: string;
    image?: string;
  }>;
  constraints: string[];
};



export default function useLoadPremiumProblems() {

  const { data } = useQuestionsData();
  const premiumQuestionsRaw = data?.pData || [];
  const getQuestionIdFromUrl = useQuestionStore((state) => state.getQuestionIdFromUrl);


  const [premiumProblems, setPremiumProblems] = useState<PremiumProblem[]>([]);


  useEffect(() => {

    if (!premiumQuestionsRaw || premiumQuestionsRaw.length === 0) {
      setPremiumProblems([]); // Ensure state is cleared if data goes away
      return;
    }

    try {
      // Map the raw PQuestion data to the PremiumProblem format
      // console.log(premiumQuestionsRaw);
      
      const processedProblems: PremiumProblem[] = premiumQuestionsRaw.map((pQuestion) => ({
        id: getQuestionIdFromUrl(pQuestion.link), // Use the store's utility to get a clean ID
        title: pQuestion.title,
        link: pQuestion.link,
        difficulty: pQuestion.difficulty,
        description: pQuestion.description,
        steps: pQuestion.steps,
        illustration: pQuestion.illustration,
        note: pQuestion.note,
        key_points: pQuestion.key_points,
        examples: pQuestion.examples,
        constraints: pQuestion.constraints,
      }));


      setPremiumProblems(processedProblems);
    } catch (error) {
      console.error("Error processing premium questions:", error);
      setPremiumProblems([]); // Clear problems on error to prevent inconsistent state
    }
  }, [premiumQuestionsRaw, getQuestionIdFromUrl]); // Re-run effect if raw data or utility changes

  return { premiumProblems }; // Return the processed list of premium problems
}