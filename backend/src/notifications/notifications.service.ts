import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a notification for a company (all users or specific user)
   */
  async create(createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: createNotificationDto,
    });
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
    return this.prisma.notification.create({
      data: {
        companyId,
        type: type as any,
        title,
        message,
        relatedId,
        userId: null, // null means all users in company
      },
    });
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
