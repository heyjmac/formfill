import React, { useCallback, useEffect, useState } from 'react';
import { events } from '../../ai-components/utils/events';
import jsPDF from 'jspdf';

export const MainDataSection = () => {
  const [input, setInput] = useState(null);
  const [summary, setSummary] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const unsubscribe1 = events.on('evals:input', setInput, true);
    const unsubscribe2 = events.on('evals:summary', setSummary, true);
    const unsubscribe3 = events.on('evals:results', setResults, true);
    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  }, []);

  const handleDownloadPDF = useCallback(() => {
    const doc = new jsPDF();
    let y = 10;

    // Title
    doc.setFontSize(18);
    doc.text('Evals Results Summary', 10, y);
    y += 10;

    // Summary Section
    doc.setFontSize(12);
    doc.text(`Instruction: ${input?.instruction || ''}`, 10, y);
    y += 6;
    doc.text(`Important Note: ${input?.important || ''}`, 10, y);
    y += 6;
    doc.text(`Total Files: ${summary?.total_files}`, 10, y);
    y += 6;
    doc.text(`Total Runs: ${summary?.total_runs}`, 10, y);
    y += 6;
    doc.text(`Avg Latency: ${(summary?.avg_latency_ms / 1000).toFixed(2)}s`, 10, y);
    y += 6;
    doc.text(`Avg Precision: ${(summary?.avg_precision * 100).toFixed(2)}%`, 10, y);
    y += 6;
    doc.text(`Avg Recall: ${(summary?.avg_recall * 100).toFixed(2)}%`, 10, y);
    y += 6;
    doc.text(`Avg F1 Score: ${(summary?.avg_f1 * 100).toFixed(2)}%`, 10, y);
    y += 6;
    doc.text(`Total Cost: $${summary?.total_cost_usd}`, 10, y);
    y += 10;

    // Form Fields
    if (input?.formFields?.length) {
      doc.setFontSize(14);
      doc.text('Form Fields:', 10, y);
      y += 8;
      doc.setFontSize(11);
      input?.formFields.forEach((f) => {
        doc.text(`- ${f.name} (${f.type}) — ${f.description || ''}`, 12, y);
        y += 6;
      });
      y += 4;
    }

    // Expected Values
    if (input?.expected) {
      doc.setFontSize(14);
      doc.text('Expected Values:', 10, y);
      y += 8;
      doc.setFontSize(11);
      Object.entries(input?.expected).forEach(([file, values]) => {
        doc.text(`File: ${file}`, 12, y);
        y += 6;
        Object.entries(values).forEach(([key, val]) => {
          doc.text(`  ${key}: ${val}`, 14, y);
          y += 6;
        });
      });
      y += 4;
    }

    // Results Section
    results?.forEach((run, i) => {
      if (y > 270) {
        doc.addPage();
        y = 10;
      }

      doc.setFontSize(14);
      doc.text(`Iteration ${run.run}`, 10, y);
      y += 8;
      doc.setFontSize(11);

      if (run.ok && run.compare?.details) {
        doc.text(`Precision: ${(run.precision * 100).toFixed(2)}%`, 12, y);
        y += 6;
        doc.text(`Recall: ${(run.recall * 100).toFixed(2)}%`, 12, y);
        y += 6;
        doc.text(`F1 Score: ${(run.f1 * 100).toFixed(2)}%`, 12, y);
        y += 6;
        doc.text(`Latency: ${(run.latency_ms / 1000).toFixed(2)}s`, 12, y);
        y += 6;
        doc.text(`Cost: $${run.total_cost}`, 12, y);
        y += 6;

        doc.text(`Correct: ${run.compare.correct}`, 12, y);
        y += 6;
        doc.text(`Wrong: ${run.compare.wrong}`, 12, y);
        y += 6;
        doc.text(`Missing: ${run.compare.missing}`, 12, y);
        y += 6;
        doc.text(`Extra: ${run.compare.extra}`, 12, y);
        y += 6;

        run.compare.details.forEach((d, idx) => {
          if (y > 270) {
            doc.addPage();
            y = 10;
          }
          doc.setFontSize(10);
          doc.text(`${d.key}: ${d.ok ? '✔' : '✘'}`, 14, y);
          y += 5;
          doc.text(`Expected: ${d.expected}`, 16, y);
          y += 5;
          doc.text(`Got: ${d.got}`, 16, y);
          y += 6;
        });
      } else {
        doc.text(`Error: ${run.error || 'Unknown error'}`, 12, y);
        y += 8;
      }

      y += 4;
    });

    doc.save('evals_results.pdf');
  }, [
    input?.expected,
    input?.formFields,
    input?.important,
    input?.instruction,
    results,
    summary?.avg_f1,
    summary?.avg_latency_ms,
    summary?.avg_precision,
    summary?.avg_recall,
    summary?.total_cost_usd,
    summary?.total_files,
    summary?.total_runs,
  ]);

  if (!summary || results?.length === 0) return null;

  return (
    <div className="space-y-10">
      <h2 className="mb-4 text-lg font-normal">Processing Runs</h2>
      <div className="flex justify-end">
        <button
          onClick={handleDownloadPDF}
          className="mb-4 rounded border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
        >
          Download PDF
        </button>
      </div>
      <div className="space-y-4">
        {results?.map((run, i) => (
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
