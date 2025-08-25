import React, { useState, useEffect } from 'react';
import { events } from '../utils/events';
import { defaultCopy } from './defaultCopy';
import { FormFillerWrapper } from './FormFillerWrapper';

import PropTypes from 'prop-types';

export const FormFillerFloater = React.memo(
  ({
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
          <div className="inline-flex cursor-pointer items-center rounded-full bg-blue-900 px-6 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105 hover:transform focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50">
            <span className="material-symbols-outlined mr-2 text-lg">auto_awesome</span>
            {label || (!modal && isOpen) ? defaultCopy.cta.close : defaultCopy.cta.button}
          </div>
        </FormFillerWrapper>
      </div>
    );
  },
);

FormFillerFloater.propTypes = {
  document: PropTypes.object,
  instruction: PropTypes.string,
  important: PropTypes.bool,
  options: PropTypes.array,
  label: PropTypes.string,
  textarea: PropTypes.bool,
  modal: PropTypes.bool,
  up: PropTypes.bool,
  down: PropTypes.bool,
  left: PropTypes.bool,
  right: PropTypes.bool,
};
