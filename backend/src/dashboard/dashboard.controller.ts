import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@GetUser() user: any) {
    return this.dashboardService.getStats(user.companyId);
  }

  @Get('recent-transactions')
  async getRecentTransactions(@GetUser() user: any) {
    return this.dashboardService.getRecentTransactions(user.companyId);
  }
}
