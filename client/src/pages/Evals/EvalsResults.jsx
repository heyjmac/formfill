import React, { useCallback, useEffect, useState } from 'react';
import { events } from '../../ai-components/utils/events';

export const EvalsResults = () => {
  const [summary, setSummary] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const unsubscribe1 = events.on('evals:summary', setSummary, true);
    const unsubscribe2 = events.on('evals:results', setResults, true);
    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  useEffect(() => {
    setResults((prev) =>
      prev.map((run) => {
        if (!run.compare?.details) return run;
        return {
          ...run,
          compare: {
            ...run.compare,
            details: run.compare.details.map((d) => ({ ...d, _checked: true })),
          },
        };
      }),
    );
  }, []);

  const handlePrint = useCallback(() => {
    if (typeof window === 'undefined') return;
    const details = Array.from(document.querySelectorAll('details'));
    const prevOpen = details.map((d) => d.open);
    details.forEach((d) => (d.open = true));

    const restore = () => {
      details.forEach((d, i) => (d.open = prevOpen[i]));
      window.removeEventListener('afterprint', restore);
      if (mql?.removeEventListener) mql.removeEventListener('change', onChange);
    };
    const onChange = (e) => {
      if (!e.matches) restore();
    };
    const mql = window.matchMedia('print');
    if (mql?.addEventListener) mql.addEventListener('change', onChange);
    window.addEventListener('afterprint', restore);

    requestAnimationFrame(() => window.print());
  }, []);

  if (!summary || results?.length === 0) return null;

  return (
    <div className="break-inside-avoid space-y-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-normal">Processing Runs</h2>
        <button
          onClick={handlePrint}
          className="rounded border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 print:hidden"
        >
          Print / Save as PDF
        </button>
      </div>
      <div className="space-y-4">
        {results?.map((run, i) => (
          <details
            key={i}
            className="group break-inside-avoid rounded border border-neutral-300"
            open
          >
            <summary className="flex cursor-pointer items-center justify-between p-4">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined mr-2 text-gray-600">analytics</span>
                <span>{run.file}</span>
                {run.file && <span className="text-xs text-gray-500">(Iteration {run.run})</span>}
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
                  <div className="mb-4 grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Precision</p>
                      <p>{(run.precision * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Recall</p>
                      <p>{(run.recall * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">F1 Score</p>
                      <p>{(run.f1 * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tokens</p>
                      <p>{run.tokens?.totalTokenCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Latency ms</p>
                      <p>{run.latency_ms ? run.latency_ms : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cost</p>
                      <p>${run.total_cost}</p>
                    </div>
                  </div>

                  <div className="rounded border border-neutral-300">
                    <div className="flex items-center justify-between border-b border-neutral-300 bg-gray-50 p-3 font-medium">
                      Extracted Fields
                      <button
                        className="cursor-pointer rounded px-3 py-1 text-sm text-blue-700 hover:bg-neutral-100"
                        onClick={() => {
                          const expected = {
                            [run.file]: run.compare.details.reduce((acc, curr) => {
                              if (curr._checked) acc[curr.key] = curr.got;
                              return acc;
                            }, {}),
                          };
                          events.emit('evals:overwriteExpected', expected);
                        }}
                      >
                        Use selected as Expected
                      </button>
                    </div>
                    <div>
                      {run.compare.details.map((field, idx) => (
                        <label key={idx}>
                          <div
                            className={`border-b border-neutral-300 p-4 ${field.ok ? 'bg-green-50' : 'bg-red-50'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{field.key}</p>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="checkbox"
                                  checked={field._checked ?? true}
                                  onChange={(e) => {
                                    setResults((prev) =>
                                      prev.map((r, ri) =>
                                        ri === i
                                          ? {
                                              ...r,
                                              compare: {
                                                ...r.compare,
                                                details: r.compare.details.map((f, fi) =>
                                                  fi === idx
                                                    ? { ...f, _checked: e.target.checked }
                                                    : f,
                                                ),
                                              },
                                            }
                                          : r,
                                      ),
                                    );
                                  }}
                                />
                                <span className="material-symbols-outlined text-sm">
                                  {field.ok ? 'check_circle' : 'cancel'}
                                </span>
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Expected: {field.expected}</p>
                            <p className="mt-1">Got: {field.got}</p>
                          </div>
                        </label>
                      ))}
                    </div>
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
