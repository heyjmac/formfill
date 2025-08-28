import React from 'react';
import { EvalsInput } from './EvalsInput';
import { EvalsSummary } from './EvalsSummary';
import { EvalsResults } from './EvalsResults';
import { EvalsCodeSnippet } from './EvalsCodeSnippet';
import { EvalsIframe } from './EvalsIframe';

export const Evals = () => {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="mx-auto max-w-4xl space-y-8 px-4">
        <header className="border-b py-6">
          <div className="text-2xl font-normal">Form Filler Playground</div>
          <p className="mt-1 text-sm text-gray-600">Playground for testing prompts</p>
        </header>
        <EvalsInput />
        <EvalsCodeSnippet />
        <EvalsSummary />
        <EvalsResults />
      </div>
      <EvalsIframe />
    </div>
  );
};
