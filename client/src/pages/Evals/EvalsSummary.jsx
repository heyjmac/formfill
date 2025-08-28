import React, { useEffect, useRef, useState } from 'react';
import { events } from '../../ai-components/utils/events';

export const EvalsSummary = () => {
  const [avgF1, setAvgF1] = useState(0);
  const [avgLatencyMs, setAvgLatencyMs] = useState(0);
  const [avgPrecision, setAvgPrecision] = useState(0);
  const [avgRecall, setAvgRecall] = useState(0);
  const [totalCostUsd, setTotalCostUsd] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalRuns, setTotalRuns] = useState(0);
  const summaryRef = useRef(null);

  useEffect(() => {
    const handler = ({
      avgF1,
      avgLatencyMs,
      avgPrecision,
      avgRecall,
      totalCostUsd,
      totalFiles,
      totalRuns,
    }) => {
      setAvgF1(avgF1);
      setAvgLatencyMs(avgLatencyMs);
      setAvgPrecision(avgPrecision);
      setAvgRecall(avgRecall);
      setTotalCostUsd(totalCostUsd);
      setTotalFiles(totalFiles);
      setTotalRuns(totalRuns);

      setTimeout(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 600);
    };
    events.on('evals:summary', handler);
    return () => events.off('evals:summary', handler);
  }, []);

  return (
    <div ref={summaryRef} className="break-inside-avoid">
      {totalFiles ? (
        <div className="rounded border border-neutral-300 bg-gray-50 p-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Files Processed</p>
              <p className="text-xl">{totalFiles}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Runs</p>
              <p className="text-xl">{totalRuns}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Latency</p>
              <p className="text-xl">{avgLatencyMs}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Cost</p>
              <p className="text-xl">${totalCostUsd}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Precision</p>
              <p className="text-xl">{(avgPrecision * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Recall</p>
              <p className="text-xl">{(avgRecall * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg F1 Score</p>
              <p className="flex items-center gap-2 text-xl">
                <span
                  className={`size-3 rounded-full ${
                    avgF1 < 0.6 ? 'bg-red-500' : avgF1 < 0.7 ? 'bg-orange-400' : 'bg-green-500'
                  }`}
                />
                {(avgF1 * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};
