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

export function getFormFields() {
  const els = document.querySelectorAll('[data-form-filler-description]');
  const properties = {};
  const required = [];

  els.forEach((el) => {
    const name = el.getAttribute('data-form-filler-name') || el?.name || getLabelText(el);
    const description = el.getAttribute('data-form-filler-description');
    const explicitFormat = el.getAttribute('data-form-filler-format'); // manual override
    const optionValues = [];

    const fullDescription = [description];
    if (explicitFormat) fullDescription.push(`Expected format: ${explicitFormat}`);
    if (el?.value) fullDescription.push(`Current value: ${el.value}`);

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

    if (el?.placeholder) fullDescription.push(`Placeholder: ${el.placeholder}`);

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

export async function fillFormFields(data, { speed = 25, perFieldDelay = 80 } = {}) {
  const els = document.querySelectorAll('[data-form-filler-description]');
  const previousValues = {};

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

  for (const el of els) {
    const name =
      el.getAttribute('data-form-filler-name') ||
      el.name ||
      (typeof getLabelText === 'function' ? getLabelText(el) : undefined);
    const value = data?.[name];
    if (value == null) continue;

    flashOutline(el);

    if (el.tagName === 'SELECT') {
      const selected = Array.from(el.selectedOptions).map((opt) => opt.value);
      previousValues[name] = el.multiple ? selected : el.value;

      const options = Array.from(el.options).map((opt) => opt.value);
      if (el.multiple && Array.isArray(value)) {
        for (const opt of el.options) opt.selected = false;
        for (const v of value)
          if (options.includes(v)) el.querySelector(`option[value="${v}"]`).selected = true;
      } else if (options.includes(value)) {
        el.value = value;
      }
      el.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(perFieldDelay);
      continue;
    }

    if (el.type === 'checkbox') {
      const checkboxes = document.querySelectorAll(`input[type="checkbox"][name="${el.name}"]`);
      const old = [];
      checkboxes.forEach((c) => c.checked && old.push(c.value));
      previousValues[name] = old;

      checkboxes.forEach((c) => {
        if (Array.isArray(value)) c.checked = value.includes(c.value);
        else c.checked = value === c.value;
        c.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await sleep(perFieldDelay);
      continue;
    }

    if (el.type === 'radio') {
      const radios = document.querySelectorAll(`input[type="radio"][name="${el.name}"]`);
      const old = Array.from(radios).find((r) => r.checked)?.value || null;
      previousValues[name] = old;

      radios.forEach((r) => {
        r.checked = r.value === value;
        if (r.checked) r.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await sleep(perFieldDelay);
      continue;
    }

    // Text-like inputs & textarea (typing effect)
    previousValues[name] = el.value;
    await typeInto(el, value);
    await sleep(perFieldDelay);
  }

  return previousValues;
}
