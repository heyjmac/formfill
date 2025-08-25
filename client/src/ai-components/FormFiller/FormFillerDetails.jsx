import { useEffect } from 'react';
import { FormFillerFlow } from './FormFillerFlow';
import { events } from '../utils/events';

export const FormFillerDetails = ({ modal, down, right, ...rest }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        events.emit('formFill', { isOpen: false });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (modal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000020]">
        <div className="min-w-[400px] max-w-[600px] rounded-lg bg-white p-2">
          <FormFillerFlow {...rest} />
        </div>
      </div>
    );
  }
  if (down) {
    return (
      <div className={`absolute top-[46px] ${right ? 'left-0' : 'right-0'}`}>
        <div className="w-72 rounded-lg border border-gray-100 bg-white p-6 text-center shadow-lg">
          <FormFillerFlow {...rest} />
        </div>
      </div>
    );
  }
  return (
    <div className={`absolute bottom-[46px] ${right ? 'left-0' : 'right-0'}`}>
      <div className="w-72 rounded-lg border border-gray-100 bg-white shadow-lg">
        <FormFillerFlow {...rest} />
      </div>
    </div>
  );
};
