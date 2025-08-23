import { FormExample } from './components/FormExample';
import { FormFillButton } from './ai-components/FormFillButton';

function App() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-white">
      <FormExample />
      <FormFillButton floating />
    </div>
  );
}

export default App;
