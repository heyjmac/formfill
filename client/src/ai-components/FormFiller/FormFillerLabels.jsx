import React, { useCallback } from 'react';

import PropTypes from 'prop-types';

export const FormFillerLabels = React.memo(
  ({ selectedFields, name, label, fieldValues, fieldsFilled, setSelectedFields, setIsDirty }) => {
    const handleChange = useCallback(
      (e) => {
        setSelectedFields((prev) => ({ ...prev, [name]: e.target.checked }));
        setIsDirty(true);
      },
      [name, setIsDirty, setSelectedFields],
    );
    return (
      <label
        className={`flex flex-wrap items-center justify-between rounded p-2 
              ${
                selectedFields[name]
                  ? 'border border-blue-200 bg-blue-50 hover:bg-blue-100'
                  : 'border border-gray-200 hover:border-gray-300'
              }`}
      >
        <div className="flex flex-1 flex-wrap items-start justify-between gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium text-gray-700 ${
              selectedFields[name] ? 'bg-white' : 'bg-gray-100'
            }`}
          >
            {label || name}
          </span>
          <div>
            <div className="ml-1 text-sm text-gray-700 line-through">{fieldValues[name]}</div>
            <div className="ml-1 text-sm text-gray-700">{fieldsFilled[name]}</div>
          </div>
        </div>
        <div className="ml-2 flex items-center space-x-2">
          <input
            type="checkbox"
            id={name}
            checked={selectedFields[name] ?? true}
            onChange={handleChange}
            className="size-4 cursor-pointer rounded border-gray-300 text-blue-500 transition-colors focus:ring-blue-500"
          />
        </div>
      </label>
    );
  },
);

FormFillerLabels.propTypes = {
  selectedFields: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  fieldValues: PropTypes.object.isRequired,
  fieldsFilled: PropTypes.object.isRequired,
  setSelectedFields: PropTypes.func.isRequired,
  setIsDirty: PropTypes.func.isRequired,
};
