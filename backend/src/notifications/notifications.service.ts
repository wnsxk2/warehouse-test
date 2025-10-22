import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Subject } from 'rxjs';

interface SseClient {
  userId: string;
  companyId: string;
  subject: Subject<MessageEvent>;
}

@Injectable()
export class NotificationsService {
  private sseClients: Map<string, SseClient[]> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register SSE client
   */
  registerSseClient(userId: string, companyId: string): Subject<MessageEvent> {
    const subject = new Subject<MessageEvent>();
    const client: SseClient = { userId, companyId, subject };

    const clients = this.sseClients.get(companyId) || [];
    clients.push(client);
    this.sseClients.set(companyId, clients);

    return subject;
  }

  /**
   * Unregister SSE client
   */
  unregisterSseClient(userId: string, companyId: string) {
    const clients = this.sseClients.get(companyId);
    if (clients) {
      const filtered = clients.filter((c) => c.userId !== userId);
      if (filtered.length > 0) {
        this.sseClients.set(companyId, filtered);
      } else {
        this.sseClients.delete(companyId);
      }
    }
  }

  /**
   * Broadcast notification to SSE clients
   */
  private broadcastToSseClients(companyId: string, notification: any) {
    const clients = this.sseClients.get(companyId);
    if (clients) {
      clients.forEach((client) => {
        // Send to all users or specific user
        if (!notification.userId || notification.userId === client.userId) {
          client.subject.next({
            data: JSON.stringify(notification),
          } as MessageEvent);
        }
      });
    }
  }

  /**
   * Create a notification for a company (all users or specific user)
   */
  async create(createNotificationDto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: createNotificationDto,
    });

    // Broadcast to SSE clients
    this.broadcastToSseClients(notification.companyId, notification);

    return notification;
  }

  /**
   * Create notification for all users in a company
   */
  async createForCompany(
    companyId: string,
    type: string,
    title: string,
    message: string,
    relatedId?: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        companyId,
        type: type as any,
        title,
        message,
        relatedId,
        userId: null, // null means all users in company
      },
    });

    // Broadcast to SSE clients
    this.broadcastToSseClients(companyId, notification);

    return notification;
  }

  /**
   * Get all notifications for a user
   */
  async findAllForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user || !user.companyId) {
      return [];
    }

    // Get notifications for the user or all users in the company
    return this.prisma.notification.findMany({
      where: {
        companyId: user.companyId,
        OR: [{ userId: userId }, { userId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user || !user.companyId) {
      return 0;
    }

    return this.prisma.notification.count({
      where: {
        companyId: user.companyId,
        OR: [{ userId: userId }, { userId: null }],
        isRead: false,
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user || !user.companyId) {
      throw new Error('User not found or not assigned to a company');
    }

    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.companyId !== user.companyId) {
      throw new Error('Notification not found or access denied');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user || !user.companyId) {
      throw new Error('User not found or not assigned to a company');
    }

    return this.prisma.notification.updateMany({
      where: {
        companyId: user.companyId,
        OR: [{ userId: userId }, { userId: null }],
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  /**
   * Delete old notifications (older than 30 days)
   */
  async deleteOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });
  }
}
