// Hook for interacting with agent API
import { useCallback, useState } from 'react';
import { useSurveyStore } from '@/lib/store';
import type { Language } from '@/lib/languages';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface AgentResponse {
  execution_id: string;
  section: string;
  language: string;
  question: string;
  input_type: string;
  options?: string[];
  skip_logic?: any;
  follow_up?: string;
  progress: number;
}

export function useAgentSurvey(householdId: string, language: Language) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    currentSection,
    currentQuestion,
    setCurrentQuestion,
    setCurrentSection,
    setProgress,
    setError: setStoreError,
  } = useSurveyStore();

  const fetchNextQuestion = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<AgentResponse>(
        `${API_URL}/api/agents/execute`,
        {
          household_id: householdId,
          section: currentSection,
          language: language,
          previous_answer: null,
        },
        {
          timeout: 10000,
        }
      );

      setCurrentQuestion({
        question: response.data.question,
        inputType: response.data.input_type,
        options: response.data.options,
      });

      setProgress(response.data.progress);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch question';
      setError(errorMessage);
      setStoreError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [householdId, currentSection, language, setCurrentQuestion, setProgress, setStoreError]);

  const submitAnswer = useCallback(
    async (answer: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.post<AgentResponse>(
          `${API_URL}/api/agents/execute`,
          {
            household_id: householdId,
            section: currentSection,
            language: language,
            previous_answer: answer,
          },
          {
            timeout: 10000,
          }
        );

        setCurrentQuestion({
          question: response.data.question,
          inputType: response.data.input_type,
          options: response.data.options,
        });

        setProgress(response.data.progress);

        // Check if we should move to next section
        if (response.data.section !== currentSection) {
          setCurrentSection(response.data.section);
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to submit answer';
        setError(errorMessage);
        setStoreError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [householdId, currentSection, language, setCurrentQuestion, setProgress, setCurrentSection, setStoreError]
  );

  return {
    question: currentQuestion?.question || '',
    inputType: currentQuestion?.inputType || 'text',
    options: currentQuestion?.options || [],
    isLoading,
    error,
    fetchNextQuestion,
    submitAnswer,
  };
}
