import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { AssignCompanyDto } from './dto/assign-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@GetUser() user: any, @Query('companyId') companyId?: string) {
    // If companyId is not provided, use the authenticated user's companyId
    const filterCompanyId = companyId || user.companyId;
    return this.usersService.findAll(filterCompanyId);
  }

  @Patch('me')
  updateProfile(@GetUser() user: any, @Body() updateUserDto: UpdateUserDto) {
    // Only allow updating name, not role or company
    const { name } = updateUserDto;
    return this.usersService.update(user.id, { name });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // Company admin endpoints - manage their own company users
  @Patch('company-admin/:id/role')
  @UseGuards(AdminGuard)
  updateUserRoleByCompanyAdmin(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRoleByAdmin(req.user.id, id, updateUserRoleDto.role);
  }

  @Delete('company-admin/:id')
  @UseGuards(AdminGuard)
  removeUserFromCompanyByAdmin(@Request() req: any, @Param('id') id: string) {
    return this.usersService.removeUserFromCompanyByAdmin(req.user.id, id);
  }

  // Super admin endpoints
  @Get('admin/unassigned')
  @UseGuards(SuperAdminGuard)
  getUnassignedUsers() {
    return this.usersService.getUnassignedUsers();
  }

  @Post('admin/create')
  @UseGuards(SuperAdminGuard)
  createUserByAdmin(@Body() createUserAdminDto: CreateUserAdminDto) {
    return this.usersService.createUserByAdmin(createUserAdminDto);
  }

  @Patch('admin/:id/assign-company')
  @UseGuards(SuperAdminGuard)
  assignUserToCompany(@Param('id') id: string, @Body() assignCompanyDto: AssignCompanyDto) {
    return this.usersService.assignUserToCompany(
      id,
      assignCompanyDto.companyId,
      assignCompanyDto.role,
    );
  }

  @Patch('admin/:id/role')
  @UseGuards(SuperAdminGuard)
  updateUserRole(@Param('id') id: string, @Body() updateUserRoleDto: UpdateUserRoleDto) {
    return this.usersService.updateUserRole(id, updateUserRoleDto.role);
  }

  @Delete('admin/:id')
  @UseGuards(SuperAdminGuard)
  deleteUserByAdmin(@Param('id') id: string) {
    return this.usersService.deleteUserByAdmin(id);
  }
}
