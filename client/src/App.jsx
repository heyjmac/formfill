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
              "Only fill the form with the plaintiff information. Never use the defendant's information.",
            label: 'Fill with plaintiff info',
          },
          {
            instruction:
              "Only fill the form with the defendant information. Never use the plaintiff's information.",
            label: 'Fill with defendant info',
          },
        ]}
      />
    </div>
  );
}

export default App;
