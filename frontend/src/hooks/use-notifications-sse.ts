import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useNotificationsSSE() {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }

    // Create SSE connection
    const eventSource = new EventSource(
      `${API_URL}/notifications/stream?token=${token}`,
      {
        withCredentials: true,
      }
    );

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('SSE connection established');
    };

    eventSource.onmessage = (event) => {
      console.log('SSE notification received:', event.data);

      // Parse the notification
      try {
        const notification = JSON.parse(event.data);

        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });

        // Optionally show a browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
          });
        }
      } catch (error) {
        console.error('Error parsing SSE notification:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsConnected(false);
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [queryClient]);

  return { isConnected };
}
