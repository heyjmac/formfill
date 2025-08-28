import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { events } from '../../ai-components/utils/events';

export const EvalsCodeSnippet = () => {
  const [formFields, setFormFields] = React.useState([]);
  const [instruction, setInstruction] = React.useState('');
  const [important, setImportant] = React.useState('');
  const [isCopying, setIsCopying] = React.useState(false);
  const preRef = useRef(null);

  useEffect(() => {
    const unsubscribe = events.on('evals:input', ({ formFields, instruction, important }) => {
      setFormFields(formFields);
      setInstruction(instruction);
      setImportant(important);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const generateInput = useCallback((field) => {
    const { name, type, description, format } = field;

    const baseAttrs = `data-form-filler-name="${name}" data-form-filler-description="${description}"${
      format ? ` data-form-filler-format="${format}"` : ''
    }`;

    if (type === 'textarea') {
      return `<textarea ${baseAttrs}></textarea>`;
    }

    if (type === 'select-one') {
      return `<select ${baseAttrs}>
  <option value="">Select...</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>`;
    }

    return `<input type="${type}" ${baseAttrs} />`;
  }, []);

  const code = useMemo(
    () => `<FormFillerFloater
  instruction="${instruction}"
  important="${important}"
/>

<form>
  ${formFields?.map(generateInput).join('\n  ')}
</form>`,
    [formFields, generateInput, important, instruction],
  );
  const visuallySelectPre = useCallback(() => {
    const el = preRef.current;
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    el.scrollIntoView({ block: 'nearest' });
  }, [preRef]);

  const clearSelection = useCallback(() => {
    const sel = window.getSelection();
    sel && sel.removeAllRanges();
  }, []);

  const copyToClipboard = useCallback(async () => {
    try {
      setIsCopying(true);
      visuallySelectPre();
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error('Failed to copy: ', err);
    } finally {
      setTimeout(() => {
        clearSelection();
        setIsCopying(false);
      }, 900);
    }
  }, [clearSelection, code, visuallySelectPre]);

  return (
    <>
      {instruction && (
        <div className="break-inside-avoid border-b border-neutral-300 bg-gray-50 p-4">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <span className="text-sm font-medium">Generated Form Code</span>
              <span className="material-symbols-outlined text-gray-400 transition-transform group-open:rotate-180">
                expand_more
              </span>
            </summary>
            <div className="relative mt-3 rounded bg-gray-900 p-3 font-mono text-sm text-gray-100">
              <button
                onClick={copyToClipboard}
                className="absolute right-3 top-3 rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600"
              >
                {isCopying ? 'Copied!' : 'Copy'}
              </button>
              <div className="overflow-x-auto">
                <pre ref={preRef} className="whitespace-pre">
                  {code}
                </pre>
              </div>
            </div>
          </details>
        </div>
      )}
    </>
  );
};
