import React, { useState } from 'react';
import { events } from '../../ai-components/utils/events';

export const Input = () => {
  const [instruction, setInstruction] = useState('');
  const [important, setImportant] = useState('');
  const [times, setTimes] = useState(3);
  const [files, setFiles] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [expectedMap, setExpectedMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e) => {
    const uploaded = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...uploaded]);

    const updatedMap = { ...expectedMap };
    uploaded.forEach((file) => {
      updatedMap[file.name] = updatedMap[file.name] || {};
      formFields.forEach(({ name }) => {
        updatedMap[file.name][name] = '';
      });
    });
    setExpectedMap(updatedMap);
  };

  const handleRemoveFile = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    const updatedMap = { ...expectedMap };
    delete updatedMap[name];
    setExpectedMap(updatedMap);
  };
  const updateField = (index, key, value) => {
    const updated = [...formFields];
    const oldName = updated[index].name;
    updated[index][key] = value;
    setFormFields(updated);

    if (key === 'name' && oldName !== value) {
      const updatedMap = { ...expectedMap };
      Object.keys(updatedMap).forEach((file) => {
        updatedMap[file][value] = updatedMap[file][oldName] || '';
        delete updatedMap[file][oldName];
      });
      setExpectedMap(updatedMap);
    }
  };

  const addField = () => {
    const newField = { name: '', type: 'text', description: '', format: '' };
    setFormFields((prev) => {
      const updated = [...prev, newField];
      const updatedMap = { ...expectedMap };
      Object.keys(updatedMap).forEach((file) => {
        updatedMap[file][''] = '';
      });
      setExpectedMap(updatedMap);
      return updated;
    });
  };

  const removeField = (index) => {
    const fieldName = formFields[index].name;
    const updated = [...formFields];
    updated.splice(index, 1);
    setFormFields(updated);

    const updatedMap = { ...expectedMap };
    Object.keys(updatedMap).forEach((file) => {
      delete updatedMap[file][fieldName];
    });
    setExpectedMap(updatedMap);
  };

  const handleAddExpectedField = (fileName, newField) => {
    if (!newField) return;
    setExpectedMap((prev) => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        [newField]: '',
      },
    }));
  };

  const handleExpectedFieldChange = (fileName, key, value, isKey = false) => {
    setExpectedMap((prev) => {
      const updatedFields = { ...prev[fileName] };
      if (isKey) {
        const val = updatedFields[key];
        delete updatedFields[key];
        updatedFields[value] = val;
      } else {
        updatedFields[key] = value;
      }
      return {
        ...prev,
        [fileName]: updatedFields,
      };
    });
  };

  const handleRemoveExpectedField = (fileName, key) => {
    setExpectedMap((prev) => {
      const updatedFields = { ...prev[fileName] };
      delete updatedFields[key];
      return {
        ...prev,
        [fileName]: updatedFields,
      };
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const body = new FormData();
    body.append('instruction', instruction);
    body.append('important', important);
    body.append('formFields', JSON.stringify(formFields));
    body.append('expected', JSON.stringify(expectedMap));
    files.forEach((f) => body.append('files', f));

    const res = await fetch(`/api/evals?times=${times}`, {
      method: 'POST',
      body,
    });

    const json = await res.json();
    events.emit('evals:summary', json.summary);
    events.emit('evals:results', json.results);
    setIsLoading(false);
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="border-b  bg-gray-50 p-4">
        <h2 className="text-lg">Processing Input</h2>
      </div>
      <div className="space-y-6 p-6">
        {/* Top Controls */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="instruction" className="mb-1 block text-sm">
              Instruction
            </label>
            <input
              type="text"
              id="instruction"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full rounded border  px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="important" className="mb-1 block text-sm">
              Important Note
            </label>
            <input
              type="text"
              id="important"
              value={important}
              onChange={(e) => setImportant(e.target.value)}
              className="w-full rounded border  px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label htmlFor="times" className="mb-1 block text-sm">
            Run Times
          </label>
          <input
            type="number"
            id="times"
            value={times}
            min="1"
            max="10"
            onChange={(e) => setTimes(Number(e.target.value))}
            className="w-24 rounded border  px-3 py-2"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="mb-2 block text-sm">Files</label>
          {files.map((file) => (
            <div
              key={file.name}
              className="mb-2 flex items-center justify-between rounded border  bg-gray-50 p-4"
            >
              <div className="flex items-center">
                <span className="material-symbols-outlined mr-3 text-gray-600">description</span>
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveFile(file.name)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
          <div className="mt-2 flex space-x-2">
            <label className="inline-flex cursor-pointer items-center rounded border  px-4 py-2 hover:bg-gray-50">
              <span className="material-symbols-outlined mr-2">upload_file</span>
              <span>Upload Files</span>
              <input type="file" className="hidden" multiple onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {/* Form Fields Table */}
        <div>
          <label className="mb-2 block text-sm">Form Fields</label>
          <div className="overflow-hidden rounded border">
            <table className="w-full text-sm">
              <thead className="border-b  bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Field Name</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Format</th>
                  <th className="w-16 p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {formFields.map((field, i) => (
                  <tr key={i}>
                    <td className="p-3">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(i, 'name', e.target.value)}
                        className="w-full border-0  bg-transparent px-2 py-1"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={field.type}
                        onChange={(e) => updateField(i, 'type', e.target.value)}
                        className="w-full border-0  bg-transparent px-2 py-1"
                      >
                        {[
                          'text',
                          'email',
                          'select-one',
                          'number',
                          'date',
                          'tel',
                          'checkbox',
                          'radio',
                          'range',
                          'time',
                          'textarea',
                        ].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-gray-500">
                      <input
                        type="text"
                        value={field.description}
                        onChange={(e) => updateField(i, 'description', e.target.value)}
                        className="w-full border-0  bg-transparent px-2 py-1 text-gray-500"
                      />
                    </td>
                    <td className="p-3 text-gray-500">
                      <input
                        type="text"
                        value={field.format}
                        onChange={(e) => updateField(i, 'format', e.target.value)}
                        placeholder="Format (optional)"
                        className="w-full border-0  bg-transparent px-2 py-1 text-gray-500"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => removeField(i)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          delete
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t  bg-gray-50 p-4">
              <div />
              <button
                onClick={addField}
                className="flex items-center gap-1 rounded border  bg-white px-3 py-1 text-sm hover:bg-gray-50"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  add
                </span>
                Add new field
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="rounded border p-4">
            <label className="mb-2 block text-sm">Expected Results</label>
            {Object.entries(expectedMap).length === 0 && (
              <div className="text-gray-500">Add a file first</div>
            )}
            {Object.entries(expectedMap).map(([fileName, fields]) => (
              <div key={fileName} className="mb-4">
                <p className="mb-2 text-sm font-medium">{fileName}</p>
                <div className="space-y-2">
                  {Object.entries(fields).length === 0 && (
                    <div className="text-gray-500">Add at least one form field</div>
                  )}
                  {Object.entries(fields).map(([field, value], index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm">{field}:</span>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleExpectedFieldChange(fileName, field, e.target.value)}
                        className="focus:ring-primary-500 flex-1 rounded border px-3 py-1 text-sm transition-all focus:outline-none focus:ring-1"
                      />
                      <button
                        className="text-gray-400 transition-colors hover:text-gray-600"
                        onClick={() => handleRemoveExpectedField(fileName, field)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          close
                        </span>
                      </button>
                    </div>
                  ))}
                  {formFields.map((f) => f.name).filter((name) => !(name in fields)).length > 0 && (
                    <select
                      onChange={(e) => {
                        handleAddExpectedField(fileName, e.target.value);
                        e.target.selectedIndex = 0;
                      }}
                      className="mt-2 rounded border px-2 py-1 text-sm"
                    >
                      <option value="">Add field</option>
                      {formFields
                        .map((f) => f.name)
                        .filter((name) => !(name in fields))
                        .map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            className="rounded bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !instruction.trim() ||
              !files.length ||
              !formFields.length ||
              formFields.some((f) => !f.name)
            }
          >
            {isLoading ? 'Processing...' : 'Process Documents'}
          </button>
        </div>
      </div>
    </div>
  );
};
