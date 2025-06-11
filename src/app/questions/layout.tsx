"use client"
import { useQuestionStore } from '@/utils/stores/useQuestionStore'
import React, { useEffect } from 'react'
import questionsJson from '../../lib/questions.json'
function layout({
    children,
  }: {
    children: React.ReactNode
  } 
){
    const setQuestions = useQuestionStore((state) => state.setAllQuestions)

    useEffect(() => {
      setQuestions(questionsJson)
    }, [])
  return (
    <div>{children}</div>
  )
}

export default layout