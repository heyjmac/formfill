import React, { useEffect, useState } from 'react';
import { events } from '../../ai-components/utils/events';
import { FormFillerFloater } from '../../ai-components/FormFiller';
import './style.css';

export const EvalsIframe = React.memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [important, setImportant] = useState('');
  const [url, setUrl] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    const unsubscribe1 = events.on('evals:iframe', ({ url }) => {
      setUrl(url);
      setIsOpen(true);
    });
    const unsubscribe2 = events.on('evals:code', ({ code, instruction, important }) => {
      setCode(code);
      setInstruction(instruction);
      setImportant(important);
    });
    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`relative h-screen border-l border-neutral-300 transition-all ${
        isOpen ? 'w-1/3' : 'w-0'
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
        ) : code ? (
          <div className="flex size-full items-center justify-center bg-neutral-50">
            <div
              className="styled-form overflow-auto p-4 text-sm"
              dangerouslySetInnerHTML={{ __html: code }}
            ></div>
            <FormFillerFloater instruction={instruction} important={important} />
          </div>
        ) : (
          <div className="flex size-full items-center justify-center bg-neutral-50 text-sm text-gray-400">
            Select a document to view or run a prompt to generate a form.
          </div>
        ))}
    </div>
  );
});
