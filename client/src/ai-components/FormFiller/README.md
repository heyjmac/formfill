# AI Form Filler

Add AI-powered form filling to your app with minimal setup.

## Quick Start

Import one of the components:

- `FormFillerFloater`: Adds a floating button for instant access.
- `FormFillerButton`: A standalone button you can place anywhere.
- `FormFillerWrapper`: Wrap your own button to trigger the AI flow.

```jsx
import {
  FormFillerFloater,
  FormFillerButton,
  FormFillerWrapper,
} from './src/ai-components/FormFiller';
```

The easiest way to start is with `FormFillerFloater`.

```jsx
<FormFillerFloater />
```

## Props

### `instruction` (string)

Sets the instruction for AI when extracting information. Test and adjust until it meets your needs.

```jsx
<FormFillerFloater instruction="Only fill the form with the plaintiff information. Never use the defendant's information." />
```

---

### `options` (array of { label, instruction })

Allow users to select between multiple instructions. It adds to the instruction, if one was passed.

```jsx
<FormFillerFloater
  options={[
    {
      label: 'Fill with plaintiff info',
      instruction:
        "Only fill the form with the plaintiff information. Never use the defendant's information.",
    },
    {
      label: 'Fill with defendant info',
      instruction:
        "Only fill the form with the defendant information. Never use the plaintiff's information.",
    },
  ]}
/>
```

---

### `textarea` (boolean, default: false)

Set to `true` to show a textarea alongside the drop area so users can paste content instead of uploading documents.

```jsx
<FormFillerFloater textarea />
```

---

### `modal` (boolean, default: false)

Set to `true` if you prefer the UI to appear in a modal instead of a dropdown.

```jsx
<FormFillerFloater modal />
```

---

### `up`, `down`, `left`, `right` (booleans)

Control the direction of the dropdown:

- `up` (default: true)
- `down` (default: false)
- `left` (default: true)
- `right` (default: true)

Choose one in the vertical axis and one in the horizontal axis.

```jsx
<FormFillerFloater down right />
```

---

### `label` (string)

Sets the text for the main button. Overrides the default button label.

```jsx
<FormFillerFloater label="Fill with your document" />
```

---

### `document` (string)

Used to name the document in the UI copy (e.g., "Drop your complaint here"). Ignored if `copy` is passed.

```jsx
<FormFillerFloater document="complaint" />
```

---

### `copy` (object)

Override default UI text. Must follow the same structure as `defaultCopy`. Missing keys will fall back to defaults.

```jsx
<FormFillerFloater copy={
    title: {
        main: 'AI Form Filler',
    },
    fields_found: {
        singular: '1 form field found',
        plural: '{{count}} form fields found',

    }} />
```

---

## Customizing the Text

To customize the text, pass a `copy` prop to the component.  
It should follow the same structure as the `defaultCopy` object.

See the full structure at `./defaultCopy.js`.

```js
// Example structure:
<FormFillerFloater defaultCopy = {
    title: { main: 'Fill the form with AI' },
    files_selected: {
        singular: 'You added 1 file',
        plural: 'You added {{count}} files',
    },
    ...
    }
/>
```

Any nested value can be replaced. You don’t need to pass the full object — only the keys you want to override.

---

You're ready to go! Drop in the component and give your users a seamless AI-powered form experience.
