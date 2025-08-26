import { defaultCopy } from './defaultCopy';

const unsnake = (str = '') => {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

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
    Object.entries(data).filter((entry) => {
      const [_key, value] = entry;
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

export const getFormFieldLabels = () => {
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
};

export const getFormFieldValues = () => {
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
};

export const getFormFields = () => {
  const els = document.querySelectorAll('[data-form-filler-description]');
  return Array.from(els).map((el) => {
    const name = el.getAttribute('data-form-filler-name') || el?.name || getLabelText(el);
    const description = el.getAttribute('data-form-filler-description');
    const explicitFormat = el.getAttribute('data-form-filler-format');
    const type = el.type;
    const tag = el.tagName;
    const multiple = el.multiple;
    const required = el.required;
    const pattern = el.pattern;
    const maxLength = el.maxLength;
    const minLength = el.minLength;
    const min = el.min;
    const max = el.max;
    const options = [];

    if (tag === 'SELECT') {
      Array.from(el.options).forEach((opt) => options.push({ value: opt.value, text: opt.text }));
    } else if (type === 'radio' || type === 'checkbox') {
      const group = document.querySelectorAll(`input[type="${type}"][name="${el.name}"]`);
      Array.from(group).forEach((input) => {
        options.push({
          value: input.value,
          label:
            input.getAttribute('data-label') ||
            input.nextSibling?.textContent?.trim() ||
            input.value,
        });
      });
    }

    return {
      name,
      description,
      explicitFormat,
      type,
      tag,
      multiple,
      required,
      pattern,
      maxLength,
      minLength,
      min,
      max,
      options,
    };
  });
};

// TO-DO: implement form data validation
export const validateFormData = (data) => {
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
};

export const fillFormFields = (data, skipBlanks = true) => {
  const speed = 25;
  const perFieldDelay = 80;
  const validated = validateFormData(data);
  console.log('Validation result:', validated);

  const els = document.querySelectorAll('[data-form-filler-description]');
  const previousValues = {};
  const processedGroups = new Set();

  const isBlank = (v) => v == null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '');

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
  const arr = (x) => (Array.isArray(x) ? x.slice() : [x].filter((v) => v != null));
  const sameSet = (a, b) => {
    const A = new Set(arr(a)),
      B = new Set(arr(b));
    if (A.size !== B.size) return false;
    for (const v of A) if (!B.has(v)) return false;
    return true;
  };

  let chain = Promise.resolve();

  for (const el of els) {
    const name =
      el.getAttribute('data-form-filler-name') ||
      el.name ||
      (typeof getLabelText === 'function' ? getLabelText(el) : undefined);
    if (!name) continue;

    const value = data?.[name];
    previousValues[name] = el.value;

    if (skipBlanks && isBlank(value)) continue;

    if (el.tagName === 'SELECT') {
      const selected = Array.from(el.selectedOptions).map((opt) => opt.value);
      previousValues[name] = el.multiple ? selected : el.value;

      if (
        (!el.multiple && String(el.value) === String(value)) ||
        (el.multiple && sameSet(selected, value))
      )
        continue;

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

      if (sameSet(old, value)) continue;

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

      if (String(old) === String(value)) continue;

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
    if (String(el.value) === String(value)) continue;

    chain = chain.then(async () => {
      flashOutline(el);
      await typeInto(el, value);
      await sleep(perFieldDelay);
    });
  }

  fillFormFields._running = chain.catch(() => {});
  return previousValues;
};
