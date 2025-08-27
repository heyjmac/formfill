import React, { useEffect } from 'react';
import { events } from '../../ai-components/utils/events';

export const EvalsCodeSnippet = () => {
  const [formFields, setFormFields] = React.useState([]);

  useEffect(() => {
    const unsubscribe = events.on('evals:input', ({ formFields }) => setFormFields(formFields));
    return () => {
      unsubscribe();
    };
  }, []);

  const generateInput = (field) => {
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
  };

  const code = `<FormFillerFloater
  instruction="Fill this form with the plaintiff info"
  important="Capitalize the first letter only"
/>

<form>
${formFields?.map(generateInput).join('\n\n')}
</form>`;

  return (
    <div className="border-b bg-gray-50 p-4">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between">
          <span className="text-sm font-medium">Generated Form Code</span>
          <span className="material-symbols-outlined text-gray-400 transition-transform group-open:rotate-180">
            expand_more
          </span>
        </summary>
        <div className="mt-3 overflow-x-auto rounded bg-gray-900 p-3 font-mono text-sm text-gray-100">
          <pre className="whitespace-pre-wrap">{code}</pre>
        </div>
      </details>
    </div>
  );
};
