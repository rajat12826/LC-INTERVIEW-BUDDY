// src/utils/useLoadProblems.ts
"use client"
import { useQuestionsData } from '@/hooks/useQuestionsData'

export default function useLoadProblems() {
  const { data } = useQuestionsData();

  return {
    allProblems: data?.qData?.questions || [], // Note: it's qData.questions in useQuestionsData
    allCompanies: data?.qData?.allCompanies || [],
    allTopics: data?.qData?.allTopics || []
  };
}