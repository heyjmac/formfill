import React, { useEffect, useRef, useState } from 'react';
import { events } from '../../ai-components/utils/events';

export const EvalsSummary = () => {
  const [avg_f1, setAvgF1] = useState(0);
  const [avg_latency_ms, setAvgLatencyMs] = useState(0);
  const [avg_precision, setAvgPrecision] = useState(0);
  const [avg_recall, setAvgRecall] = useState(0);
  const [total_cost_usd, setTotalCostUsd] = useState(0);
  const [total_files, setTotalFiles] = useState(0);
  const [total_runs, setTotalRuns] = useState(0);
  const summaryRef = useRef(null);

  useEffect(() => {
    const handler = ({
      avg_f1,
      avg_latency_ms,
      avg_precision,
      avg_recall,
      total_cost_usd,
      total_files,
      total_runs,
    }) => {
      setAvgF1(avg_f1);
      setAvgLatencyMs(avg_latency_ms);
      setAvgPrecision(avg_precision);
      setAvgRecall(avg_recall);
      setTotalCostUsd(total_cost_usd);
      setTotalFiles(total_files);
      setTotalRuns(total_runs);

      setTimeout(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 600);
    };
    events.on('evals:summary', handler);
    return () => events.off('evals:summary', handler);
  }, []);

  return (
    <div ref={summaryRef}>
      {total_files ? (
        <div className="rounded border border-neutral-300 bg-gray-50 p-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Files Processed</p>
              <p className="text-xl">{total_files}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Runs</p>
              <p className="text-xl">{total_runs}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Latency</p>
              <p className="text-xl">{avg_latency_ms}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Cost</p>
              <p className="text-xl">${total_cost_usd}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Precision</p>
              <p className="text-xl">{(avg_precision * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Recall</p>
              <p className="text-xl">{(avg_recall * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg F1 Score</p>
              <p className="text-xl">{(avg_f1 * 100).toFixed(2)}%</p>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};
