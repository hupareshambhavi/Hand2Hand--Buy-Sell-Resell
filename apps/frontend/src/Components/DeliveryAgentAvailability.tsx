import React, { useState } from 'react';

interface AvailabilityData {
  [key: string]: boolean[]; // e.g., { "Monday": [true, false, false] }
}

interface DeliveryAgentAvailabilityProps {
  onNext: (availability: AvailabilityData) => void;
  onBack: () => void;
}

const DeliveryAgentAvailability: React.FC<DeliveryAgentAvailabilityProps> = ({ onNext, onBack }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = ['08:00-12:00', '12:00-16:00', '16:00-20:00'];

  // Initialize availability with all slots set to false
  const initialAvailability: AvailabilityData = days.reduce((acc, day) => {
    acc[day] = [false, false, false];
    return acc;
  }, {} as AvailabilityData);

  const [availability, setAvailability] = useState<AvailabilityData>(initialAvailability);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if at least one slot is selected
  const hasSelectedSlots = Object.values(availability).some(slots => 
    slots.some(slot => slot)
  );

  const handleSlotChange = (day: string, slotIndex: number) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].map((value, index) => 
        index === slotIndex ? !value : value
      )
    }));
    
    // Clear validation error when user selects a slot
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSelectAll = () => {
    // Check if all slots are currently selected
    const allSelected = Object.values(availability).every(slots => 
      slots.every(slot => slot)
    );
    
    // If all are selected, unselect all. Otherwise, select all
    const newValue = !allSelected;
    
    setAvailability(prev => {
      const newAvailability: AvailabilityData = {};
      Object.keys(prev).forEach(day => {
        newAvailability[day] = [newValue, newValue, newValue];
      });
      return newAvailability;
    });
    
    // Clear validation error when user selects slots
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasSelectedSlots) {
      setValidationError('Please select at least one time slot');
      return;
    }
    
    console.log(availability);
    onNext(availability);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto mt-8 p-6">
        <h1 className="text-2xl font-bold underline mb-6">Select Your Availability</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Available on</h2>
            <p className="text-sm text-gray-600 mb-4">Please select your preferred time slots for each day</p>
            
            {/* Validation Error */}
            {validationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationError}
                </p>
              </div>
            )}
            
            {/* Select All Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-4 py-2 bg-[#3A1078] text-white rounded hover:bg-[#4C1D95] cursor-pointer transition-colors text-sm font-medium"
              >
                {Object.values(availability).every(slots => slots.every(slot => slot)) 
                  ? 'Unselect All' 
                  : 'Select All'}
              </button>
            </div>
            
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 mb-2">
              <div className="font-semibold">Day</div>
              {timeSlots.map(slot => (
                <div key={slot} className="font-semibold text-center">{slot}</div>
              ))}
            </div>

            {/* Table Body */}
            {days.map(day => (
              <div key={day} className="grid grid-cols-4 gap-4 mb-2 items-center">
                <div className="font-medium">{day}</div>
                {timeSlots.map((_, index) => (
                  <div key={index} className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={availability[day][index]}
                      onChange={() => handleSlotChange(day, index)}
                      className="w-5 h-5 rounded border-gray-300 text-[#3A1078] focus:ring-[#3A1078]"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-[#3A1078] text-[#3A1078] rounded hover:bg-[#3A1078] hover:text-white transition-colors cursor-pointer"
            >
              Back
            </button>
            <div className="relative group">
              <button
                type="submit"
                disabled={!hasSelectedSlots}
                className={`px-6 py-2 rounded transition-colors ${
                  hasSelectedSlots
                    ? 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Register
              </button>
              {!hasSelectedSlots && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Please select at least one time slot
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryAgentAvailability;