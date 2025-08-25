import { useState } from 'react';
import { FormFillerDetails } from './FormFillerDetails';
import { useEffect } from 'react';
import { events } from '../utils/events';

export const FormFillerWrapper = ({
  document,
  instruction,
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
    <div className="relative" onClick={handleOpenClose}>
      {children}
      {isOpen && (
        <FormFillerDetails
          document={document}
          instruction={instruction}
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
