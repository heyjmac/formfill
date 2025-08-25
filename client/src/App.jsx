/* eslint-disable react-perf/jsx-no-new-array-as-prop */
import React from 'react';
import { FormExample } from './components/FormExample';
import { FormFillerFloater } from './ai-components/FormFiller/FormFillerFloater';

const App = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white">
      <FormExample />
      <FormFillerFloater
        document="complaint"
        options={[
          {
            instruction:
              "Your most important task is to find the PLAINTIFF (AUTOR, REQUERENTE) and fill the form using ONLY their data. Don't include any information about the DEFENDANT (RÉU, REQUERIDO).",
            important: 'PLAINTIFF ONLY',
            label: 'Fill with plaintiff info',
          },
          {
            instruction:
              "Your most important task is to find the DEFENDANT (RÉU, REQUERIDO) and fill the form using ONLY their data. Don't include any information about the PLAINTIFF (AUTOR, REQUERENTE).",
            important: 'DEFENDANT ONLY',
            label: 'Fill with defendant info',
          },
        ]}
      />
    </div>
  );
};

export default App;
