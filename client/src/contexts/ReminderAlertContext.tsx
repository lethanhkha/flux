import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';
import { ReminderItem } from '../lib/reminderUtils';
import { audioNotifier } from '../lib/audioNotifier';
import { RingingReminderModal } from '../components/reminders/RingingReminderModal';
import { toast } from 'sonner';

interface ReminderAlertContextType {
  activeAlert: ReminderItem | null;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  notificationPermission: NotificationPermission;
  snoozeReminder: (id: string, minutes: number) => Promise<void>;
  completeReminder: (id: string) => Promise<void>;
  dismissActiveAlert: () => void;
  checkDueReminders: () => Promise<void>;
}

const ReminderAlertContext = createContext<ReminderAlertContextType | undefined>(undefined);

export const ReminderAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeAlert, setActiveAlert] = useState<ReminderItem | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Track already alerted IDs in the current session with their scheduled/snoozed target timestamp
  // so we don't spam the user with chimes repeatedly for the same alert
  const alertedInstancesRef = useRef<Map<string, string>>(new Map());

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.info('Trình duyệt của bạn không hỗ trợ thông báo đẩy');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast.success('Đã bật thông báo nhắc hẹn trên trình duyệt!');
      } else if (permission === 'denied') {
        toast.warning('Bạn đã từ chối nhận thông báo từ trình duyệt');
      }
      return permission;
    } catch {
      return 'denied';
    }
  }, []);

  const triggerAlert = useCallback(
    (item: ReminderItem) => {
      // 1. Play in-browser chime
      audioNotifier.playChime();

      // 2. Set modal active alert
      setActiveAlert(item);

      // 3. Trigger browser desktop notification if permission granted
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          const notif = new Notification(`🔔 Nhắc hẹn: ${item.title}`, {
            body: item.location ? `Địa điểm: ${item.location}` : 'Đã đến giờ thực hiện lịch hẹn!',
            icon: '/favicon.ico',
            tag: item.id,
          });

          notif.onclick = () => {
            window.focus();
            setActiveAlert(item);
          };
        } catch {
          // Safe ignore browser notification errors
        }
      }
    },
    []
  );

  const checkDueReminders = useCallback(async () => {
    if (!user) return;

    try {
      const res = await apiClient.get('/reminders/due');
      const dueList: ReminderItem[] = res.data?.data || [];

      if (dueList.length === 0) return;

      for (const item of dueList) {
        const timeKey = item.status === 'SNOOZED' && item.snoozedUntil
          ? item.snoozedUntil
          : item.scheduledAt;

        // Check if we've already alerted this exact time instance
        const previousAlertedTime = alertedInstancesRef.current.get(item.id);
        if (previousAlertedTime === timeKey) {
          continue;
        }

        // Mark as alerted
        alertedInstancesRef.current.set(item.id, timeKey);

        // Show alert modal & chime
        triggerAlert(item);
        break; // Show one modal at a time to prevent stacked chaos
      }
    } catch {
      // Background check failure is non-blocking
    }
  }, [user, triggerAlert]);

  // Periodic polling check every 25 seconds
  useEffect(() => {
    if (!user) {
      setActiveAlert(null);
      return;
    }

    // Initial check after short delay
    const initialTimer = setTimeout(() => {
      checkDueReminders();
    }, 2000);

    const interval = setInterval(() => {
      checkDueReminders();
    }, 25000);

    // Also check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDueReminders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, checkDueReminders]);

  const snoozeReminder = useCallback(
    async (id: string, minutes: number) => {
      try {
        await apiClient.patch(`/reminders/${id}/snooze`, { minutes });
        toast.info(`Đã hoãn lời nhắc thêm ${minutes} phút.`);
        setActiveAlert(null);
      } catch {
        toast.error('Không thể hoãn lời nhắc. Vui lòng thử lại.');
      }
    },
    []
  );

  const completeReminder = useCallback(
    async (id: string) => {
      try {
        await apiClient.patch(`/reminders/${id}/complete`);
        toast.success('Đã xác nhận hoàn thành lịch hẹn!');
        setActiveAlert(null);
      } catch {
        toast.error('Không thể cập nhật trạng thái. Vui lòng thử lại.');
      }
    },
    []
  );

  const dismissActiveAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  return (
    <ReminderAlertContext.Provider
      value={{
        activeAlert,
        requestNotificationPermission,
        notificationPermission,
        snoozeReminder,
        completeReminder,
        dismissActiveAlert,
        checkDueReminders,
      }}
    >
      {children}
      <RingingReminderModal
        reminder={activeAlert}
        onClose={dismissActiveAlert}
        onSnooze={snoozeReminder}
        onComplete={completeReminder}
      />
    </ReminderAlertContext.Provider>
  );
};

export const useReminderAlert = (): ReminderAlertContextType => {
  const context = useContext(ReminderAlertContext);
  if (!context) {
    throw new Error('useReminderAlert must be used within a ReminderAlertProvider');
  }
  return context;
};
