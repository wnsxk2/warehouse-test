import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransferInventoryDto } from './dto/transfer-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto, @GetUser() user: any) {
    return this.transactionsService.create(createTransactionDto, user.id, user.companyId);
  }

  @Post('transfer')
  transfer(@Body() transferInventoryDto: TransferInventoryDto, @GetUser() user: any) {
    return this.transactionsService.transfer(transferInventoryDto, user.id, user.companyId);
  }

  @Get()
  findAll(
    @GetUser() user: any,
    @Query('type') type?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('itemId') itemId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      type,
      warehouseId,
      itemId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    return this.transactionsService.findAll(user.companyId, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.transactionsService.findOne(id, user.companyId);
  }
}
