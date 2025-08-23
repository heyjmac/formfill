import { useRef, useState } from 'react';
import { fillFormFields, getFormFieldLabels, getFormFields } from './utils';

export const FormFillDropdown = () => {
  const fileRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState(false);
  const [fieldLabels, setFieldLabels] = useState({});
  const [fieldsFilled, setFieldsFilled] = useState({});

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
    fillFormFields(fieldsFilled);
  };

  if (status === 'loading') {
    return (
      <div className="absolute bottom-[46px] right-0">
        <div className="w-72 p-6 text-center bg-white border border-gray-100 shadow-lg rounded-lg">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <div className="text-sm text-gray-600">Analyzing your content...</div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="absolute bottom-[46px] right-0">
        <div className="mb-2 w-80 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100 z-10">
          <div className="p-4">
            <div className="text-md font-medium mb-3">
              {Object.keys(fieldsFilled).length} field
              {Object.keys(fieldsFilled).length !== 1 ? 's' : ''} found!
            </div>

            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-1">
              {Object.entries(fieldsFilled).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center space-y-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={key}
                      defaultChecked
                      className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500 cursor-pointer transition-colors"
                    />
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {fieldLabels[key] || key}
                    </span>
                  </div>
                  <span className="text-gray-700 text-sm">{value}</span>
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
              <div
                className="w-full cursor-pointer py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center"
                onClick={handleFill}
              >
                <span className="material-symbols-outlined mr-1 text-sm">fact_check</span>
                <span>Fill selected fields</span>
              </div>

              <div
                className="w-full cursor-pointer py-2 bg-white text-gray-700 text-sm rounded-lg hover:border-gray-300 border border-gray-200 transition-colors flex items-center justify-center"
                onClick={handleClear}
              >
                <span className="material-symbols-outlined mr-1 text-sm">add_circle</span>
                <span>Fill another form</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-[46px] right-0">
      <div className="mb-2 w-72 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100 z-10">
        <div className="p-4">
          <div className="text-md font-medium mb-3">AI Form Auto-Fill</div>
          <div className="mb-3 relative">
            <label className="block w-full py-3 px-4 text-center border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors mb-2">
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
            className="w-full cursor-pointer py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center"
            onClick={handleSubmit}
          >
            <span className="material-symbols-outlined mr-1 text-sm">auto_awesome</span>
            <span>Extract fields</span>
          </div>
        </div>
      </div>
    </div>
  );
};
