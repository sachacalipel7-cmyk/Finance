import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const NotificationContext = createContext(null);

const TYPES = {
  success: {
    bg: 'bg-success-100',
    border: 'border-success-200',
    text: 'text-success-800',
    icon: '✅',
  },
  error: {
    bg: 'bg-red-100',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: '⚠️',
  },
  info: {
    bg: 'bg-primary-100',
    border: 'border-primary-200',
    text: 'text-primary-800',
    icon: 'ℹ️',
  },
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((items) => items.filter((notification) => notification.id !== id));
  }, []);

  const createId = useCallback(() => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  const notify = useCallback((notification) => {
    const id = createId();

    setNotifications((items) => [
      ...items,
      {
        id,
        type: notification.type ?? 'info',
        title: notification.title,
        message: notification.message,
      },
    ]);

    const timeout = notification.duration ?? 4500;
    window.setTimeout(() => removeNotification(id), timeout);
  }, [createId, removeNotification]);

  const value = useMemo(() => ({ notify, removeNotification }), [notify, removeNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-3 w-80 max-w-full">
        {notifications.map((notification) => {
          const tone = TYPES[notification.type] ?? TYPES.info;

          return (
            <div
              key={notification.id}
              className={`${tone.bg} ${tone.border} ${tone.text} border rounded-lg shadow-lg p-4 flex items-start space-x-3`}
              role="status"
            >
              <span className="text-xl" aria-hidden="true">{tone.icon}</span>
              <div className="flex-1">
                {notification.title && (
                  <p className="font-semibold">{notification.title}</p>
                )}
                {notification.message && (
                  <p className="text-sm mt-1 leading-relaxed">{notification.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeNotification(notification.id)}
                className="text-sm font-medium hover:underline"
                aria-label="Fermer la notification"
              >
                Fermer
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
