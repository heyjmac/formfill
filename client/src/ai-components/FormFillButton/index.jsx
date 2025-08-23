import { useEffect, useState } from 'react';
import { FormFillDropdown } from './FormFillDropdown';

export const FormFillButton = () => {
  const [status, setStatus] = useState('idle');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') {
      setTimeout(() => setStatus('success'), 2000);
      setTimeout(() => setStatus('idle'), 4000);
    }
  }, [status]);

  return (
    <div className="fixed bottom-5 right-5">
      <div className="relative">
        {status === 'idle' && (
          <button
            className="cursor-pointer inline-flex items-center px-6 py-2.5 bg-blue-900 text-white text-sm font-medium rounded-full transition-transform hover:transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            <span className="mr-2 text-lg material-symbols-outlined">auto_awesome</span>
            Fill with AI
          </button>
        )}
        {status === 'loading' && (
          <button
            className="cursor-default inline-flex items-center px-6 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-full transition-transform hover:transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50"
            onClick={() => isDropdownOpen('idle')}
          >
            <div className="mr-2 h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
            Loading...
          </button>
        )}
        {status === 'success' && (
          <button className="cursor-default inline-flex items-center px-6 py-2.5 bg-blue-900 text-white text-sm font-medium rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 relative">
            <span className="mr-2 text-lg material-symbols-outlined">check_circle</span>
            <span className="relative">Form filled</span>
          </button>
        )}
        {isDropdownOpen && <FormFillDropdown />}
      </div>
    </div>
  );
};
