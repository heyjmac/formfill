import { useEffect } from 'react';
import { FormFillFlow } from './FormFillFlow';
import { events } from '../utils/events';

export const FormFillDetails = ({ modal, down, right, ...rest }) => {
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
        <div className="bg-white rounded-lg p-2 min-w-[400px] max-w-[600px]">
          <FormFillFlow {...rest} />
        </div>
      </div>
    );
  }
  if (down) {
    return (
      <div className={`absolute top-[46px] ${right ? 'left-0' : 'right-0'}`}>
        <div className="w-72 p-6 text-center bg-white border border-gray-100 shadow-lg rounded-lg">
          <FormFillFlow {...rest} />
        </div>
      </div>
    );
  }
  return (
    <div className={`absolute bottom-[46px] ${right ? 'left-0' : 'right-0'}`}>
      <div className="w-72 bg-white border border-gray-100 shadow-lg rounded-lg">
        <FormFillFlow {...rest} />
      </div>
    </div>
  );
};
