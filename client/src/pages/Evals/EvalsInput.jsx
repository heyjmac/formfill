import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    const req = store.add({ name: data.name || `Eval`, ...data });
    req.onsuccess = () => {
      const id = req.result;
      tx.oncomplete = () => {
        db.close();
        if (callback) callback(id);
      };
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

const updateInputGroup = (id, data, callback) => {
  openDB((db) => {
    const tx = db.transaction(STORE_INPUTS, 'readwrite');
    const store = tx.objectStore(STORE_INPUTS);
    store.put({ id, ...data });
    tx.oncomplete = () => {
      db.close();
      if (callback) callback();
    };
  });
};

const deleteInputGroup = (id, callback) => {
  openDB((db) => {
    const tx = db.transaction(STORE_INPUTS, 'readwrite');
    const store = tx.objectStore(STORE_INPUTS);
    store.delete(id);
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
  const expectedRef = useRef();

  useEffect(() => {
    const unsubscribe = events.on('evals:overwriteExpected', (newExpected) => {
      setExpectedMap((prev) => ({ ...prev, ...newExpected }));

      setTimeout(() => {
        expectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 600);
    });
    return () => unsubscribe();
  }, []);

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

  useEffect(() => {
    if (!selectedGroupId) return;

    const timeout = setTimeout(() => {
      updateInputGroup(
        selectedGroupId,
        {
          id: selectedGroupId,
          name: renameValue || 'Eval',
          instruction,
          important,
          formFields,
          expectedMap,
          files,
        },
        () => loadInputGroups(setInputGroups),
      );
    }, 1000);

    return () => clearTimeout(timeout);
  }, [instruction, important, formFields, expectedMap, files, selectedGroupId, renameValue]);

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

  const duplicateField = useCallback(
    (index) => {
      const original = formFields[index];
      const baseName = original.name;
      const newName = baseName ? `${baseName}_copy` : '';
      const copy = { ...original, name: newName };

      const updated = [...formFields];
      updated.splice(index + 1, 0, copy);

      const updatedMap = { ...expectedMap };
      Object.keys(updatedMap).forEach((file) => {
        const value = updatedMap[file][baseName] ?? '';
        updatedMap[file][newName] = value;
      });

      setFormFields(updated);
      setExpectedMap(updatedMap);
    },
    [formFields, expectedMap],
  );

  const moveField = useCallback(
    (index, direction) => {
      const updated = [...formFields];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= updated.length) return;

      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      setFormFields(updated);
    },
    [formFields],
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

  useEffect(() => {
    if (isLoading) {
      document.body.style.cursor = 'wait';
    } else {
      document.body.style.cursor = 'default';
    }
  }, [isLoading]);

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

  const handleSave = useCallback(
    () =>
      updateInputGroup(
        selectedGroupId,
        {
          id: selectedGroupId,
          name: renameValue || 'Eval',
          instruction,
          important,
          formFields,
          expectedMap,
          files,
        },
        () => loadInputGroups(setInputGroups),
      ),
    [expectedMap, files, formFields, important, instruction, renameValue, selectedGroupId],
  );

  const getCopyName = (name) => {
    if (!name) return 'New Eval';
    const match = name.match(/^(.*?)( Copy)?(?: (\d+))?$/);
    const base = match[1] || name;
    const copyNumber = match[3] ? parseInt(match[3], 10) + 1 : match[2] ? 2 : '';
    return `${base} Copy${copyNumber ? ' ' + copyNumber : ''}`;
  };

  const handleSaveAs = useCallback(
    () =>
      saveInputGroup(
        {
          name: getCopyName(renameValue),
          instruction,
          important,
          formFields,
          expectedMap,
          files,
        },
        (newId) => {
          setSelectedGroupId(newId);
          localStorage.setItem('evalsInput:lastGroupId', newId);
          loadInputGroups(setInputGroups);
        },
      ),
    [expectedMap, files, formFields, important, instruction, renameValue],
  );

  const handleDelete = useCallback(
    () =>
      deleteInputGroup(selectedGroupId, () => {
        setSelectedGroupId(null);
        setRenameValue('');
        setInstruction('');
        setImportant('');
        setFormFields([]);
        setExpectedMap({});
        setFiles([]);
        localStorage.removeItem('evalsInput:lastGroupId');
        loadInputGroups(setInputGroups);
      }),
    [selectedGroupId],
  );

  const handleNew = useCallback(() => {
    setSelectedGroupId(null);
    setRenameValue('');
    setInstruction('');
    setImportant('');
    setFormFields([]);
    setExpectedMap({});
    setFiles([]);
    localStorage.removeItem('evalsInput:lastGroupId');
  }, []);

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
          <option value="">History</option>
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
                className="cursor-pointer text-gray-500 hover:text-gray-700"
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
            <div className="divide-y divide-neutral-300 md:hidden [&>*:nth-child(even)]:bg-neutral-50">
              {formFields.map((field, i) => (
                <div key={i} className="space-y-2 rounded p-3">
                  <input
                    type="text"
                    placeholder="Field name"
                    value={field.name}
                    onChange={(e) => updateField(i, 'name', e.target.value)}
                    className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm font-semibold"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(i, 'type', e.target.value)}
                    className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm"
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
                  <input
                    type="text"
                    placeholder="Description"
                    value={field.description}
                    onChange={(e) => updateField(i, 'description', e.target.value)}
                    className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-gray-500"
                  />
                  {field.type === 'select-one' ? (
                    <div className="flex flex-wrap items-center gap-2 rounded border border-neutral-300 bg-white px-2 py-1 text-sm">
                      {(field.options || []).map((opt, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1 rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700"
                        >
                          {opt.text}
                          <button
                            onClick={() => {
                              const options = [...(field.options || [])];
                              options.splice(idx, 1);
                              updateField(i, 'options', options);
                              updateField(
                                i,
                                'format',
                                options.map((o) => `"${o.value}"`).join(', '),
                              );
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const val = e.target.value.trim().replace(/^"|"$/g, '');
                            if (val) {
                              const options = [...(field.options || []), { value: val, text: val }];
                              updateField(i, 'options', options);
                              updateField(
                                i,
                                'format',
                                options.map((o) => `"${o.value}"`).join(', '),
                              );
                              e.target.value = '';
                            }
                          }
                        }}
                        placeholder="Add option"
                        className="flex-1 bg-transparent bg-white text-sm outline-none"
                      />
                    </div>
                  ) : field.type === 'number' || field.type === 'range' ? (
                    <input
                      type="text"
                      value={field.format}
                      onChange={(e) => updateField(i, 'format', e.target.value)}
                      placeholder="min-max"
                      className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-gray-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={field.format}
                      onChange={(e) => updateField(i, 'format', e.target.value)}
                      placeholder="Format (optional)"
                      className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-gray-500"
                    />
                  )}
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => moveField(i, -1)}
                      disabled={i === 0}
                      className="text-sm text-gray-500 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveField(i, 1)}
                      disabled={i === formFields.length - 1}
                      className="text-sm text-gray-500 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button onClick={() => duplicateField(i)} className="text-sm text-gray-500">
                      Duplicate
                    </button>
                    <button onClick={() => removeField(i)} className="text-sm text-red-600">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <table className="hidden w-full text-sm md:table">
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
                      {field.type === 'select-one' ? (
                        <div className="flex flex-wrap items-center gap-2 border-0 border-neutral-300 bg-transparent px-2 py-1 text-sm">
                          {(field.options || []).map((opt, idx) => (
                            <span
                              key={idx}
                              className="flex items-center gap-1 rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700"
                            >
                              {opt.text}
                              <button
                                onClick={() => {
                                  const options = [...(field.options || [])];
                                  options.splice(idx, 1);
                                  updateField(i, 'options', options);
                                  updateField(
                                    i,
                                    'format',
                                    options.map((o) => `"${o.value}"`).join(', '),
                                  );
                                }}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                const val = e.target.value.trim().replace(/^"|"$/g, '');
                                if (val) {
                                  const options = [
                                    ...(field.options || []),
                                    { value: val, text: val },
                                  ];
                                  updateField(i, 'options', options);
                                  updateField(
                                    i,
                                    'format',
                                    options.map((o) => `"${o.value}"`).join(', '),
                                  );
                                  e.target.value = '';
                                }
                              }
                            }}
                            placeholder="Add option"
                            className="flex-1 bg-transparent text-sm outline-none"
                          />
                        </div>
                      ) : field.type === 'number' || field.type === 'range' ? (
                        <input
                          type="text"
                          value={field.format}
                          onChange={(e) => updateField(i, 'format', e.target.value)}
                          placeholder="min-max"
                          className="w-full border-0 border-neutral-300 bg-transparent px-2 py-1 text-gray-500"
                        />
                      ) : (
                        <input
                          type="text"
                          value={field.format}
                          onChange={(e) => updateField(i, 'format', e.target.value)}
                          placeholder="Format (optional)"
                          className="w-full border-0 border-neutral-300 bg-transparent px-2 py-1 text-gray-500"
                        />
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => moveField(i, -1)}
                          disabled={i === 0}
                          className="cursor-pointer text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveField(i, 1)}
                          disabled={i === formFields.length - 1}
                          className="cursor-pointer text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => duplicateField(i)}
                          className="cursor-pointer text-gray-400 hover:text-gray-600"
                          title="Duplicate field"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            content_copy
                          </span>
                        </button>
                        <button
                          onClick={() => removeField(i)}
                          className="cursor-pointer text-gray-400 hover:text-gray-600"
                          title="Remove field"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-neutral-300  bg-gray-50 p-4">
              <div />
              <button
                onClick={addField}
                className="flex cursor-pointer items-center gap-1 rounded border border-neutral-300  bg-white px-3 py-1 text-sm hover:bg-gray-50"
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
          <div className="rounded border border-neutral-300 p-4" ref={expectedRef}>
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
                        className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
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
          <div className="flex items-center justify-center gap-2">
            {selectedGroupId && (
              <button
                onClick={handleNew}
                className="flex h-[40px] cursor-pointer items-center rounded border border-neutral-300 px-4 transition-colors hover:bg-gray-50"
                title="Start a new input"
              >
                <span className="material-symbols-outlined mr-1" style={{ fontSize: '18px' }}>
                  add
                </span>
                New
              </button>
            )}

            {selectedGroupId ? (
              <>
                <button
                  className="flex h-[40px] cursor-pointer items-center rounded border border-neutral-300 px-4 transition-colors hover:bg-gray-50"
                  onClick={handleSave}
                  title="Save"
                >
                  <span className="material-symbols-outlined mr-1" style={{ fontSize: '18px' }}>
                    save
                  </span>
                </button>
                <button
                  className="flex h-[40px] cursor-pointer items-center rounded border border-neutral-300 px-4 transition-colors hover:bg-gray-50"
                  onClick={handleSaveAs}
                  title="Save as new version"
                >
                  <span className="material-symbols-outlined mr-1" style={{ fontSize: '18px' }}>
                    file_copy
                  </span>
                </button>
              </>
            ) : (
              <button
                className="flex h-[40px] cursor-pointer items-center rounded border border-neutral-300 px-4 transition-colors hover:bg-gray-50"
                onClick={handleSaveAs}
                title="Save"
              >
                <span className="material-symbols-outlined mr-1" style={{ fontSize: '18px' }}>
                  save
                </span>
                Save
              </button>
            )}
            {selectedGroupId && (
              <button
                className="flex h-[40px] cursor-pointer items-center rounded border border-red-700 px-4 text-red-700 transition-colors hover:bg-gray-50"
                onClick={handleDelete}
                title="Delete this input"
              >
                <span className="material-symbols-outlined mr-1" style={{ fontSize: '18px' }}>
                  delete
                </span>
              </button>
            )}
          </div>
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
              className="h-[40px] w-20 rounded border border-neutral-300 px-3  text-sm"
            />
            <button
              className="hidden h-[40px] cursor-pointer rounded bg-blue-500 px-6 text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 md:block"
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
