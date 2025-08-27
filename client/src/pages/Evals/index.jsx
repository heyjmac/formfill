import React from 'react';
import { Input } from './Input';
import { SummaryCard } from './SummaryCard';
import { MainDataSection } from './MainDataSection';

export const Evals = () => {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <header className="border-b  pb-4">
          <div className="text-2xl font-normal">Form Filler Playground</div>
          <p className="mt-1 text-sm text-gray-600">Playground for testing prompts</p>
        </header>
        {/* Input Form */}
        <Input />
        {/* Summary Card */}
        <SummaryCard />
        {/* Main Data Section */}
        <MainDataSection />
      </div>
    </div>
  );
};
