import { Outlet } from 'react-router-dom';

export const SettingsPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <Outlet />
    </div>
  );
};
