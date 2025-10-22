import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('stream')
  stream(@Request() req: any): Observable<MessageEvent> {
    const userId = req.user.id;
    const companyId = req.user.companyId;

    const subject = this.notificationsService.registerSseClient(userId, companyId);

    // Clean up on connection close
    req.on('close', () => {
      this.notificationsService.unregisterSseClient(userId, companyId);
      subject.complete();
    });

    return subject.asObservable();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Request() req: any) {
    return this.notificationsService.findAllForUser(req.user.id);
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Patch('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }
}
