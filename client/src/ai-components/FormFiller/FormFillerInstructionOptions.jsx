import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

export const FormFillerInstructionOptions = React.memo(
  ({ option, selectedOption, setSelectedOption }) => {
    const handleChange = useCallback(() => {
      setSelectedOption(option);
    }, [option, setSelectedOption]);

    return (
      <label className="flex cursor-pointer items-center space-x-2 text-xs text-gray-700">
        <input
          type="radio"
          name="options"
          value={option.value || option.label || option.instruction}
          className="size-3 border-gray-300 text-blue-600 focus:ring-blue-500"
          checked={selectedOption === option}
          onChange={handleChange}
        />
        <span>{option.label || option.instruction}</span>
      </label>
    );
  },
);

FormFillerInstructionOptions.propTypes = {
  option: PropTypes.object.isRequired,
  selectedOption: PropTypes.object,
  setSelectedOption: PropTypes.func.isRequired,
};
