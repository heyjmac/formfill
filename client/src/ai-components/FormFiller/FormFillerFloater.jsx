import { useState } from 'react';
import { useEffect } from 'react';
import { events } from '../utils/events';
import { defaultCopy } from './defaultCopy';
import { FormFillerWrapper } from './FormFillerWrapper';

export const FormFillerFloater = ({
  document,
  instruction,
  important,
  options,
  label,
  textarea,
  modal,
  up,
  down,
  left,
  right,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = events.on('formFill', ({ isOpen }) => {
      setIsOpen(isOpen);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5">
      <FormFillerWrapper
        document={document}
        instruction={instruction}
        important={important}
        options={options}
        textarea={textarea}
        modal={modal}
        up={up}
        down={down}
        left={left}
        right={right}
      >
        <div className="cursor-pointer inline-flex items-center px-6 py-2.5 bg-blue-900 text-white text-sm font-medium rounded-full transition-transform hover:transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50">
          <span className="mr-2 text-lg material-symbols-outlined">auto_awesome</span>
          {label || (!modal && isOpen) ? defaultCopy.cta.close : defaultCopy.cta.button}
        </div>
      </FormFillerWrapper>
    </div>
  );
};
