import React from 'react';

import PropTypes from 'prop-types';

export const FormFillerTopNav = React.memo(({ handleBack, handleClose, title }) => (
  <div className="-mt-1 mb-4 flex items-center justify-between">
    <div>
      {handleBack && (
        <button
          type="button"
          onClick={handleBack}
          className="flex cursor-pointer items-center text-sm text-gray-400 transition-colors hover:text-black"
        >
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
      )}
    </div>
    {title && <div className="text-base font-medium">{title}</div>}
    <button
      type="button"
      onClick={handleClose}
      className="flex cursor-pointer items-center text-base text-gray-400 transition-colors hover:text-black"
    >
      <span className="material-symbols-outlined">close</span>
    </button>
  </div>
));

FormFillerTopNav.propTypes = {
  handleBack: PropTypes.func,
  handleClose: PropTypes.func,
  title: PropTypes.string,
};
