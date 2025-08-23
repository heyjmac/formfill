import { useState } from 'react';
import { FormFillDetails } from './FormFillDetails';
import { useEffect } from 'react';
import { events } from '../utils/events';

export const FormFillButton = ({ modal, ...rest }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = events.on('formFill', ({ isOpen }) => {
      setIsDropdownOpen(isOpen);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5">
      <div className="relative">
        {isDropdownOpen ? (
          <button
            className="cursor-pointer inline-flex items-center px-6 py-2.5 bg-blue-900 text-white text-sm font-medium rounded-full transition-transform hover:transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50"
            onClick={() => setIsDropdownOpen(false)}
          >
            <span className="mr-2 text-lg material-symbols-outlined">
              {modal ? 'auto_awesome' : 'close'}
            </span>
            {modal ? 'Fill with AI' : 'Close'}
          </button>
        ) : (
          <button
            className="cursor-pointer inline-flex items-center px-6 py-2.5 bg-blue-900 text-white text-sm font-medium rounded-full transition-transform hover:transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50"
            onClick={() => setIsDropdownOpen(true)}
          >
            <span className="mr-2 text-lg material-symbols-outlined">auto_awesome</span>
            Fill with AI
          </button>
        )}

        {isDropdownOpen && <FormFillDetails modal={modal} {...rest} />}
      </div>
    </div>
  );
};
