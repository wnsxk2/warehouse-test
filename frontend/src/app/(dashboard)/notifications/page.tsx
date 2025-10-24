'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
  relatedId?: string;
}

type FilterType = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch all notifications (including read ones)
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications-all'],
    queryFn: async () => {
      const response = await apiClient.get(`/notifications/all`);
      return response.data;
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const token = localStorage.getItem('accessToken');
      return apiClient.patch(
        `/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-all'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('accessToken');
      return apiClient.patch(
        `/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-all'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });
    },
  });

  const getNotificationLink = (notification: Notification): string | null => {
    const { type, relatedId } = notification;

    if (!relatedId) {
      // If no relatedId, go to the default list page for that type
      switch (type) {
        case 'WAREHOUSE_CREATED':
        case 'WAREHOUSE_DELETED':
          return '/warehouses';
        case 'ITEM_CREATED':
        case 'ITEM_DELETED':
          return '/items';
        case 'TRANSACTION_CREATED':
          return '/transactions';
        default:
          return null;
      }
    }

    // If relatedId exists, go to the specific page
    switch (type) {
      case 'WAREHOUSE_CREATED':
      case 'WAREHOUSE_DELETED':
        return `/warehouses/${relatedId}`;
      case 'ITEM_CREATED':
      case 'ITEM_DELETED':
        return '/items'; // Items don't have detail pages, go to list
      case 'TRANSACTION_CREATED':
        return '/transactions'; // Transactions don't have detail pages, go to list
      default:
        return null;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to related page
    const link = getNotificationLink(notification);
    if (link) {
      router.push(link);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className='max-w-4xl mx-auto'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
            <Bell className='h-6 w-6' />
            알림
          </h1>
          <p className='text-sm text-gray-500 mt-1'>
            모든 알림을 확인하고 관리하세요
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            variant='outline'
            className='flex items-center gap-2'
          >
            <CheckCheck className='h-4 w-4' />
            모두 읽음 표시
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className='bg-white rounded-lg shadow mb-4 p-4'>
        <div className='flex items-center gap-2'>
          <Filter className='h-4 w-4 text-gray-500' />
          <span className='text-sm font-medium text-gray-700'>필터:</span>
          <div className='flex gap-2'>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilter('all')}
            >
              전체 ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilter('unread')}
            >
              읽지 않음 ({unreadCount})
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilter('read')}
            >
              읽음 ({notifications.length - unreadCount})
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className='bg-white rounded-lg shadow divide-y'>
        {isLoading ? (
          <div className='px-6 py-12 text-center text-gray-500'>
            로딩 중...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className='px-6 py-12 text-center text-gray-500'>
            {filter === 'all' && '알림이 없습니다'}
            {filter === 'unread' && '읽지 않은 알림이 없습니다'}
            {filter === 'read' && '읽은 알림이 없습니다'}
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                'px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors',
                !notification.isRead && 'bg-blue-50'
              )}
            >
              <div className='flex items-start gap-4'>
                {/* Read/Unread Indicator */}
                <div
                  className={cn(
                    'flex-shrink-0 w-3 h-3 rounded-full mt-1.5',
                    notification.isRead ? 'bg-gray-300' : 'bg-blue-500'
                  )}
                />

                {/* Notification Content */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex-1 min-w-0'>
                      <p
                        className={cn(
                          'text-base',
                          notification.isRead
                            ? 'text-gray-700'
                            : 'text-gray-900 font-medium'
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className='text-sm text-gray-600 mt-1'>
                        {notification.message}
                      </p>
                      <div className='flex items-center gap-3 mt-2'>
                        <p className='text-xs text-gray-400'>
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                        {notification.isRead && notification.readAt && (
                          <p className='text-xs text-gray-400'>
                            읽음: {formatRelativeTime(notification.readAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Mark as Read Button */}
                    {!notification.isRead && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(notification.id);
                        }}
                        className='flex-shrink-0'
                      >
                        <Check className='h-4 w-4' />
                        <span className='ml-1 text-xs'>읽음</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      {notifications.length > 0 && (
        <div className='mt-4 text-center text-sm text-gray-500'>
          총 {filteredNotifications.length}개의 알림
        </div>
      )}
    </div>
  );
}
