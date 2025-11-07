import React from 'react';
import { StarIcon, TrophyIcon } from '@heroicons/react/24/solid';
import type { TopService, TopStaff } from '@/types/analytics.types';

interface TopServicesProps {
  services: TopService[];
}

export const TopServices: React.FC<TopServicesProps> = ({ services }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No service data available for this period
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {services.map((service, index) => (
        <div
          key={service.service_id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                index === 0
                  ? 'bg-yellow-100 text-yellow-700'
                  : index === 1
                  ? 'bg-gray-200 text-gray-700'
                  : index === 2
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {index === 0 ? (
                <TrophyIcon className="w-5 h-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">{service.service_name}</h4>
              <p className="text-xs text-gray-500">
                {service.appointment_count} appointment{service.appointment_count !== 1 ? 's' : ''} •{' '}
                {service.completion_rate.toFixed(0)}% completion
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">{formatCurrency(service.revenue)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

interface TopStaffProps {
  staff: TopStaff[];
}

export const TopStaff: React.FC<TopStaffProps> = ({ staff }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (staff.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No staff data available for this period
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {staff.map((member, index) => (
        <div
          key={member.staff_id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                index === 0
                  ? 'bg-yellow-100 text-yellow-700'
                  : index === 1
                  ? 'bg-gray-200 text-gray-700'
                  : index === 2
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {index === 0 ? (
                <TrophyIcon className="w-5 h-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">{member.staff_name}</h4>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>
                  {member.appointment_count} appointment{member.appointment_count !== 1 ? 's' : ''}
                </span>
                <span>•</span>
                <span>{member.completion_rate.toFixed(0)}% completion</span>
                {member.average_rating && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-0.5">
                      <StarIcon className="w-3 h-3 text-yellow-400" />
                      <span>{member.average_rating.toFixed(1)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">{formatCurrency(member.revenue)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
