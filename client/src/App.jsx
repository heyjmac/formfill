import { FormExample } from './components/FormExample';
import { FormFillerFloater } from './ai-components/FormFiller/FormFillerFloater';

function App() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-white">
      <FormExample />
      <FormFillerFloater
        document="complaint"
        options={[
          {
            instruction:
              'Your most important task is to find the PLAINTIFF and fill the form using ONLY their data.',
            important: 'PLAINTIFF ONLY',
            label: 'Fill with plaintiff info',
          },
          {
            instruction:
              'Your most important task is to find the DEFENDANT and fill the form using ONLY their data.',
            important: 'DEFENDANT ONLY',
            label: 'Fill with defendant info',
          },
        ]}
      />
    </div>
  );
}

export default App;
