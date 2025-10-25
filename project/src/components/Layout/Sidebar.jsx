import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ExportHtmlButton from '../Common/ExportHtmlButton';

const navigation = [
  { name: 'Tableau de bord', to: '/dashboard', icon: '📊' },
  { name: 'Comptes', to: '/accounts', icon: '💰' },
  { name: 'Revenus', to: '/income', icon: '💵' },
  { name: 'Dépenses', to: '/expenses', icon: '💳' },
  { name: 'Mon profil', to: '/profile', icon: '👤' },
  { name: 'Conseils', to: '/recommendations', icon: '💡' },
];

export default function Sidebar() {
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigation = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 flex items-center rounded-lg bg-white px-4 py-2 shadow-md border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Ouvrir le menu de navigation"
        aria-expanded={isOpen}
      >
        ☰
      </button>
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-primary-700">FinAdvisor</h1>
          <p className="text-sm text-gray-600 mt-1">Gestion financière</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" aria-label="Navigation principale">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavigation}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <span className="text-xl" aria-hidden="true">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <ExportHtmlButton />
          <button
            onClick={signOut}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400"
            type="button"
          >
            <span className="text-xl" aria-hidden="true">🚪</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
