"use client"
import { Lightbulb, ShieldAlert, Volume2 } from 'lucide-react'
import React from 'react'
const QuestionsSection = ({mockInterviewQuestion,activeQuestionIndex,proctoringState,interviewTerminated}) => {
  console.log("🚀 ~ file: QuestionsSection.jsx:4 ~ QuestionsSection ~ mockInterviewQuestion:", mockInterviewQuestion);
  const textToSpeach=(text)=>{
if('speechSynthesis' in window){
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech)
}else{
    alert("Sorry, your browser does not support text to speech")
}
  }
  return mockInterviewQuestion && (
    <div className='p-5 border rounded-lg my-10'>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'>
            {mockInterviewQuestion && mockInterviewQuestion.map((question,index)=>(
                <h2 className={`p-2 bg-secondary rounded-full text-xs md:text-sm text-center cursor-pointer ${activeQuestionIndex == index && 'bg-blue-700 text-white'}`}>Question #{index+1}</h2>
            ))}
        </div>
            <h2 className='my-5 text-md md:text-lg'>
                {mockInterviewQuestion[activeQuestionIndex]?.question}
            </h2>
            <Volume2 className='cursor-pointer' onClick={()=>textToSpeach(mockInterviewQuestion[activeQuestionIndex]?.question)}/>
            <div className='border rounded-lg p-5 bg-blue-100 mt-20'>
                <h2 className='flex gap-2 items-center text-primary'>
                    <Lightbulb/>
                    <strong>Note:</strong>
                </h2>
                <h2 className='text-sm text-primary my-2'>Enable Video Web Cam and Microphone to start your AI interview. Stay visible, stay centered, and avoid switching tabs. Repeated warnings can terminate the interview.</h2>
            </div>
            <div className='border rounded-lg p-5 bg-amber-50 mt-4'>
                <h2 className='flex gap-2 items-center text-amber-700'>
                    <ShieldAlert/>
                    <strong>Interview Monitoring</strong>
                </h2>
                <h2 className='text-sm text-amber-800 my-2'>
                  Warnings: {proctoringState?.warningsCount || 0}/3. Monitoring mode: {proctoringState?.monitoringSupported ? 'active' : 'limited in this browser'}.
                </h2>
                {interviewTerminated && (
                  <h2 className='text-sm font-semibold text-red-700'>This interview has been terminated due to repeated monitoring violations.</h2>
                )}
            </div>
    </div>
  )
}

export default QuestionsSection
