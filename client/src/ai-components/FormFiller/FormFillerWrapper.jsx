import React, { useState, useEffect, useCallback } from 'react';
import { FormFillerDetails } from './FormFillerDetails';
import { events } from '../utils/events';

import PropTypes from 'prop-types';

export const FormFillerWrapper = React.memo(
  ({
    copy,
    document,
    instruction,
    important,
    options,
    textarea,
    modal,
    up,
    down,
    left,
    right,
    children,
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

    const handleOpen = useCallback(() => {
      setIsOpen(true);
    }, []);

    const handleClose = useCallback(() => {
      events.emit('formFill', { isOpen: false });
    }, []);

    const handleOpenClose = useCallback(() => (isOpen ? handleClose() : handleOpen()), [isOpen]);

    return (
      <div className="relative">
        <div onClick={handleOpenClose}>{children}</div>
        {isOpen && (
          <FormFillerDetails
            copy={copy}
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
          />
        )}
      </div>
    );
  },
);

FormFillerWrapper.propTypes = {
  copy: PropTypes.object.isRequired,
  document: PropTypes.object.isRequired,
  instruction: PropTypes.string,
  important: PropTypes.bool,
  options: PropTypes.array,
  textarea: PropTypes.string,
  modal: PropTypes.bool,
  up: PropTypes.bool,
  down: PropTypes.bool,
  left: PropTypes.bool,
  right: PropTypes.bool,
  children: PropTypes.node,
};
