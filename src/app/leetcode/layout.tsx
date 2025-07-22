"use client"
import { useQuestionStore } from '@/utils/stores/useQuestionStore'
import React, { useEffect } from 'react'
import questionsJson from '../../lib/questions.json'
import Navbar from '../_components/layout/Navbar'

function Layout({ // Renamed 'layout' to 'Layout' for React component naming convention
    children,
  }: {
    children: React.ReactNode
  } 
){
    const setQuestions = useQuestionStore((state) => state.setAllQuestions)
    const setRandomQuestion = useQuestionStore((state) => state.setRandomQuestion) // Get the new action

    useEffect(() => {
      setQuestions(questionsJson)
      setRandomQuestion() // Call setRandomQuestion after questions are loaded
    }, [setQuestions, setRandomQuestion]) // Add setRandomQuestion to dependency array
  return (
    <div>
     <Navbar/>
      {children}</div>
  )
}

export default Layout // Export the renamed component
