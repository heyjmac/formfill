import { useState } from 'react';
import { FormFillerDetails } from './FormFillerDetails';
import { useEffect } from 'react';
import { events } from '../utils/events';

export const FormFillerWrapper = ({
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

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    events.emit('formFill', { isOpen: false });
  };

  const handleOpenClose = () => (isOpen ? handleClose() : handleOpen());

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
};
