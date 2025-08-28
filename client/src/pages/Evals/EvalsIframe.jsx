import React, { useEffect, useState } from 'react';
import { events } from '../../ai-components/utils/events';

export const EvalsIframe = React.memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const unsubscribe = events.on('evals:iframe', ({ url }) => {
      setUrl(url);
      setIsOpen(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      className={`relative h-screen border-l border-neutral-300 transition-all ${
        isOpen ? 'w-1/2' : 'w-0'
      }`}
    >
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="absolute -left-[40px] top-2 z-10 flex size-[40px] cursor-pointer items-center justify-center rounded-l border border-neutral-300 bg-white"
        title="Toggle panel"
      >
        <span className="material-symbols-outlined text-sm">
          {isOpen ? 'arrow_forward_ios' : 'arrow_back_ios_new'}
        </span>
      </button>

      {isOpen &&
        (url ? (
          <iframe className="size-full" src={url} />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-gray-400">
            No document selected
          </div>
        ))}
    </div>
  );
});
