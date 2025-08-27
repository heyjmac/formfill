import React from 'react';
import { EvalsInput } from './EvalsInput';
import { EvalsSummary } from './EvalsSummary';
import { EvalsResults } from './EvalsResults';
import { EvalsCodeSnippet } from './EvalsCodeSnippet';

export const Evals = () => {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="border-b  pb-4">
          <div className="text-2xl font-normal">Form Filler Playground</div>
          <p className="mt-1 text-sm text-gray-600">Playground for testing prompts</p>
        </header>
        <EvalsInput />
        <EvalsCodeSnippet />
        <EvalsSummary />
        <EvalsResults />
      </div>
    </div>
  );
};
