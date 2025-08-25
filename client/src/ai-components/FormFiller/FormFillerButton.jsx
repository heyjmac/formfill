import React from 'react';
import { FormFillerWrapper } from './FormFillerWrapper';
import { getCopy } from './utils';

import PropTypes from 'prop-types';

export const FormFillerButton = React.memo(
  ({
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
        <div className="inline-flex cursor-pointer items-center rounded-full bg-blue-900 px-6 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105 hover:transform focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50">
          <span className="material-symbols-outlined mr-2 text-lg">auto_awesome</span>
          {label || getCopy('cta.button', copy)}
        </div>
      </FormFillerWrapper>
    );
  },
);

FormFillerButton.propTypes = {
  copy: PropTypes.string,
  document: PropTypes.object,
  instruction: PropTypes.string,
  important: PropTypes.bool,
  options: PropTypes.array,
  label: PropTypes.string,
  textarea: PropTypes.bool,
  floating: PropTypes.bool,
  modal: PropTypes.bool,
  up: PropTypes.bool,
  down: PropTypes.bool,
  left: PropTypes.bool,
  right: PropTypes.bool,
};
