import React, { useEffect, useState } from 'react';
import { events } from '../../ai-components/utils/events';

export const MainDataSection = () => {
  const [input, setInput] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    events.on('evals:summary', setInput);
    events.on('evals:results', setResults);
    return () => {
      events.off('evals:summary', setInput);
      events.off('evals:results', setResults);
    };
  }, []);

  if (!input || results.length === 0) return null;

  return (
    <div className="space-y-10">
      <h2 className="mb-4 text-lg font-normal">Processing Runs</h2>
      <div className="space-y-4">
        {results.map((run, i) => (
          <details key={i} className="group rounded border border-neutral-300">
            <summary className="flex cursor-pointer items-center justify-between p-4">
              <div className="flex items-center">
                <span className="material-symbols-outlined mr-2 text-gray-600">analytics</span>
                <span>{`Iteration ${run.run}`}</span>
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>
                  Response Time: {run.latency_ms ? (run.latency_ms / 1000).toFixed(2) + 's' : '—'}
                </span>
                <span className="material-symbols-outlined text-gray-400 transition-transform group-open:rotate-180">
                  expand_more
                </span>
              </div>
            </summary>

            <div className="border-t border-neutral-300 p-4">
              {run.ok && run.compare?.details ? (
                <>
                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-500">Precision</p>
                      <p>{(run.precision * 100).toFixed(2)}%}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Recall</p>
                      <p>{(run.recall * 100).toFixed(2)}%}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">F1 Score</p>
                      <p>{(run.f1 * 100).toFixed(2)}%}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tokens</p>
                      <p>{run.tokens?.totalTokenCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cost</p>
                      <p>${run.total_cost}</p>
                    </div>
                  </div>

                  <div className="rounded border border-neutral-300">
                    <div className="border-b border-neutral-300 bg-gray-50 p-3 font-medium">
                      Extracted Fields
                    </div>
                    {run.compare.details.map((field, idx) => (
                      <div key={idx} className={`p-4 ${field.ok ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">{field.key}</p>
                          <span className="material-symbols-outlined text-sm">
                            {field.ok ? 'check_circle' : 'cancel'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Expected: {field.expected}</p>
                        <p className="mt-1">Got: {field.got}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded border border-neutral-300 border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="mt-1 text-sm text-red-700">
                    {run.error || 'Unknown error occurred.'}
                  </p>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};
