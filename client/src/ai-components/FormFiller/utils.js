import { defaultCopy } from './defaultCopy';

const typeToMcpFormat = {
  email: 'email',
  url: 'uri',
  date: 'date',
  time: 'time',
  'datetime-local': 'date-time',
};

function unsnake(str = '') {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export const getCopy = (address, copy) => {
  const keys = address.split('.');
  let current = copy;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      current = null;
      break;
    }
  }

  if (current !== null) return current;

  current = defaultCopy;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return current;
};

export const getCleanData = (data) => {
  const cleanedData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => {
      const normalized = (v) =>
        typeof v === 'string' && ['null', 'undefined', 'unknown'].includes(v.toLowerCase());
      if (!value) return false;
      if (typeof value === 'string') {
        return value.trim() && !normalized(value);
      }
      if (Array.isArray(value)) {
        return value.some((v) => !normalized(v));
      }
      return true;
    }),
  );
  return cleanedData;
};

const getLabelText = (input) => {
  if (input.id) {
    const byFor = document.querySelector(`label[for="${input.id}"]`);
    if (byFor) return byFor.textContent.trim();
  }
  const wrap = input.closest('label');
  if (wrap) return wrap.textContent.trim();
  return input.getAttribute('aria-label') || input.placeholder || input.value || '';
};

export function getFormFieldLabels() {
  const els = document.querySelectorAll('[data-form-filler-name]');
  const labels = [];

  els.forEach((el) => {
    const name = el.getAttribute('data-form-filler-name') || el.name;
    if (!name) return;

    let label = '';
    const parent = el.closest('div');
    if (parent) {
      const labelEl = parent.querySelector('label');
      if (labelEl) label = labelEl.textContent.trim();
    }

    if (!label && el.closest('label')) {
      label = el.closest('label').textContent.trim();
    }

    labels.push({ name, label: label || unsnake(name) });
  });

  return labels;
}

export function getFormFieldValues() {
  const els = document.querySelectorAll('[data-form-filler-description]');
  const values = {};

  els.forEach((el) => {
    const name = el.getAttribute('data-form-filler-name') || el?.name || getLabelText(el);
    if (!name) return;

    if (el.tagName === 'SELECT') {
      if (el.multiple) {
        values[name] = Array.from(el.selectedOptions).map((opt) => opt.value);
      } else {
        values[name] = el.value;
      }
    } else if (el.type === 'checkbox') {
      const checkboxes = document.querySelectorAll(`input[type="checkbox"][name="${el.name}"]`);
      values[name] = Array.from(checkboxes)
        .filter((c) => c.checked)
        .map((c) => c.value);
    } else if (el.type === 'radio') {
      const radios = document.querySelectorAll(`input[type="radio"][name="${el.name}"]`);
      const checked = Array.from(radios).find((r) => r.checked);
      values[name] = checked ? checked.value : null;
    } else {
      values[name] = el.value;
    }
  });

  return values;
}

export function getFormFields(important) {
  const els = document.querySelectorAll('[data-form-filler-description]');
  const properties = {};
  const required = [];

  els.forEach((el) => {
    const name = el.getAttribute('data-form-filler-name') || el?.name || getLabelText(el);
    const description = el.getAttribute('data-form-filler-description');
    const explicitFormat = el.getAttribute('data-form-filler-format');
    const optionValues = [];

    const qualifiedDescription = important ? `${important}: ${description}` : description;

    const fullDescription = [qualifiedDescription];
    if (explicitFormat) fullDescription.push(`ADAPT TO THIS FORMAT: ${explicitFormat}`);

    if (el.tagName === 'SELECT') {
      const options = Array.from(el.options).map((opt) => ({ value: opt.value, text: opt.text }));
      optionValues.push(...options.map((o) => o.value));
      fullDescription.push(
        `Select options (${el.multiple ? 'multiple' : 'single'} choice): ${JSON.stringify(
          options,
        )}`,
      );
    } else if (el?.type === 'radio' || el?.type === 'checkbox') {
      const group = document.querySelectorAll(`input[type="${el.type}"][name="${el.name}"]`);
      const options = Array.from(group).map((input) => ({
        value: input.value,
        label:
          input.getAttribute('data-label') || input.nextSibling?.textContent?.trim() || input.value,
      }));
      optionValues.push(...options.map((o) => o.value));
      fullDescription.push(
        `${el.type[0].toUpperCase() + el.type.slice(1)} options: ${JSON.stringify(options)}`,
      );
    } else if (el?.type) {
      fullDescription.push(`Input type: ${el.type}`);
    }

    if (el.tagName === 'INPUT') {
      const constraints = [];
      ['pattern', 'maxlength', 'minlength', 'min', 'max', 'step'].forEach((attr) => {
        if (el.hasAttribute(attr)) constraints.push(`${attr}: ${el.getAttribute(attr)}`);
      });
      if (constraints.length) fullDescription.push(`Constraints: ${constraints.join(', ')}`);
    }

    // if (el?.value) fullDescription.push(`Current calue: ${el.value}`);
    // if (el?.placeholder) fullDescription.push(`Placeholder: ${el.placeholder}`);

    properties[name] = { description: fullDescription.join('; ') };

    if (el?.pattern) properties[name].pattern = el.pattern;
    if (el?.maxLength && el.maxLength !== -1) properties[name].maxLength = el.maxLength;
    if (el?.minLength && el.minLength !== -1) properties[name].minLength = el.minLength;

    // CHANGED: only add numeric minimum/maximum for number/range inputs, and coerce to Number
    if (el?.tagName === 'INPUT' && (el.type === 'number' || el.type === 'range')) {
      if (el.min !== '') properties[name].minimum = Number(el.min);
      if (el.max !== '') properties[name].maximum = Number(el.max);
    }

    if (el?.required) required.push(name);

    // FIXED: only add enum if optionValues has non-empty strings
    const cleanedValues = optionValues.filter((v) => v !== '');
    if (cleanedValues.length) properties[name].enum = cleanedValues; // ← FIXED HERE

    if (el.tagName === 'INPUT' && typeToMcpFormat[el.type]) {
      properties[name].format = typeToMcpFormat[el.type];
    }

    // CHANGED: set type "number" only for number/range inputs; otherwise "string"
    if (el.tagName === 'INPUT' && (el.type === 'number' || el.type === 'range')) {
      properties[name].type = 'number';
    } else if (el?.multiple || el?.type === 'checkbox') {
      properties[name].type = 'array';
      properties[name].items = { type: 'string' };
    } else {
      properties[name].type = 'string';
    }
  });

  return { properties, required };
}

// TO-DO: implement form data validation
export function validateFormData(data) {
  const els = document.querySelectorAll('[data-form-filler-description]');
  const errors = [];
  const fieldStatus = {}; // { [name]: { valid: boolean, failed: string[] } }

  const toNumber = (v) => (v === '' || v == null ? NaN : Number(v));
  const approxMod = (val, step) => {
    const q = Math.round(val / step);
    return Math.abs(val - q * step) < 1e-9;
  };

  const ensureField = (name) => (fieldStatus[name] ||= { valid: true, failed: [] });
  const fail = (name, rule, message) => {
    ensureField(name).valid = false;
    ensureField(name).failed.push(rule);
    errors.push({ name, rule, message });
  };

  for (const el of els) {
    const name = el.getAttribute('data-form-filler-name') || el?.name || getLabelText(el);
    if (!name) continue;
    const inputValue = data?.[name];
    if (inputValue == null) continue; // not validating missing fields here

    // Normalize value(s)
    let values = [];
    if (el.tagName === 'SELECT' && el.multiple)
      values = Array.isArray(inputValue) ? inputValue : [inputValue];
    else if (el.type === 'checkbox') values = Array.isArray(inputValue) ? inputValue : [inputValue];
    else values = [inputValue];

    // pattern (text-like)
    if (el.pattern) {
      const re = new RegExp(`^(?:${el.pattern})$`);
      for (const v of values) {
        if (typeof v === 'string') {
          if (!re.test(v))
            fail(name, 'pattern', `Value "${v}" does not match pattern ${el.pattern}.`);
        }
      }
    }

    // maxlength / minlength (strings only)
    const maxLength = el.maxLength && el.maxLength !== -1 ? el.maxLength : null;
    const minLength = el.minLength && el.minLength !== -1 ? el.minLength : null;
    if (maxLength != null) {
      for (const v of values) {
        if (typeof v === 'string' && v.length > maxLength)
          fail(name, 'maxlength', `Length ${v.length} exceeds maxlength ${maxLength}.`);
      }
    }
    if (minLength != null) {
      for (const v of values) {
        if (typeof v === 'string' && v.length < minLength)
          fail(name, 'minlength', `Length ${v.length} is less than minlength ${minLength}.`);
      }
    }

    // min / max / step (numbers only per spec for this validator)
    if (el.tagName === 'INPUT' && (el.type === 'number' || el.type === 'range')) {
      const hasMin = el.min !== '';
      const hasMax = el.max !== '';
      const min = hasMin ? Number(el.min) : NaN;
      const max = hasMax ? Number(el.max) : NaN;
      const hasStep = el.step && el.step !== 'any';
      const step = hasStep ? Number(el.step) : NaN;
      const base = hasMin ? min : 0;

      for (const v of values) {
        const num = toNumber(v);
        if (Number.isNaN(num)) {
          fail(name, 'type', `Value "${v}" is not a valid number.`);
          continue;
        }
        if (hasMin && num < min) fail(name, 'min', `Value ${num} is less than min ${min}.`);
        if (hasMax && num > max) fail(name, 'max', `Value ${num} is greater than max ${max}.`);
        if (hasStep && !approxMod(num - base, step))
          fail(name, 'step', `Value ${num} is not aligned to step ${step} from base ${base}.`);
      }
    }

    // For selects / radios / checkboxes: ensure values are among available options
    if (el.tagName === 'SELECT') {
      const options = new Set(Array.from(el.options).map((o) => o.value));
      for (const v of values) {
        if (!options.has(String(v))) fail(name, 'enum', `Value "${v}" is not a valid option.`);
      }
    } else if (el.type === 'radio') {
      const radios = document.querySelectorAll(`input[type="radio"][name="${el.name}"]`);
      const options = new Set(Array.from(radios).map((r) => r.value));
      for (const v of values) {
        if (v != null && v !== '' && !options.has(String(v)))
          fail(name, 'enum', `Value "${v}" is not a valid option.`);
      }
    } else if (el.type === 'checkbox') {
      const checkboxes = document.querySelectorAll(`input[type="checkbox"][name="${el.name}"]`);
      const options = new Set(Array.from(checkboxes).map((c) => c.value));
      for (const v of values)
        if (!options.has(String(v))) fail(name, 'enum', `Value "${v}" is not a valid option.`);
    }

    // Mark field as valid if no failures recorded
    ensureField(name);
  }

  const valid = errors.length === 0;
  return { valid, errors, fields: fieldStatus };
}

export function fillFormFields(data, { speed = 25, perFieldDelay = 80 } = {}) {
  const validated = validateFormData(data);
  console.log('Validation result:', validated);

  const els = document.querySelectorAll('[data-form-filler-description]');
  const previousValues = {};
  const processedGroups = new Set();

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const typeInto = async (el, text) => {
    const str = String(text ?? '');
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    for (let i = 0; i < str.length; i++) {
      el.value += str[i];
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(speed);
    }
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const flashOutline = (el) => {
    el.style.transition = 'all 0.6s ease';
    el.style.outline = '2px solid transparent';
    requestAnimationFrame(() => {
      el.style.outlineColor = '#3b82f6';
      setTimeout(() => {
        el.style.outlineColor = 'transparent';
        setTimeout(() => {
          el.style.outline = '';
        }, 600);
      }, 300);
    });
  };

  let chain = Promise.resolve();

  for (const el of els) {
    const name =
      el.getAttribute('data-form-filler-name') ||
      el.name ||
      (typeof getLabelText === 'function' ? getLabelText(el) : undefined);
    if (!name) continue;
    const value = data?.[name];
    if (value == null) continue;

    if (el.tagName === 'SELECT') {
      const selected = Array.from(el.selectedOptions).map((opt) => opt.value);
      previousValues[name] = el.multiple ? selected : el.value;
      chain = chain.then(async () => {
        flashOutline(el);
        const options = Array.from(el.options).map((opt) => opt.value);
        if (el.multiple && Array.isArray(value)) {
          for (const opt of el.options) opt.selected = false;
          for (const v of value)
            if (options.includes(v)) el.querySelector(`option[value="${v}"]`).selected = true;
        } else if (options.includes(value)) el.value = value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(perFieldDelay);
      });
      continue;
    }

    if (el.type === 'checkbox') {
      const groupKey = `checkbox:${el.name}`;
      if (processedGroups.has(groupKey)) continue;
      processedGroups.add(groupKey);

      const checkboxes = document.querySelectorAll(`input[type="checkbox"][name="${el.name}"]`);
      const old = [];
      checkboxes.forEach((c) => c.checked && old.push(c.value));
      previousValues[name] = old;

      chain = chain.then(async () => {
        checkboxes.forEach((c) => flashOutline(c));
        checkboxes.forEach((c) => {
          if (Array.isArray(value)) c.checked = value.includes(c.value);
          else c.checked = value === c.value;
          c.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await sleep(perFieldDelay);
      });
      continue;
    }

    if (el.type === 'radio') {
      const groupKey = `radio:${el.name}`;
      if (processedGroups.has(groupKey)) continue;
      processedGroups.add(groupKey);

      const radios = document.querySelectorAll(`input[type="radio"][name="${el.name}"]`);
      const old = Array.from(radios).find((r) => r.checked)?.value || null;
      previousValues[name] = old;

      chain = chain.then(async () => {
        radios.forEach((r) => flashOutline(r));
        radios.forEach((r) => {
          r.checked = r.value === value;
          if (r.checked) r.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await sleep(perFieldDelay);
      });
      continue;
    }

    // text-like inputs and textarea
    previousValues[name] = el.value;
    chain = chain.then(async () => {
      flashOutline(el);
      await typeInto(el, value);
      await sleep(perFieldDelay);
    });
  }

  // run the chain without forcing callers to await; keep for debugging if needed
  fillFormFields._running = chain.catch(() => {});
  return previousValues;
}
