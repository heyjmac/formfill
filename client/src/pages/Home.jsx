/* eslint-disable react-perf/jsx-no-new-array-as-prop */
import React from 'react';
import { FormExample } from '../components/FormExample';
import { FormFillerFloater } from '../ai-components/FormFiller/FormFillerFloater';

export const Home = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white">
      <FormExample />
      <FormFillerFloater
        document="complaint"
        options={[
          {
            instruction:
              'Your most important task is to find the PLAINTIFF (AUTOR, REQUERENTE) and fill the form using ONLY their data. Dont include any information about the DEFENDANT (REU, REQUERIDO).',
            important: 'PLAINTIFF ONLY',
            label: 'Fill with plaintiff info',
          },
          {
            instruction:
              'Your most important task is to find the DEFENDANT (REU, REQUERIDO) and fill the form using ONLY their data. Dont include any information about the PLAINTIFF (AUTOR, REQUERENTE).',
            important: 'DEFENDANT ONLY',
            label: 'Fill with defendant info',
          },
        ]}
      />
    </div>
  );
};
