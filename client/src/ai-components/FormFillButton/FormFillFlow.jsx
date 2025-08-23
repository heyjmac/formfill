import { useRef, useState } from 'react';
import { fillFormFields, getCleanData, getFormFieldLabels, getFormFields } from './utils';
import { events } from '../utils/events';
import { copy } from './copy';

export const FormFillFlow = () => {
  const fileRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState(false);
  const [fieldLabels, setFieldLabels] = useState({});
  const [fieldsFilled, setFieldsFilled] = useState({});
  const [errorCode, setErrorCode] = useState(null);
  const [undoFields, setUndoFields] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [selectedFields, setSelectedFields] = useState({});

  const handleSubmit = async () => {
    setStatus('loading');
    const formFields = getFormFields();
    const formFieldLabels = getFormFieldLabels();
    setFieldLabels(formFieldLabels);
    const formData = new FormData();
    formData.append('formFields', JSON.stringify(formFields));
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
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length) setFiles(selectedFiles);
  };

  const handleClear = () => {
    setFiles([]);
    setText('');
    setStatus('idle');
  };

  const handleApply = () => {
    const selected = Object.fromEntries(
      Object.entries(fieldsFilled).filter(([key]) => selectedFields[key]),
    );
    const previousValues = fillFormFields(selected);
    setUndoFields(previousValues);
    setIsDirty(false);
  };

  const handleUndo = () => {
    fillFormFields(undoFields);
    setUndoFields({});
  };

  const handleReapply = () => {
    fillFormFields(undoFields);
    const selected = Object.fromEntries(
      Object.entries(fieldsFilled).filter(([key]) => selectedFields[key]),
    );
    const previousValues = fillFormFields(selected);
    setUndoFields(previousValues);
    setIsDirty(false);
  };

  const handleClose = () => events.emit('formFill', { isOpen: false });

  const handleSelectAll = () => {
    const allSelected = Object.fromEntries(Object.keys(fieldsFilled).map((key) => [key, true]));
    setSelectedFields(allSelected);
    setIsDirty(true);
  };

  const handleClearSelection = () => {
    const noneSelected = Object.fromEntries(Object.keys(fieldsFilled).map((key) => [key, false]));
    setSelectedFields(noneSelected);
    setIsDirty(true);
  };

  const TopNav = ({ handleBack, title }) => (
    <div className="flex items-center justify-between mb-4 -mt-1">
      <div>
        {handleBack && (
          <button
            onClick={handleBack}
            className="cursor-pointer text-gray-400 hover:text-black transition-colors flex items-center text-sm"
          >
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
        )}
      </div>
      {title && <div className="text-md font-medium">{title}</div>}
      <button
        onClick={handleClose}
        className="cursor-pointer text-gray-400 hover:text-black transition-colors flex items-center text-base"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );

  if (status === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="p-4 text-center">
          <div className="text-blue-500 mb-2 text-3xl">
            <span className="material-symbols-outlined animate-spin inline-block">
              progress_activity
            </span>
          </div>
          <div className="text-sm text-gray-700 mb-3">{copy.text.processing}</div>
          <button
            className="w-full py-2 bg-gray-300 text-gray-800 text-sm rounded-lg hover:bg-gray-400 transition-colors"
            onClick={handleClear}
          >
            {copy.cta.cancel || copy.cta.stop}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="p-4">
        <TopNav
          handleBack={handleClear}
          title={
            Object.keys(fieldsFilled).length > 1
              ? copy.fields_found.plural.replace('{{count}}', Object.keys(fieldsFilled).length)
              : copy.fields_found.singular
          }
        />
        <div className="text-sm text-gray-600 mb-4">{copy.text.review}</div>
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {Object.entries(fieldsFilled).map(([key, value]) => (
            <label
              key={key}
              className={`flex justify-between items-center px-2 py-2 rounded 
                ${
                  selectedFields[key]
                    ? 'border border-blue-200 bg-blue-50 hover:bg-blue-100'
                    : 'border border-gray-200 hover:border-gray-300'
                }`}
            >
              <span
                className={`text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium ${
                  selectedFields[key] ? 'bg-white' : 'bg-gray-100'
                }`}
              >
                {fieldLabels[key] || key}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-700 text-sm">{value}</span>
                <input
                  type="checkbox"
                  id={key}
                  checked={selectedFields[key] ?? true}
                  onChange={(e) => {
                    setSelectedFields((prev) => ({ ...prev, [key]: e.target.checked }));
                    setIsDirty(true);
                  }}
                  className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500 cursor-pointer transition-colors"
                />
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-between mb-4">
          <button
            className="cursor-pointer text-xs text-gray-600 hover:text-gray-900 flex items-center transition-colors"
            onClick={handleClearSelection}
          >
            <span className="material-symbols-outlined mr-1 text-sm">deselect</span>
            {copy.cta.clear_selection}
          </button>
          <button
            className="cursor-pointer text-xs text-gray-600 hover:text-gray-900 flex items-center transition-colors"
            onClick={handleSelectAll}
          >
            <span className="material-symbols-outlined mr-1 text-sm">select_all</span>
            {copy.cta.select_all}
          </button>
        </div>

        <div className="space-y-3">
          {Object.keys(undoFields).length ? (
            <div className="flex justify-between">
              <div
                className="cursor-pointer px-4 py-2 bg-white text-red-700 text-sm rounded-lg hover:border-gray-300 border border-gray-200 transition-colors flex items-center justify-center"
                onClick={handleUndo}
              >
                <span className="material-symbols-outlined mr-1 text-sm">undo</span>
                <span>{copy.cta.undo}</span>
              </div>
              {isDirty ? (
                <div
                  className="cursor-pointer px-4 py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800 border border-blue-900 transition-colors flex items-center justify-center"
                  onClick={handleReapply}
                >
                  <span className="material-symbols-outlined mr-1 text-sm">refresh</span>
                  <span>{copy.cta.reapply}</span>
                </div>
              ) : (
                <div
                  className="cursor-pointer px-4 py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800 border border-blue-900 transition-colors flex items-center justify-center"
                  onClick={handleClose}
                >
                  <span className="material-symbols-outlined mr-1 text-sm">close</span>
                  <span>{copy.cta.close}</span>
                </div>
              )}
            </div>
          ) : Object.values(selectedFields).some(Boolean) ? (
            <div
              className="w-full cursor-pointer px-4 py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800 border border-blue-900 transition-colors flex items-center justify-center"
              onClick={handleApply}
            >
              <span className="material-symbols-outlined mr-1 text-sm">done</span>
              <span>{copy.cta.apply}</span>
            </div>
          ) : (
            <div
              className="w-full cursor-pointer px-4 py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800 border border-blue-900 transition-colors flex items-center justify-center"
              onClick={handleClose}
            >
              <span className="material-symbols-outlined mr-1 text-sm">close</span>
              <span>{copy.cta.close}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="p-4">
          <div className="text-red-500 mb-2 text-3xl">
            <span className="material-symbols-outlined">error</span>
          </div>
          <div className="text-sm text-gray-700 mb-3">
            {copy.error[errorCode] && <div>{copy.error[errorCode]}</div>}
            {!errorCode && <div>{copy.error.DEFAULT}</div>}
          </div>
          <button
            className="w-full py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-500 transition-colors"
            onClick={handleClear}
          >
            {copy.cta.error}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <TopNav title={copy.title.main} />
      <div className="mb-3 relative">
        <label className="block w-full py-3 px-4 text-center border border-dashed border-gray-300 rounded-lg cursor-pointer px-4 hover:bg-gray-50 transition-colors mb-2">
          <span className="material-symbols-outlined mb-1">upload_file</span>
          <div className="block text-xs">
            {files.length > 0 ? files.map((f) => f.name).join(', ') : copy.text.drop_area}
          </div>
          <span className="block text-xs text-gray-500 mt-1">
            {files.length > 0
              ? files.length > 1
                ? copy.files_selected.plural.replace('{{count}}', files.length)
                : copy.files_selected.singular
              : copy.text.supported_formats}
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
            className="cursor-pointer absolute w-[18px] h-[18px] top-[-8px] right-[-8px] bg-gray-200 text-gray-700 rounded-full text-xs flex items-center justify-center hover:bg-red-400 hover:text-white"
            onClick={() => setFiles([])}
            aria-label="Clear files"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      <div className="flex items-center my-3">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="mx-3 text-xs text-gray-400 uppercase">or</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      <div className="mb-3">
        <textarea
          className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          placeholder={copy.text.paste_text}
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>
      </div>

      <div className="flex items-center text-xs text-gray-500 mb-4">
        <p>{copy.text.info}</p>
      </div>

      <div
        className={`w-full py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800 border border-blue-900 transition-colors flex items-center justify-center ${
          files.length === 0 && !text ? 'opacity-50 cursor-default' : 'cursor-pointer px-4'
        }`}
        onClick={handleSubmit}
      >
        <span className="material-symbols-outlined mr-1 text-sm">auto_awesome</span>
        <span>Extract fields</span>
      </div>
    </div>
  );
};
