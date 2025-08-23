import { useState } from 'react';
import { FormFillDetails } from './FormFillDetails';
import { useEffect } from 'react';
import { events } from '../utils/events';

export const FormFillButton = ({ floating, modal, ...rest }) => {
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

  return (
    <div className={floating ? 'fixed bottom-5 right-5' : ''}>
      <div className="relative">
        {isOpen ? (
          modal ? (
            <div
              className="cursor-pointer inline-flex items-center px-6 py-2.5 bg-blue-900 text-white text-sm font-medium rounded-full transition-transform hover:transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50"
              onClick={handleClose}
            >
              <span className="mr-2 text-lg material-symbols-outlined">auto_awesome</span>
              Fill with AI
            </div>
          ) : (
            <div
              className="cursor-pointer inline-flex items-center px-6 py-2.5 bg-blue-900 text-white text-sm font-medium rounded-full transition-transform hover:transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50"
              onClick={handleClose}
            >
              <span className="mr-2 text-lg material-symbols-outlined">close</span>
              Close
            </div>
          )
        ) : (
          <div
            className="cursor-pointer inline-flex items-center px-6 py-2.5 bg-blue-900 text-white text-sm font-medium rounded-full transition-transform hover:transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50"
            onClick={handleOpen}
          >
            <span className="mr-2 text-lg material-symbols-outlined">auto_awesome</span>
            Fill with AI
          </div>
        )}

        {isOpen && <FormFillDetails modal={modal} {...rest} />}
      </div>
    </div>
  );
};
