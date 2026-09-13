// Main multilingual survey component
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSurveyStore } from '@/lib/store';
import { useAgentSurvey } from '@/hooks/useAgentSurvey';
import { LANGUAGES } from '@/lib/languages';
import type { Language } from '@/lib/languages';

interface MultilingualSurveyProps {
  householdId: string;
  initialLanguage?: Language;
}

export const MultilingualSurvey: React.FC<MultilingualSurveyProps> = ({
  householdId,
  initialLanguage = 'ta',
}) => {
  const [userInput, setUserInput] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);
  const recognitionRef = useRef<any>(null);

  const {
    language,
    setLanguage,
    progress,
    isOnline,
    setIsOnline,
    error,
    setError,
  } = useSurveyStore();

  const { question, inputType, options, isLoading, fetchNextQuestion, submitAnswer } =
    useAgentSurvey(householdId, language);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = LANGUAGES[language].code;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
      };
    }
  }, [language]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  // Load first question on mount
  useEffect(() => {
    fetchNextQuestion();
  }, []);

  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      if (voiceActive) {
        recognitionRef.current.stop();
        setVoiceActive(false);
      } else {
        recognitionRef.current.start();
        setVoiceActive(true);
      }
    }
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) return;
    await submitAnswer(userInput);
    setUserInput('');
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    if (recognitionRef.current) {
      recognitionRef.current.lang = LANGUAGES[newLanguage].code;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Muslim Welfare AI Survey
          </h1>
          <p className="text-gray-600">Household Data Collection System</p>

          {/* Status Bar */}
          <div className="mt-4 flex gap-4">
            <div>
              <span className="text-sm font-medium text-gray-700">Progress: </span>
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {!isOnline && (
              <div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-1 text-sm text-yellow-800">
                ⚠️ Offline Mode
              </div>
            )}
          </div>
        </div>

        {/* Language Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Language / மொழி தேர்வு / भाषा चुनें
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {Object.entries(LANGUAGES).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code as Language)}
                className={`px-3 py-2 rounded text-sm font-medium transition ${
                  language === code
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
        </div>

        {/* Question Display */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-800">
              {error}
            </div>
          )}

          {question ? (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {question}
              </h2>

              {/* Input based on type */}
              {inputType === 'text' && (
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="Type your answer..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isLoading}
                />
              )}

              {inputType === 'number' && (
                <input
                  type="number"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Enter a number..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isLoading}
                />
              )}

              {inputType === 'select' && options && options.length > 0 && (
                <select
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  <option value="">-- Select an option --</option>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {/* Voice Input Button */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleVoiceInput}
                  disabled={isLoading || !recognitionRef.current}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
                    voiceActive
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  🎤 {voiceActive ? 'Listening...' : 'Speak Answer'}
                </button>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !userInput.trim()}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? 'Loading...' : 'Next Question →'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500">
              {isLoading ? 'Loading question...' : 'Ready to start'}
            </div>
          )}
        </div>

        {/* Progress Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p>
            ✓ Data is automatically saved to local storage (offline mode enabled)
          </p>
          <p className="mt-2">
            ✓ When online, data will sync to the server automatically
          </p>
        </div>
      </div>
    </div>
  );
};
