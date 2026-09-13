// Home page - Survey entry
import React, { useState } from 'react';
import { MultilingualSurvey } from '@/components/MultilingualSurvey';
import type { Language } from '@/lib/languages';

export default function Home() {
  const [surveyStarted, setSurveyStarted] = useState(false);
  const [householdId, setHouseholdId] = useState('');
  const [enumeratorId, setEnumeratorId] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('ta');

  const handleStartSurvey = () => {
    if (!householdId.trim() || !enumeratorId.trim()) {
      alert('Please enter household ID and enumerator ID');
      return;
    }
    setSurveyStarted(true);
  };

  if (surveyStarted) {
    return <MultilingualSurvey householdId={householdId} initialLanguage={selectedLanguage} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">
          Muslim Welfare
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Household Survey - Multilingual AI System
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStartSurvey();
          }}
          className="space-y-6"
        >
          {/* Household ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Household ID
            </label>
            <input
              type="text"
              value={householdId}
              onChange={(e) => setHouseholdId(e.target.value)}
              placeholder="e.g., HH-TN-001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Enumerator ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enumerator ID
            </label>
            <input
              type="text"
              value={enumeratorId}
              onChange={(e) => setEnumeratorId(e.target.value)}
              placeholder="e.g., EN001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Survey Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as Language)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ta">Tamil (தமிழ்)</option>
              <option value="en">English</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="ur">Urdu (اردو)</option>
              <option value="te">Telugu (తెలుగు)</option>
              <option value="ml">Malayalam (മലയാളം)</option>
            </select>
          </div>

          {/* Start Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Start Survey
          </button>
        </form>

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
          <p className="font-semibold mb-2">✓ Key Features:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>6 languages (Tamil, English, Hindi, Urdu, Telugu, Malayalam)</li>
            <li>Voice input & output</li>
            <li>Works offline</li>
            <li>AI-powered interview flow</li>
            <li>Real-time validation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
