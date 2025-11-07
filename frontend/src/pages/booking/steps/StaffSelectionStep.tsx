import React, { useState, useEffect } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { bookingApi } from '@/services/booking.api';
import { StaffMember } from '@/types/booking.types';

export const StaffSelectionStep: React.FC = () => {
  const { state, actions } = useBooking();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStaff = async () => {
      if (!state.serviceId) return;

      try {
        setLoading(true);
        const data = await bookingApi.getAvailableStaff(state.businessId, state.serviceId);
        setStaff(data);
      } catch (error) {
        console.error('Failed to load staff:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, [state.businessId, state.serviceId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Staff Member</h2>

      <div className="space-y-4">
        {/* First Available Option */}
        <button
          onClick={() => actions.selectStaff(null)}
          className={`w-full bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-left border-2 ${
            state.staffId === null ? 'border-blue-600' : 'border-transparent'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">First Available</h3>
              <p className="text-sm text-gray-600">Book with the next available staff member</p>
            </div>
          </div>
        </button>

        {/* Individual Staff Members */}
        {staff.map((member) => (
          <button
            key={member.id}
            onClick={() => actions.selectStaff(member)}
            className={`w-full bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-left border-2 ${
              state.staffId === member.id ? 'border-blue-600' : 'border-transparent'
            }`}
          >
            <div className="flex items-center gap-4">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={`${member.first_name} ${member.last_name}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-gray-500">
                    {member.first_name[0]}
                    {member.last_name[0]}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {member.first_name} {member.last_name}
                  </h3>
                  {member.is_soonest_available && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      Soonest Available
                    </span>
                  )}
                </div>
                {member.title && <p className="text-sm text-gray-600">{member.title}</p>}
                {member.bio && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{member.bio}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Continue Button */}
      <div className="mt-8">
        <button
          onClick={actions.nextStep}
          disabled={state.staffId === undefined}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
