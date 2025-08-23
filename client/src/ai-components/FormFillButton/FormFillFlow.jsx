import { useRef, useState } from 'react';
import { fillFormFields, getFormFieldLabels, getFormFields } from './utils';
import { events } from '../utils/events';

export const FormFillFlow = () => {
  const fileRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState(false);
  const [fieldLabels, setFieldLabels] = useState({});
  const [fieldsFilled, setFieldsFilled] = useState({});
  const [errorCode, setErrorCode] = useState(null);
  const [undoFields, setUndoFields] = useState({});

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
        setFieldsFilled(data.data);
        console.log('Form filled successfully:', data.data);
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

  const handleFill = () => {
    const previousValues = fillFormFields(fieldsFilled);
    setUndoFields(previousValues);
  };

  const handleUndo = () => {
    fillFormFields(undoFields);
    setUndoFields({});
  };

  const handleClose = () => events.emit('formFill', { isOpen: false });

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
        <div className="p-4">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <div className="text-sm text-gray-600">Analyzing your content...</div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="p-4">
        <TopNav
          handleBack={handleClear}
          title={`${Object.keys(fieldsFilled).length} form field${
            Object.keys(fieldsFilled).length !== 1 ? 's' : ''
          } found`}
        />
        <div className="text-sm text-gray-600 mb-4">
          Please review the information below before applying it.
        </div>
        <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-1">
          {Object.entries(fieldsFilled).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center space-y-1">
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {fieldLabels[key] || key}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-700 text-sm">{value}</span>
                <input
                  type="checkbox"
                  id={key}
                  defaultChecked
                  className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500 cursor-pointer px-4 transition-colors"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between mb-4">
          <button className="text-xs text-gray-600 hover:text-gray-900 flex items-center transition-colors">
            <span className="material-symbols-outlined mr-1 text-sm">deselect</span>
            Clear selection
          </button>
          <button className="text-xs text-gray-600 hover:text-gray-900 flex items-center transition-colors">
            <span className="material-symbols-outlined mr-1 text-sm">select_all</span>
            Select all
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
                <span>Undo</span>
              </div>
              <div
                className="cursor-pointer px-4 py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800 border border-blue-900 transition-colors flex items-center justify-center"
                onClick={handleClose}
              >
                <span className="material-symbols-outlined mr-1 text-sm">close</span>
                <span>Close</span>
              </div>
            </div>
          ) : (
            <div
              className="w-full cursor-pointer px-4 py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800 border border-blue-900 transition-colors flex items-center justify-center"
              onClick={handleFill}
            >
              <span className="material-symbols-outlined mr-1 text-sm">done</span>
              <span>Confirm and apply selection</span>
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
            {errorCode === 'INVALID_FILE_TYPE' && (
              <div>Unsupported file type. Please upload a valid document.</div>
            )}
            {errorCode === 'LIMIT_FILE_SIZE' && (
              <div>File is too large. Please upload a smaller document.</div>
            )}
            {errorCode === 'NO_INPUT_PROVIDED' && (
              <div>No input provided. Please upload a document or enter text.</div>
            )}
            {!errorCode && <div>Something went wrong while processing your request.</div>}
          </div>
          <button
            className="w-full py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-500 transition-colors"
            onClick={handleClear}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <TopNav title="AI Form Auto-Fill" />
      <div className="mb-3 relative">
        <label className="block w-full py-3 px-4 text-center border border-dashed border-gray-300 rounded-lg cursor-pointer px-4 hover:bg-gray-50 transition-colors mb-2">
          <span className="material-symbols-outlined mb-1">upload_file</span>
          <div className="block text-xs">
            {files.length > 0
              ? files.map((f) => f.name).join(', ')
              : 'Drop document here or click to browse'}
          </div>
          <span className="block text-xs text-gray-500 mt-1">
            {files.length > 0
              ? `${files.length} file(s) selected`
              : 'Supported formats: PDF, DOCX, TXT'}
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
            <span>×</span>
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
          placeholder="Paste your text here and let AI extract the information"
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>
      </div>

      <div className="flex items-center text-xs text-gray-500 mb-4">
        <p>Our AI will analyze your content and fill out the form automatically.</p>
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
