import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';

export const Home: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          {t('home.title')}
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          {t('home.subtitle')}
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="primary" size="lg">
            {t('home.getStarted')}
          </Button>
          <Button variant="secondary" size="lg">
            {t('home.learnMore')}
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">
              {t('home.features.easyScheduling.title')}
            </h3>
            <p className="text-gray-600">
              {t('home.features.easyScheduling.description')}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">
              {t('home.features.clientManagement.title')}
            </h3>
            <p className="text-gray-600">
              {t('home.features.clientManagement.description')}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">
              {t('home.features.analytics.title')}
            </h3>
            <p className="text-gray-600">
              {t('home.features.analytics.description')}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
