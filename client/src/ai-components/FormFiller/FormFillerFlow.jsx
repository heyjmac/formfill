import React, { useCallback, useRef, useState } from 'react';
import {
  fillFormFields,
  getCleanData,
  getCopy,
  getFormFields,
  getFormFieldLabels,
  getFormFieldValues,
} from './utils';
import { events } from '../utils/events';
import { defaultCopy } from './defaultCopy';

import PropTypes from 'prop-types';
import { FormFillerTopNav } from './FormFillerTopNav';
import { FormFillerLabels } from './FormFillerLabels';
import { FormFillerInstructionOptions } from './FormFillerInstructionOptions';

export const FormFillerFlow = React.memo(
  ({ copy, document, instruction, important, options, textarea }) => {
    const fileRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [text, setText] = useState('');
    const [status, setStatus] = useState(false);
    const [fieldLabels, setFieldLabels] = useState([]);
    const [fieldValues, setFieldValues] = useState({});
    const [fieldsFilled, setFieldsFilled] = useState({});
    const [errorCode, setErrorCode] = useState(null);
    const [undoFields, setUndoFields] = useState({});
    const [isDirty, setIsDirty] = useState(false);
    const [selectedFields, setSelectedFields] = useState({});
    const [selectedOption, setSelectedOption] = useState(null);

    const handleSubmit = useCallback(async () => {
      setStatus('loading');
      const formFields = getFormFields();
      const formFieldLabels = getFormFieldLabels();
      const formFieldValues = getFormFieldValues();
      setFieldLabels(formFieldLabels);
      setFieldValues(formFieldValues);
      const formData = new FormData();
      formData.append('formFields', JSON.stringify(formFields));
      formData.append('important', important || selectedOption?.important);
      formData.append(
        'instruction',
        [instruction, selectedOption?.instruction].filter(Boolean).join(' '),
      );
      files.forEach((f) => formData.append('files', f));
      formData.append('pastedText', text || '');

      try {
        const response = await fetch('/api/formfill', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (response.ok && data?.data) {
          const cleanedData = getCleanData(data.data);
          setFieldsFilled(cleanedData);
          setSelectedFields(Object.fromEntries(Object.keys(cleanedData).map((key) => [key, true])));
          console.log('Form filled successfully:', cleanedData);
          setStatus('success');
        } else {
          console.error('Error filling form:', data);
          setErrorCode(data?.errorCode || null);
          setStatus('error');
        }
      } finally {
        setFiles([]);
        setText('');
      }
    }, [
      files,
      important,
      instruction,
      selectedOption?.important,
      selectedOption?.instruction,
      text,
    ]);

    const handleFileChange = useCallback((e) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length) setFiles(selectedFiles);
    }, []);

    const handleClear = useCallback(() => {
      setFiles([]);
      setText('');
      setStatus('idle');
    }, []);

    const handleClearFiles = useCallback(() => {
      setFiles([]);
    }, []);

    const handleApply = useCallback(() => {
      const selected = Object.fromEntries(
        Object.entries(fieldsFilled).filter(
          ([key]) => selectedFields[key] && String(fieldsFilled[key]) !== String(fieldValues[key]),
        ),
      );
      const previousValues = fillFormFields(selected);
      setUndoFields(previousValues);
      setIsDirty(false);
    }, [fieldValues, fieldsFilled, selectedFields]);

    const handleUndo = useCallback(() => {
      fillFormFields(undoFields);
      setUndoFields({});
    }, [undoFields]);

    const handleReapply = useCallback(() => {
      fillFormFields(undoFields);
      const selected = Object.fromEntries(
        Object.entries(fieldsFilled).filter(
          ([key]) => selectedFields[key] && String(fieldsFilled[key]) !== String(fieldValues[key]),
        ),
      );
      const previousValues = fillFormFields(selected);
      setUndoFields(previousValues);
      setIsDirty(false);
    }, [undoFields, fieldsFilled, selectedFields, fieldValues]);

    const handleClose = useCallback(() => events.emit('formFill', { isOpen: false }), []);

    const handleSelectAll = useCallback(() => {
      const allSelected = Object.fromEntries(Object.keys(fieldsFilled).map((key) => [key, true]));
      setSelectedFields(allSelected);
      setIsDirty(true);
    }, [fieldsFilled]);

    const handleClearSelection = useCallback(() => {
      const noneSelected = Object.fromEntries(Object.keys(fieldsFilled).map((key) => [key, false]));
      setSelectedFields(noneSelected);
      setIsDirty(true);
    }, [fieldsFilled]);

    const handleChangeText = useCallback((e) => {
      setText(e.target.value);
    }, []);

    if (status === 'loading') {
      return (
        <div className="flex size-full items-center justify-center">
          <div className="p-4 text-center">
            <div className="mb-2 text-3xl text-blue-500">
              <span className="material-symbols-outlined inline-block animate-spin">
                progress_activity
              </span>
            </div>
            <div className="mb-3 text-sm text-gray-700">{getCopy('text.processing', copy)}</div>
            <button
              type="button"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm text-gray-800 transition-colors hover:bg-gray-50"
              onClick={handleClear}
            >
              {getCopy('cta.cancel', copy) || getCopy('cta.stop', copy)}
            </button>
          </div>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="p-4">
          <FormFillerTopNav
            handleBack={handleClear}
            handleClose={handleClose}
            title={
              Object.keys(fieldsFilled).length > 1
                ? defaultCopy.fields_found.plural.replace(
                    '{{count}}',
                    Object.keys(fieldsFilled).length,
                  )
                : defaultCopy.fields_found.singular
            }
          />
          <div className="mb-4 text-sm text-gray-600">{getCopy('text.review', copy)}</div>

          <div className="mb-4 flex justify-between">
            <button
              type="button"
              className="flex cursor-pointer items-center text-xs text-gray-600 transition-colors hover:text-gray-900"
              onClick={handleClearSelection}
            >
              <span className="material-symbols-outlined mr-1 text-sm">deselect</span>
              {getCopy('cta.clear_selection', copy)}
            </button>
            <button
              type="button"
              className="flex cursor-pointer items-center text-xs text-gray-600 transition-colors hover:text-gray-900"
              onClick={handleSelectAll}
            >
              <span className="material-symbols-outlined mr-1 text-sm">select_all</span>
              {getCopy('cta.select_all', copy)}
            </button>
          </div>

          <div className="mb-4 max-h-60 space-y-2 overflow-y-auto">
            {fieldLabels
              .filter(
                ({ name }) =>
                  fieldsFilled[name] && String(fieldsFilled[name]) !== String(fieldValues[name]),
              )
              .map(({ name, label }) => (
                <FormFillerLabels
                  key={name}
                  selectedFields={selectedFields}
                  name={name}
                  label={label}
                  fieldValues={fieldValues}
                  fieldsFilled={fieldsFilled}
                  setSelectedFields={setSelectedFields}
                  setIsDirty={setIsDirty}
                />
              ))}
          </div>

          <div className="space-y-3">
            {Object.keys(undoFields).length ? (
              <div className="flex justify-between">
                <button
                  type="button"
                  className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-red-700 transition-colors hover:border-gray-300"
                  onClick={handleUndo}
                >
                  <span className="material-symbols-outlined mr-1 text-sm">undo</span>
                  <span>{getCopy('cta.undo', copy)}</span>
                </button>
                {isDirty ? (
                  <button
                    className="flex cursor-pointer items-center justify-center rounded-lg border border-blue-900 bg-blue-900 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-800"
                    onClick={handleReapply}
                  >
                    <span className="material-symbols-outlined mr-1 text-sm">refresh</span>
                    <span>{getCopy('cta.reapply', copy)}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="flex cursor-pointer items-center justify-center rounded-lg border border-blue-900 bg-blue-900 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-800"
                    onClick={handleClose}
                  >
                    <span className="material-symbols-outlined mr-1 text-sm">close</span>
                    <span>{getCopy('cta.close', copy)}</span>
                  </button>
                )}
              </div>
            ) : Object.values(selectedFields).some(Boolean) ? (
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-center rounded-lg border border-blue-900 bg-blue-900 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-800"
                onClick={handleApply}
              >
                <span className="material-symbols-outlined mr-1 text-sm">done</span>
                <span>{getCopy('cta.apply', copy)}</span>
              </button>
            ) : (
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-center rounded-lg border border-blue-900 bg-blue-900 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-800"
                onClick={handleClose}
              >
                <span className="material-symbols-outlined mr-1 text-sm">close</span>
                <span>{getCopy('cta.close', copy)}</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="flex size-full items-center justify-center">
          <div className="p-4">
            <div className="mb-2 text-3xl text-red-500">
              <span className="material-symbols-outlined">error</span>
            </div>
            <div className="mb-3 text-sm text-gray-700">
              {defaultCopy.error[errorCode] && <div>{defaultCopy.error[errorCode]}</div>}
              {!errorCode && <div>{getCopy('error.DEFAULT', copy)}</div>}
            </div>
            <button
              type="button"
              className="w-full rounded-lg bg-red-600 py-2 text-sm text-white transition-colors hover:bg-red-500"
              onClick={handleClear}
            >
              {getCopy('cta.error', copy)}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        <FormFillerTopNav handleClose={handleClose} title={getCopy('title.main', copy)} />
        <div className="relative mb-3">
          <label
            className={`mb-2 block flex min-h-[100px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 px-4 py-3 text-center transition-colors ${
              files.length > 0 ? 'bg-gray-100' : 'hover:bg-gray-50'
            }`}
          >
            <span className="material-symbols-outlined mb-1">upload_file</span>
            <div className="block text-xs">
              {files.length > 0
                ? files.map((f) => f.name).join(', ')
                : getCopy('text.drop_area', copy)?.replace('{{document}}', document || 'document')}
            </div>
            <span className="mt-1 block text-xs text-gray-500">
              {files.length > 0
                ? files.length > 1
                  ? getCopy('files_selected.plural', copy)?.replace('{{count}}', files.length)
                  : getCopy('files_selected.singular', copy)
                : getCopy('text.supported_formats', copy)}
            </span>
            <input
              type="file"
              className="hidden"
              ref={fileRef}
              multiple
              accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx,.csv,.html,.md,.json,.xml,.png,.jpg,.jpeg,.webp,.mp3,.wav,.mp4,.mov"
              onChange={handleFileChange}
            />
          </label>

          {files.length > 0 && (
            <button
              type="button"
              className="absolute right-[-8px] top-[-8px] flex size-[18px] cursor-pointer items-center justify-center rounded-full bg-gray-200 text-xs text-gray-700 hover:bg-red-400 hover:text-white"
              onClick={handleClearFiles}
              aria-label="Clear files"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {textarea && (
          <>
            <div className="my-3 flex items-center">
              <div className="h-px flex-1 bg-gray-200"></div>
              <span className="mx-3 text-xs uppercase text-gray-400">or</span>
              <div className="h-px flex-1 bg-gray-200"></div>
            </div>
            <div className="mb-3">
              <textarea
                className="h-24 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={getCopy('text.paste_text', copy)}
                value={text}
                onChange={handleChangeText}
              ></textarea>
            </div>
          </>
        )}

        {options && options.length > 0 && (
          <div className="mx-2 mb-3">
            <h3 className="mb-2 text-sm font-medium">{getCopy('text.options', copy)}</h3>
            <div className="space-y-2">
              {options.map((option, index) => (
                <FormFillerInstructionOptions
                  key={index}
                  option={option}
                  selectedOption={selectedOption}
                  setSelectedOption={setSelectedOption}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center text-xs text-gray-500">
          <p>{getCopy('text.info', copy)}</p>
        </div>

        <button
          type="button"
          className={`flex w-full items-center justify-center rounded-lg border border-blue-900 bg-blue-900 py-2 text-sm text-white transition-colors hover:bg-blue-800 ${
            files.length === 0 && !text ? 'cursor-default opacity-50' : 'cursor-pointer px-4'
          }`}
          onClick={handleSubmit}
        >
          <span className="material-symbols-outlined mr-1 text-sm">auto_awesome</span>
          <span>{getCopy('cta.extract', copy)}</span>
        </button>
      </div>
    );
  },
);

FormFillerFlow.propTypes = {
  copy: PropTypes.object.isRequired,
  document: PropTypes.object.isRequired,
  instruction: PropTypes.string.isRequired,
  important: PropTypes.bool.isRequired,
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
  textarea: PropTypes.bool.isRequired,
};
