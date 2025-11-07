import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingApi } from '@/services/booking.api';

export const BookingBySlugPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBusiness = async () => {
      if (!slug) {
        setError('Invalid booking link');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const business = await bookingApi.getBusinessBySlug(slug);
        // Redirect to booking page with business ID
        navigate(`/book/${business.id}`, { replace: true });
      } catch (err) {
        console.error('Failed to load business:', err);
        setError('Business not found');
        setLoading(false);
      }
    };

    loadBusiness();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return null;
};
