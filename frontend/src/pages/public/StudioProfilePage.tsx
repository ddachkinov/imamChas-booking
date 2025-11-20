import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  StarIcon,
  ShareIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { ServiceCard } from '@/components/public/ServiceCard';
import { StaffCard } from '@/components/public/StaffCard';

// Mock data - will be replaced with API calls
const MOCK_STUDIO = {
  id: '1',
  slug: 'beauty-studio-elite',
  name: 'Beauty Studio Elite',
  description: 'Premium beauty salon in the heart of Sofia. We offer a wide range of services including hair styling, coloring, nail care, and beauty treatments. Our experienced team is dedicated to making you look and feel your best.',
  category: 'Beauty Salon',
  coverImage: undefined,
  gallery: [],
  address: {
    street: '123 Vitosha Blvd',
    city: 'Sofia',
    area: 'Center',
    postalCode: '1000',
  },
  phone: '+359 2 123 4567',
  email: 'info@beautystudio.bg',
  website: 'https://beautystudio.bg',
  rating: 4.8,
  reviewCount: 124,
  verified: true,
  amenities: ['Wi-Fi', 'Parking', 'Air Conditioning', 'Card Payment', 'Wheelchair Accessible'],
  openingHours: {
    monday: '9:00 - 19:00',
    tuesday: '9:00 - 19:00',
    wednesday: '9:00 - 19:00',
    thursday: '9:00 - 19:00',
    friday: '9:00 - 20:00',
    saturday: '10:00 - 18:00',
    sunday: 'Closed',
  },
};

const MOCK_SERVICES = [
  {
    id: '1',
    name: 'Women\'s Haircut',
    description: 'Professional haircut with styling consultation',
    price: 45,
    duration: 60,
    category: 'Hair Services',
  },
  {
    id: '2',
    name: 'Hair Coloring',
    description: 'Full hair coloring with premium products',
    price: 80,
    duration: 120,
    category: 'Hair Services',
  },
  {
    id: '3',
    name: 'Manicure',
    description: 'Classic manicure with nail polish',
    price: 25,
    duration: 45,
    category: 'Nail Services',
  },
  {
    id: '4',
    name: 'Gel Manicure',
    description: 'Long-lasting gel nail polish',
    price: 35,
    duration: 60,
    category: 'Nail Services',
  },
];

const MOCK_STAFF = [
  {
    id: '1',
    name: 'Maria Ivanova',
    role: 'Senior Hair Stylist',
    bio: '10+ years of experience in hair styling and coloring',
    photoUrl: undefined,
    rating: 4.9,
    reviewCount: 87,
    specialties: ['Hair Coloring', 'Balayage', 'Women\'s Cuts'],
  },
  {
    id: '2',
    name: 'Elena Petrova',
    role: 'Nail Technician',
    bio: 'Specialized in nail art and gel manicures',
    photoUrl: undefined,
    rating: 4.8,
    reviewCount: 56,
    specialties: ['Gel Manicure', 'Nail Art', 'Extensions'],
  },
];

const MOCK_REVIEWS = [
  {
    id: '1',
    customerName: 'Anna K.',
    rating: 5,
    comment: 'Amazing service! Maria did a fantastic job with my hair color. Highly recommended!',
    date: '2025-11-15',
    verified: true,
  },
  {
    id: '2',
    customerName: 'Petya S.',
    rating: 5,
    comment: 'Very professional and friendly staff. The salon is clean and modern.',
    date: '2025-11-10',
    verified: true,
  },
  {
    id: '3',
    customerName: 'Diana M.',
    rating: 4,
    comment: 'Great experience overall. Only small issue was parking, but the service made up for it.',
    date: '2025-11-05',
    verified: true,
  },
];

export const StudioProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'services' | 'staff' | 'reviews' | 'about'>('services');

  const handleBookService = (serviceId: string) => {
    navigate(`/studios/${slug}/booking?service=${serviceId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              BookNow
            </Link>
            <Link to="/" className="text-gray-700 hover:text-primary-600 font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Cover Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Studio Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {MOCK_STUDIO.name}
                    </h1>
                    {MOCK_STUDIO.verified && (
                      <span className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-sm font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-3">
                    {MOCK_STUDIO.category}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1">
                      <StarIconSolid className="w-5 h-5 text-warning-500" />
                      <span className="text-lg font-semibold text-gray-900">
                        {MOCK_STUDIO.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-gray-600">
                      ({MOCK_STUDIO.reviewCount} reviews)
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPinIcon className="w-5 h-5 text-gray-400" />
                      <span>
                        {MOCK_STUDIO.address.street}, {MOCK_STUDIO.address.area}, {MOCK_STUDIO.address.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                      <a href={`tel:${MOCK_STUDIO.phone}`} className="hover:text-primary-600">
                        {MOCK_STUDIO.phone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <ShareIcon className="w-6 h-6" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-error-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <HeartIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed">
                {MOCK_STUDIO.description}
              </p>
            </div>

            {/* Quick Booking Card */}
            <div className="lg:w-96">
              <div className="bg-white border-2 border-primary-200 rounded-xl p-6 shadow-medium">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Booking
                </h3>
                <Link
                  to={`/studios/${slug}/booking`}
                  className="block w-full py-3 bg-primary-500 hover:bg-primary-600 text-white text-center font-semibold rounded-lg transition-colors mb-4"
                >
                  Book Now
                </Link>
                <div className="text-sm text-gray-600 text-center">
                  Choose service and time in the next step
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {(['services', 'staff', 'reviews', 'about'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'services' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Services</h2>
            <div className="space-y-4">
              {MOCK_SERVICES.map((service) => (
                <ServiceCard
                  key={service.id}
                  {...service}
                  onBook={() => handleBookService(service.id)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MOCK_STAFF.map((staff) => (
                <StaffCard key={staff.id} {...staff} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
              <div className="text-gray-600">
                {MOCK_STUDIO.reviewCount} verified reviews
              </div>
            </div>

            <div className="space-y-6">
              {MOCK_REVIEWS.map((review) => (
                <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {review.customerName}
                        </span>
                        {review.verified && (
                          <span className="text-xs bg-success-100 text-success-700 px-2 py-0.5 rounded-full">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIconSolid
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-warning-500' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(review.date).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Opening Hours */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClockIcon className="w-6 h-6" />
                Opening Hours
              </h3>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="space-y-3">
                  {Object.entries(MOCK_STUDIO.openingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between">
                      <span className="font-medium text-gray-900 capitalize">{day}</span>
                      <span className="text-gray-600">{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Amenities
              </h3>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-wrap gap-2">
                  {MOCK_STUDIO.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
