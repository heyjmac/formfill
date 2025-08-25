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
              "Your most important task is to find the PLAINTIFF and fill the form using ONLY their data. Follow these steps precisely: 1. **IDENTIFY THE PLAINTIFF:** Scan the document to find the party labeled 'AUTOR(A)' or 'REQUERENTE'. This is the only entity you should focus on. 2. **IDENTIFY THE DEFENDANT:** Locate the party labeled 'RÉ(U)' or 'REQUERIDO'. All information associated with this entity is FORBIDDEN and MUST BE IGNORED. 3. **EXTRACT PLAINTIFF DATA:** Based on your identification in Step 1, extract the required information for the plaintiff. 4. **VALIDATE:** Before finalizing, ensure that none of the information you extracted belongs to the defendant identified in Step 2. If you are in doubt about any field, leave it empty.",
            important: 'PLAINTIFF ONLY',
            label: 'Fill with plaintiff info',
          },
          {
            instruction:
              "Your most important task is to find the DEFENDANT and fill the form using ONLY their data. Follow these steps precisely: 1. **IDENTIFY THE DEFENDANT:** Scan the document to find the party labeled 'RÉ(U)' or 'REQUERIDO'. This is the only entity you should focus on. 2. **IDENTIFY THE PLAINTIFF:** Locate the party labeled 'AUTOR(A)' or 'REQUERENTE'. All information associated with this entity is FORBIDDEN and MUST BE IGNORED. 3. **EXTRACT DEFENDANT DATA:** Based on your identification in Step 1, extract the required information for the defendant. 4. **VALIDATE:** Before finalizing, ensure that none of the information you extracted belongs to the plaintiff identified in Step 2. If you are in doubt about any field, leave it empty.",
            important: 'DEFENDANT ONLY',
            label: 'Fill with defendant info',
          },
        ]}
      />
    </div>
  );
}

export default App;
