import { FormFillerWrapper } from './FormFillerWrapper';
import { getCopy } from './utils';

export const FormFillerButton = ({
  copy,
  document,
  instruction,
  important,
  options,
  label,
  textarea,
  floating,
  modal,
  up,
  down,
  left,
  right,
}) => {
  return (
    <FormFillerWrapper
      copy={copy}
      document={document}
      instruction={instruction}
      important={important}
      options={options}
      textarea={textarea}
      floating={floating}
      modal={modal}
      up={up}
      down={down}
      left={left}
      right={right}
    >
      <div className="cursor-pointer inline-flex items-center px-6 py-2.5 bg-blue-900 text-white text-sm font-medium rounded-full transition-transform hover:transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50">
        <span className="mr-2 text-lg material-symbols-outlined">auto_awesome</span>
        {label || getCopy('cta.button', copy)}
      </div>
    </FormFillerWrapper>
  );
};
