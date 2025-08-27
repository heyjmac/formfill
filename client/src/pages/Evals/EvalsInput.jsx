import React, { useState, useEffect, useCallback } from 'react';
import { events } from '../../ai-components/utils/events';

const DB_NAME = 'evalsDB';
const STORE_INPUTS = 'inputGroups';

const openDB = (callback) => {
  const request = indexedDB.open(DB_NAME, 2);
  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains(STORE_INPUTS)) {
      db.createObjectStore(STORE_INPUTS, { keyPath: 'id', autoIncrement: true });
    }
  };
  request.onsuccess = () => callback(request.result);
  request.onerror = () => console.error('IndexedDB open error:', request.error);
};

const saveInputGroup = (data, callback) => {
  openDB((db) => {
    const tx = db.transaction(STORE_INPUTS, 'readwrite');
    const store = tx.objectStore(STORE_INPUTS);
    store.add({ name: data.name || `Eval`, ...data });
    tx.oncomplete = () => {
      db.close();
      if (callback) callback();
    };
  });
};

const renameInputGroup = (id, newName, callback) => {
  openDB((db) => {
    const tx = db.transaction(STORE_INPUTS, 'readwrite');
    const store = tx.objectStore(STORE_INPUTS);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const group = getReq.result;
      if (group) {
        group.name = newName;
        store.put(group);
      }
    };
    tx.oncomplete = () => {
      db.close();
      if (callback) callback();
    };
  });
};

const loadInputGroups = (callback) => {
  openDB((db) => {
    const tx = db.transaction(STORE_INPUTS, 'readonly');
    const store = tx.objectStore(STORE_INPUTS);
    const request = store.getAll();
    request.onsuccess = () => callback(request.result || []);
    request.onerror = () => callback([]);
    tx.oncomplete = () => db.close();
  });
};

export const EvalsInput = () => {
  const [instruction, setInstruction] = useState('');
  const [important, setImportant] = useState('');
  const [times, setTimes] = useState(3);
  const [files, setFiles] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [expectedMap, setExpectedMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [inputGroups, setInputGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    loadInputGroups(setInputGroups);
  }, []);

  useEffect(() => {
    const lastGroupId = Number(localStorage.getItem('evalsInput:lastGroupId'));
    if (lastGroupId) {
      const group = inputGroups.find((g) => g.id === lastGroupId);
      if (group) {
        setInstruction(group.instruction);
        setImportant(group.important);
        setFormFields(group.formFields || []);
        setExpectedMap(group.expectedMap || {});
        setFiles(group.files || []);
        setSelectedGroupId(lastGroupId);
        setRenameValue(group.name || '');
      }
    }
  }, [inputGroups]);

  useEffect(() => {
    events.emit('evals:input', {
      instruction,
      important,
      formFields,
      expected: expectedMap,
      files,
    });
  }, [instruction, important, times, formFields, files, files.length, expectedMap]);

  const handleFileUpload = useCallback(
    (e) => {
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
    },
    [formFields, expectedMap],
  );

  const handleRemoveFile = useCallback(
    (name) => {
      setFiles((prev) => {
        const updated = prev.filter((f) => f.name !== name);
        saveFilesToIndexedDB(updated);
        return updated;
      });
      const updatedMap = { ...expectedMap };
      delete updatedMap[name];
      setExpectedMap(updatedMap);
    },
    [expectedMap],
  );

  const updateField = useCallback(
    (index, key, value) => {
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
    },
    [expectedMap, formFields],
  );

  const addField = useCallback(() => {
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
  }, [expectedMap]);

  const removeField = useCallback(
    (index) => {
      const fieldName = formFields[index].name;
      const updated = [...formFields];
      updated.splice(index, 1);
      setFormFields(updated);

      const updatedMap = { ...expectedMap };
      Object.keys(updatedMap).forEach((file) => {
        delete updatedMap[file][fieldName];
      });
      setExpectedMap(updatedMap);
    },
    [expectedMap, formFields],
  );

  const handleAddExpectedField = useCallback((fileName, newField) => {
    if (!newField) return;
    setExpectedMap((prev) => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        [newField]: '',
      },
    }));
  }, []);

  const handleExpectedFieldChange = useCallback((fileName, key, value, isKey = false) => {
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
  }, []);

  const handleRemoveExpectedField = useCallback((fileName, key) => {
    setExpectedMap((prev) => {
      const updatedFields = { ...prev[fileName] };
      delete updatedFields[key];
      return {
        ...prev,
        [fileName]: updatedFields,
      };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
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
  }, [expectedMap, formFields, files, instruction, important, times]);

  const handleLoadPrevious = useCallback(
    (e) => {
      const id = Number(e.target.value);
      setSelectedGroupId(id);
      localStorage.setItem('evalsInput:lastGroupId', id);
      const group = inputGroups.find((g) => g.id === id);
      if (group) {
        setInstruction(group.instruction);
        setImportant(group.important);
        setFormFields(group.formFields || []);
        setExpectedMap(group.expectedMap || {});
        setFiles(group.files || []);
        setRenameValue(group.name || '');
      }
    },
    [inputGroups],
  );

  return (
    <div className="overflow-hidden rounded-md border border-neutral-300">
      <div className="flex items-center  justify-between border-b border-neutral-300 bg-gray-50 p-4">
        <h2 className="text-lg">Processing Input</h2>
        {selectedGroupId && (
          <input
            type="text"
            placeholder="Rename group"
            className="ml-2 rounded border border-neutral-300 px-2 py-1 text-sm"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => {
              renameInputGroup(selectedGroupId, renameValue, () => loadInputGroups(setInputGroups));
            }}
          />
        )}
        <select onChange={handleLoadPrevious}>
          <option value="">Load Previous</option>
          {inputGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name || `Eval #${g.id}`}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-6 p-6">
        {/* Top Controls */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <label htmlFor="instruction" className="mb-1 block text-sm">
              Instruction
            </label>
            <textarea
              id="instruction"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full rounded border border-neutral-300  px-3 py-2"
            />
          </div>
          <div className="col-span-4">
            <label htmlFor="important" className="mb-1 block text-sm">
              Important Note
            </label>
            <textarea
              id="important"
              value={important}
              onChange={(e) => setImportant(e.target.value)}
              className="w-full rounded border border-neutral-300  px-3 py-2"
            />
          </div>
        </div>
        {/* File Upload */}
        <div>
          <label className="mb-2 block text-sm">Files</label>
          {files.map((file) => (
            <div
              key={file.name}
              className="mb-2 flex items-center justify-between rounded border border-neutral-300  bg-gray-50 p-4"
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
            <label className="inline-flex cursor-pointer items-center rounded border border-neutral-300  px-4 py-2 hover:bg-gray-50">
              <span className="material-symbols-outlined mr-2">upload_file</span>
              <span>Upload Files</span>
              <input type="file" className="hidden" multiple onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {/* Form Fields Table */}
        <div className="break-inside-avoid">
          <label className="mb-2 block text-sm">Form Fields</label>
          <div className="overflow-hidden rounded border border-neutral-300">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-300  bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Field Name</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Format</th>
                  <th className="w-16 p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300">
                {formFields.map((field, i) => (
                  <tr key={i}>
                    <td className="p-3">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(i, 'name', e.target.value)}
                        className="w-full border-0 border-neutral-300  bg-transparent px-2 py-1"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={field.type}
                        onChange={(e) => updateField(i, 'type', e.target.value)}
                        className="w-full border-0 border-neutral-300  bg-transparent px-2 py-1"
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
                        className="w-full border-0 border-neutral-300  bg-transparent px-2 py-1 text-gray-500"
                      />
                    </td>
                    <td className="p-3 text-gray-500">
                      <input
                        type="text"
                        value={field.format}
                        onChange={(e) => updateField(i, 'format', e.target.value)}
                        placeholder="Format (optional)"
                        className="w-full border-0 border-neutral-300  bg-transparent px-2 py-1 text-gray-500"
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
            <div className="flex items-center justify-between border-t border-neutral-300  bg-gray-50 p-4">
              <div />
              <button
                onClick={addField}
                className="flex items-center gap-1 rounded border border-neutral-300  bg-white px-3 py-1 text-sm hover:bg-gray-50"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  add
                </span>
                Add new field
              </button>
            </div>
          </div>
        </div>

        <div className="break-inside-avoid">
          <div className="rounded border border-neutral-300 p-4">
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
                        className="focus:ring-primary-500 flex-1 rounded border border-neutral-300 px-3 py-1 text-sm transition-all focus:outline-none focus:ring-1"
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
                      className="mt-2 rounded border border-neutral-300 px-2 py-1 text-sm"
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

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() =>
              saveInputGroup({ instruction, important, formFields, expectedMap, files })
            }
            className="hidden cursor-pointer rounded px-6 py-2 transition-colors hover:bg-neutral-100 disabled:bg-gray-300 disabled:text-gray-500 md:block"
          >
            Save
          </button>

          <div className="flex items-center justify-center gap-2">
            <label htmlFor="times" className="block text-sm">
              Run Times
            </label>
            <input
              type="number"
              id="times"
              value={times}
              min="1"
              max="10"
              onChange={(e) => setTimes(Number(e.target.value))}
              className="w-20 rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              className="hidden cursor-pointer rounded bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 md:block"
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
    </div>
  );
};
