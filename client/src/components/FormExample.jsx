import React, { useCallback, useRef } from 'react';
import { FormFillerButton, FormFillerWrapper } from '../ai-components/FormFiller';

export const FormExample = React.memo(() => {
  const formRef = useRef(null);

  const handleClear = useCallback(() => {
    if (formRef.current) formRef.current.reset();
  }, []);

  return (
    <div className="bg-white p-6">
      <form ref={formRef}>
        <h1 className="mb-4 text-2xl font-bold">Form Example</h1>
        <div className="mb-6 w-12 border-b border-emerald-500"></div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded border border-gray-200 p-2 text-sm"
              placeholder="John Doe"
              data-form-filler-name="full_name"
              data-form-filler-description="Complete name of the person or company formatted in lowercase and first capital letter"
            />
          </div>
          <div className="md:col-span-6">
            <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="w-full rounded border border-gray-200 p-2 text-sm"
              placeholder="john@example.com"
              data-form-filler-name="email"
              data-form-filler-description="Email address of the person or company"
            />
          </div>
          <div className="md:col-span-6">
            <label className="mb-1 block text-xs font-medium text-gray-700">Type</label>
            <select
              className="w-full rounded border border-gray-200 p-2 text-sm"
              data-form-filler-name="type"
              data-form-filler-description="Type of the person or company"
            >
              <option value="">Select...</option>
              <option value="natural">Natural Person</option>
              <option value="company">Company</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-700">CPF</label>
            <input
              type="text"
              className="w-full rounded border border-gray-200 p-2 text-sm"
              placeholder="000.000.000-00"
              data-form-filler-name="cpf"
              data-form-filler-description="Brazilian individual taxpayer registry (CPF) formatted with dots and dash"
              data-form-filler-format="XXX.XXX.XXX-XX"
              pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
            />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-700">RG</label>
            <input
              type="text"
              className="w-full rounded border border-gray-200 p-2 text-sm"
              placeholder="0000000000"
              data-form-filler-name="rg"
              data-form-filler-description="Brazilian general registry (RG) number"
              pattern="\d{5,12}"
            />
          </div>
          <div className="md:col-span-6">
            <label className="mb-1 block text-xs font-medium text-gray-700">Date of birth</label>
            <input
              type="text"
              className="w-full rounded border border-gray-200 p-2 text-sm"
              placeholder="MM/DD/YYYY"
              data-form-filler-name="date_of_birth"
              data-form-filler-description="Birth date or establishment date in month/day/year format of the person or company"
              data-form-filler-format="MM/DD/YYYY"
            />
          </div>
          <div className="md:col-span-6">
            <label className="mb-1 block text-xs font-medium text-gray-700">Profession</label>
            <input
              type="text"
              className="w-full rounded border border-gray-200 p-2 text-sm"
              placeholder="Software Engineer"
              data-form-filler-name="profession"
              data-form-filler-description="Current job title, profession or purpose of the person or company"
            />
          </div>
          <div className="md:col-span-6">
            <label className="mb-1 block text-xs font-medium text-gray-700">Marital status</label>
            <input
              type="text"
              className="w-full rounded border border-gray-200 p-2 text-sm"
              placeholder="Single"
              data-form-filler-name="marital_status"
              data-form-filler-description="Current marital status of the person, if a natural person"
            />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-700">Postal code</label>
            <input
              type="text"
              className="w-full rounded border border-gray-200 p-2 text-sm"
              placeholder="12345"
              data-form-filler-name="postal_code"
              data-form-filler-description="Postal or ZIP code of the person or company"
              data-form-filler-format="XXXXX-XXX"
            />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-700">State</label>
            <select
              className="w-full rounded border border-gray-200 p-2 text-sm"
              data-form-filler-name="state"
              data-form-filler-description="Brazilian state of the person or company"
            >
              <option value="">Select...</option>
              <option value="SP">São Paulo</option>
              <option value="RJ">Rio de Janeiro</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-700">City</label>
            <input
              type="text"
              className="w-full rounded border border-gray-200 p-2 text-sm"
              placeholder="Enter city name"
              data-form-filler-name="city"
              data-form-filler-description="Brazilian city name of the person or company"
            />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-700">Address</label>
            <input
              type="text"
              className="w-full rounded border border-gray-200 p-2 text-sm"
              placeholder="123 Main St"
              data-form-filler-name="address"
              data-form-filler-description="Street address with house/apartment/room number of the person or company"
            />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-700">Phone 1</label>
            <input
              type="tel"
              className="w-full rounded border border-gray-200 p-2 text-sm"
              placeholder="(123) 456-7890"
              data-form-filler-name="phone_primary"
              data-form-filler-description="Primary contact phone number of the person or company"
              data-form-filler-format="(XXX) XXX-XXXX"
              pattern="\(\d{3}\) \d{3}-\d{4}"
            />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-700">Phone 2</label>
            <input
              type="tel"
              className="w-full rounded border border-gray-200 p-2 text-sm"
              placeholder="(123) 456-7890"
              data-form-filler-name="phone_secondary"
              data-form-filler-description="Alternative phone number (optional) of the person or company"
              pattern="\(\d{3}\) \d{3}-\d{4}"
            />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-700">Gender</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  data-form-filler-name="gender"
                  data-form-filler-description="Gender selection of the person, if a natural person"
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
            <label className="mb-1 block text-xs font-medium text-gray-700">Age</label>
            <input
              type="number"
              min="0"
              max="120"
              className="w-full rounded border border-gray-200 p-2 text-sm"
              data-form-filler-name="age"
              data-form-filler-description="User age or time since establishment of the person or company"
            />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-700">Hobbies</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  value="sports"
                  data-form-filler-name="hobbies"
                  data-form-filler-description="Multiple hobbies selection of the person, if a natural person"
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
            <label className="mb-1 block text-xs font-medium text-gray-700">Satisfaction</label>
            <input
              type="range"
              min="1"
              max="10"
              className="w-full"
              data-form-filler-name="satisfaction"
              data-form-filler-description="Satisfaction level from 1 to 10 of the person or company"
            />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-700">Signature Date</label>
            <input
              type="date"
              className="w-full rounded border border-gray-200 p-2 text-sm"
              data-form-filler-name="signature_date"
              data-form-filler-description="Date document was signed"
            />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-700">Signature Time</label>
            <input
              type="time"
              className="w-full rounded border border-gray-200 p-2 text-sm"
              data-form-filler-name="signature_time"
              data-form-filler-description="Time document was signed, if available"
            />
          </div>
        </div>
        <div className="mt-4 md:col-span-12">
          <textarea
            className="h-20 w-full rounded border border-gray-200 p-2 text-sm"
            placeholder="Additional information..."
            data-form-filler-name="notes"
            data-form-filler-description="Additional information or special requests of the person or company"
          />
        </div>
        <div className="mt-6 flex justify-between gap-2">
          <div className="flex gap-2">
            <FormFillerButton
              document="complaint"
              modal
              instruction="Your most important task is to find the PLAINTIFF and fill the form using ONLY their data. The Plaintiff is the one who initiates the lawsuit."
              important="PLAINTIFF ONLY"
              label="Fill with plaintiff info"
            />
            <FormFillerWrapper
              document="complaint"
              modal
              instruction="Your most important task is to find the DEFENDANT and fill the form using ONLY their data. The Defendant is the one being accused in the lawsuit."
              important="DEFENDANT ONLY"
              label="Fill with defendant info"
            >
              <div className="m-2 flex cursor-pointer items-center justify-center gap-2">
                <span className="material-symbols-outlined mr-1 text-lg">auto_awesome</span>
                Fill with defendant info
              </div>
            </FormFillerWrapper>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="rounded bg-red-500 px-6 py-2 text-sm font-medium text-white hover:bg-red-400"
            >
              CLEAR
            </button>
            <button className="rounded bg-gray-800 px-6 py-2 text-sm font-medium text-white hover:bg-gray-700">
              SAVE
            </button>
          </div>
        </div>
      </form>
    </div>
  );
});
