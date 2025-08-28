import React from 'react';
import { EvalsInput } from './EvalsInput';
import { EvalsSummary } from './EvalsSummary';
import { EvalsResults } from './EvalsResults';
import { EvalsCodeSnippet } from './EvalsCodeSnippet';
import { EvalsIframe } from './EvalsIframe';

export const Evals = () => {
  return (
    <div className="flex h-screen bg-white">
      <div className="flex-1 overflow-y-scroll px-4">
        <div className="mx-auto max-w-4xl space-y-8 p-2 ">
          <header className="border-b py-6">
            <div className="text-2xl font-normal">Form Filler Playground</div>
            <p className="mt-1 text-sm text-gray-600">Playground for testing prompts</p>
          </header>
          <EvalsInput />
          <EvalsCodeSnippet />
          <EvalsSummary />
          <EvalsResults />
        </div>
      </div>
      <EvalsIframe />
    </div>
  );
};
