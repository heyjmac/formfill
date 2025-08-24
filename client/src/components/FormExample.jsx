import { useRef } from 'react';
import { FormFillButton } from '../ai-components/FormFillButton';

export function FormExample() {
  const formRef = useRef(null);

  const handleClear = () => {
    if (formRef.current) formRef.current.reset();
  };

  return (
    <div className="bg-white p-6">
      <form ref={formRef}>
        <h1 className="text-2xl font-bold mb-4">Form Example</h1>
        <div className="border-b border-emerald-500 w-12 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <label className="block text-xs font-medium mb-1 text-gray-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded text-sm"
              placeholder="John Doe"
              data-form-filler-name="full_name"
              data-form-filler-description="Complete name as appears on official documents"
            />
          </div>
          <div className="md:col-span-6">
            <label className="block text-xs font-medium mb-1 text-gray-700">Email</label>
            <input
              type="email"
              className="w-full p-2 border border-gray-200 rounded text-sm"
              placeholder="john@example.com"
              data-form-filler-name="email"
              data-form-filler-description="Active email address for communications"
            />
          </div>
          <div className="md:col-span-6">
            <label className="block text-xs font-medium mb-1 text-gray-700">Type</label>
            <select
              className="w-full p-2 border border-gray-200 rounded text-sm"
              data-form-filler-name="type"
              data-form-filler-description="Category selection from dropdown menu"
            >
              <option value="">Select...</option>
              <option value="natural">Natural Person</option>
              <option value="company">Company</option>
            </select>
          </div>
          <div className="md:col-span-6">
            <label className="block text-xs font-medium mb-1 text-gray-700">Date of birth</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded text-sm"
              placeholder="MM/DD/YYYY"
              data-form-filler-name="date_of_birth"
              data-form-filler-description="Birth date in month/day/year format"
              data-form-filler-format="MM/DD/YYYY"
            />
          </div>
          <div className="md:col-span-6">
            <label className="block text-xs font-medium mb-1 text-gray-700">Profession</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded text-sm"
              placeholder="Software Engineer"
              data-form-filler-name="profession"
              data-form-filler-description="Current job title or profession"
            />
          </div>
          <div className="md:col-span-6">
            <label className="block text-xs font-medium mb-1 text-gray-700">Marital status</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded text-sm"
              placeholder="Single"
              data-form-filler-name="marital_status"
              data-form-filler-description="Current marital status"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1 text-gray-700">Postal code</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded text-sm"
              placeholder="12345"
              data-form-filler-name="postal_code"
              data-form-filler-description="Postal or ZIP code"
              data-form-filler-format="XXXXX-XXX"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1 text-gray-700">State</label>
            <select
              className="w-full p-2 border border-gray-200 rounded text-sm"
              data-form-filler-name="state"
              data-form-filler-description="Brazilian state"
            >
              <option value="">Select...</option>
              <option value="SP">São Paulo</option>
              <option value="RJ">Rio de Janeiro</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1 text-gray-700">City</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded text-sm"
              placeholder="Enter city name"
              data-form-filler-name="city"
              data-form-filler-description="Brazilian city name"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1 text-gray-700">Address</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded text-sm"
              placeholder="123 Main St"
              data-form-filler-name="address"
              data-form-filler-description="Street address with house/apartment number"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1 text-gray-700">Phone 1</label>
            <input
              type="tel"
              className="w-full p-2 border border-gray-200 rounded text-sm"
              placeholder="(123) 456-7890"
              data-form-filler-name="phone_primary"
              data-form-filler-description="Primary contact phone number"
              data-form-filler-format="(XXX) XXX-XXXX"
              pattern="\(\d{3}\) \d{3}-\d{4}"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1 text-gray-700">Phone 2</label>
            <input
              type="tel"
              className="w-full p-2 border border-gray-200 rounded text-sm"
              placeholder="(123) 456-7890"
              data-form-filler-name="phone_secondary"
              data-form-filler-description="Alternative phone number (optional)"
              pattern="\(\d{3}\) \d{3}-\d{4}"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1 text-gray-700">Gender</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  data-form-filler-name="gender"
                  data-form-filler-description="Gender selection"
                />
                Male
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="gender" value="female" data-form-filler-name="gender" />
                Female
              </label>
            </div>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1 text-gray-700">Age</label>
            <input
              type="number"
              min="0"
              max="120"
              className="w-full p-2 border border-gray-200 rounded text-sm"
              data-form-filler-name="age"
              data-form-filler-description="User age"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1 text-gray-700">Hobbies</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  value="sports"
                  data-form-filler-name="hobbies"
                  data-form-filler-description="Multiple hobbies selection"
                />
                Sports
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" value="music" data-form-filler-name="hobbies" />
                Music
              </label>
            </div>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1 text-gray-700">Satisfaction</label>
            <input
              type="range"
              min="1"
              max="10"
              className="w-full"
              data-form-filler-name="satisfaction"
              data-form-filler-description="Satisfaction level from 1 to 10"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1 text-gray-700">Meeting Date</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-200 rounded text-sm"
              data-form-filler-name="meeting_date"
              data-form-filler-description="Meeting date"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1 text-gray-700">Meeting Time</label>
            <input
              type="time"
              className="w-full p-2 border border-gray-200 rounded text-sm"
              data-form-filler-name="meeting_time"
              data-form-filler-description="Meeting time"
            />
          </div>
        </div>
        <div className="md:col-span-12 mt-4">
          <textarea
            className="w-full p-2 border border-gray-200 rounded text-sm h-20"
            placeholder="Additional information..."
            data-form-filler-name="notes"
            data-form-filler-description="Additional information or special requests"
          />
        </div>
        <div className="mt-6 flex justify-between gap-2">
          <FormFillButton
            modal
            instruction="Only fill the form with the plaintiff information. Never use the defendant's information."
            label="Fill with plaintiff info"
          />
          <FormFillButton
            modal
            instruction="Only fill the form with the defendant information. Never use the plaintiff's information."
            label="Fill with defendant info"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="bg-red-500 text-white py-2 px-6 rounded hover:bg-red-400 text-sm font-medium"
            >
              CLEAR
            </button>
            <button className="bg-gray-800 text-white py-2 px-6 rounded hover:bg-gray-700 text-sm font-medium">
              SAVE
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
