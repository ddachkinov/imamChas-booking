import { Link } from 'react-router-dom';
import { CalendarIcon, ClockIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">Booking Platform</h1>
            </div>
            <Link
              to="/admin/login"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Simplify Your Booking
            <span className="block text-primary-600">Management</span>
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            A powerful, multi-tenant booking platform designed for businesses of all sizes.
            Manage appointments, staff, and clients with ease.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              to="/admin/login"
              className="px-8 py-3 text-base font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="px-8 py-3 text-base font-medium text-primary-600 bg-white border border-primary-600 rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-extrabold text-gray-900">
            Everything You Need
          </h3>
          <p className="mt-4 text-lg text-gray-500">
            Comprehensive features to streamline your booking operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
              <CalendarIcon className="w-6 h-6 text-primary-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Smart Scheduling
            </h4>
            <p className="text-gray-600">
              Intelligent calendar management with conflict detection and automated reminders.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
              <UserGroupIcon className="w-6 h-6 text-primary-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Client Management
            </h4>
            <p className="text-gray-600">
              Centralized client database with appointment history and preferences.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
              <ClockIcon className="w-6 h-6 text-primary-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              24/7 Booking
            </h4>
            <p className="text-gray-600">
              Allow clients to book appointments anytime with your custom booking page.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
              <ChartBarIcon className="w-6 h-6 text-primary-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Analytics & Insights
            </h4>
            <p className="text-gray-600">
              Detailed reports and analytics to help you grow your business.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-extrabold text-white mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-xl text-primary-100 mb-8">
            Join businesses already using our platform to manage their bookings
          </p>
          <Link
            to="/admin/login"
            className="inline-block px-8 py-3 text-base font-medium text-primary-600 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
          >
            Sign In to Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            2025 Booking Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
