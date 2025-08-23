import { FormFillFlow } from './FormFillFlow';

export const FormFillDetails = ({ modal, down, right }) => {
  if (modal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-6">
          <FormFillFlow />
        </div>
      </div>
    );
  }
  if (down) {
    return (
      <div className={`absolute top-[46px] ${right ? 'left-0' : 'right-0'}`}>
        <div className="w-72 p-6 text-center bg-white border border-gray-100 shadow-lg rounded-lg">
          <FormFillFlow />
        </div>
      </div>
    );
  }
  return (
    <div className={`absolute bottom-[46px] ${right ? 'left-0' : 'right-0'}`}>
      <div className="w-72 text-center bg-white border border-gray-100 shadow-lg rounded-lg">
        <FormFillFlow />
      </div>
    </div>
  );
};
