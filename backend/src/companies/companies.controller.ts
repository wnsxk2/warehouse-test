import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { SetupCompanyDto } from './dto/setup-company.dto';
import { AddUserDto } from './dto/add-user.dto';
import { CreateInviteCodeDto } from './dto/create-invite-code.dto';
import { JoinWithInviteDto } from './dto/join-with-invite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // User setup endpoint - create company and assign user as admin
  @Post('setup')
  @UseGuards(JwtAuthGuard)
  setupCompany(@Request() req: any, @Body() setupCompanyDto: SetupCompanyDto) {
    return this.companiesService.setupCompany(req.user.id, setupCompanyDto);
  }

  // Company admin endpoints - manage their own company
  @Get('my')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getMyCompany(@Request() req: any) {
    return this.companiesService.getMyCompany(req.user.id);
  }

  @Get('my/users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getMyCompanyUsers(@Request() req: any) {
    return this.companiesService.getMyCompanyUsers(req.user.id);
  }

  @Post('my/users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  addUserToMyCompany(@Request() req: any, @Body() addUserDto: AddUserDto) {
    return this.companiesService.addUserToMyCompany(req.user.id, addUserDto);
  }

  // Invite code endpoints
  @Post('my/invite-codes')
  @UseGuards(JwtAuthGuard, AdminGuard)
  createInviteCode(@Request() req: any, @Body() createInviteCodeDto: CreateInviteCodeDto) {
    return this.companiesService.createInviteCode(req.user.id, createInviteCodeDto);
  }

  @Get('my/invite-codes')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getMyInviteCodes(@Request() req: any) {
    return this.companiesService.getMyInviteCodes(req.user.id);
  }

  @Patch('my/invite-codes/:id/deactivate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  deactivateInviteCode(@Request() req: any, @Param('id') id: string) {
    return this.companiesService.deactivateInviteCode(req.user.id, id);
  }

  @Post('join-with-invite')
  @UseGuards(JwtAuthGuard)
  joinWithInviteCode(@Request() req: any, @Body() joinWithInviteDto: JoinWithInviteDto) {
    return this.companiesService.joinWithInviteCode(req.user.id, joinWithInviteDto);
  }

  // Super admin endpoints
  @Post()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }

  @Get(':id/users')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  getCompanyUsers(@Param('id') id: string) {
    return this.companiesService.getCompanyUsers(id);
  }
}
