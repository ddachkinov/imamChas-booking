import React from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from '@/components/public/SearchBar';
import { CategoryCard } from '@/components/public/CategoryCard';
import { StudioCard } from '@/components/public/StudioCard';
import { ArrowRightIcon, SparklesIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

// Mock data - will be replaced with API calls
const POPULAR_CATEGORIES = [
  { name: 'Hair Salon', slug: 'hair-salon', icon: '💇', studioCount: 45 },
  { name: 'Barbershop', slug: 'barbershop', icon: '💈', studioCount: 32 },
  { name: 'Nail Studio', slug: 'nail-studio', icon: '💅', studioCount: 28 },
  { name: 'Spa & Massage', slug: 'spa-massage', icon: '💆', studioCount: 19 },
  { name: 'Beauty Salon', slug: 'beauty-salon', icon: '✨', studioCount: 41 },
  { name: 'Fitness', slug: 'fitness', icon: '💪', studioCount: 15 },
];

const FEATURED_STUDIOS = [
  {
    id: '1',
    slug: 'beauty-studio-elite',
    name: 'Beauty Studio Elite',
    category: 'Beauty Salon',
    coverImage: undefined,
    address: { city: 'Sofia', area: 'Center' },
    rating: 4.8,
    reviewCount: 124,
    verified: true,
    isOpen: true,
    nextAvailable: 'Today 2:30 PM',
  },
  {
    id: '2',
    slug: 'urban-cuts',
    name: 'Urban Cuts Barbershop',
    category: 'Barbershop',
    coverImage: undefined,
    address: { city: 'Sofia', area: 'Lozenets' },
    rating: 4.9,
    reviewCount: 89,
    verified: true,
    isOpen: true,
    nextAvailable: 'Today 4:00 PM',
  },
  {
    id: '3',
    slug: 'nail-art-studio',
    name: 'Nail Art Studio',
    category: 'Nail Studio',
    coverImage: undefined,
    address: { city: 'Sofia', area: 'Students Town' },
    rating: 4.7,
    reviewCount: 67,
    verified: false,
    isOpen: false,
  },
];

export const PublicHomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary-600">
                BookNow
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/studios" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                Browse Studios
              </Link>
              <Link to="/for-business" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                For Business
              </Link>
              <Link to="/admin/login" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                Sign In
              </Link>
              <Link
                to="/admin/login"
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
              >
                List Your Business
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Book Your Next Appointment<br />
              <span className="text-primary-100">In Just a Minute</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-50 mb-8 max-w-3xl mx-auto">
              Discover top-rated beauty salons, barbershops, and wellness studios near you
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <SearchBar variant="hero" />
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-full mb-3">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <div className="text-lg font-semibold mb-1">1000+ Studios</div>
              <div className="text-primary-100 text-sm">Verified professionals</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-full mb-3">
                <ClockIcon className="w-6 h-6" />
              </div>
              <div className="text-lg font-semibold mb-1">Instant Booking</div>
              <div className="text-primary-100 text-sm">Real-time availability</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-full mb-3">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <div className="text-lg font-semibold mb-1">Secure & Safe</div>
              <div className="text-primary-100 text-sm">Verified reviews only</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Popular Categories
            </h2>
            <Link
              to="/categories"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
            >
              View All
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {POPULAR_CATEGORIES.map((category) => (
              <CategoryCard key={category.slug} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Studios */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Featured Studios
              </h2>
              <p className="text-gray-600">Top-rated and verified professionals</p>
            </div>
            <Link
              to="/studios"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
            >
              Browse All
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_STUDIOS.map((studio) => (
              <StudioCard key={studio.id} {...studio} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Book your appointment in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full text-2xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Search & Discover
              </h3>
              <p className="text-gray-600">
                Find studios by service, location, or browse categories
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Choose Time & Staff
              </h3>
              <p className="text-gray-600">
                Select your preferred date, time, and service provider
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Book Instantly
              </h3>
              <p className="text-gray-600">
                Get instant confirmation and email reminders
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA for Businesses */}
      <section className="py-16 bg-gradient-to-br from-accent-500 to-accent-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Own a Beauty or Wellness Business?
          </h2>
          <p className="text-xl text-accent-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses using BookNow to manage appointments and grow their customer base
          </p>
          <Link
            to="/for-business"
            className="inline-block px-8 py-4 bg-white text-accent-600 font-semibold rounded-xl hover:bg-accent-50 transition-colors shadow-lg"
          >
            List Your Business Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">BookNow</div>
              <p className="text-sm">
                Your trusted platform for instant beauty and wellness appointments.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">For Customers</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/studios" className="hover:text-white transition-colors">Browse Studios</Link></li>
                <li><Link to="/search" className="hover:text-white transition-colors">Search</Link></li>
                <li><Link to="/my-bookings" className="hover:text-white transition-colors">My Bookings</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">For Business</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/for-business" className="hover:text-white transition-colors">List Your Business</Link></li>
                <li><Link to="/admin/login" className="hover:text-white transition-colors">Business Login</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 BookNow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
