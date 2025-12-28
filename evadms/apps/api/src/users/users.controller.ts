import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, AssignRolesDto, UserQueryDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('admin', 'owner', 'supervisor')
  @ApiOperation({ summary: 'Get all users' })
  async findAll(@Query() query: UserQueryDto) {
    console.log('[UsersController] findAll - ENTERED');
    try {
      console.log('[UsersController] findAll - query:', query);
      const result = await this.usersService.findAll(query);
      console.log('[UsersController] findAll - success, count:', result.data?.length);
      return result;
    } catch (error) {
      console.error('[UsersController] findAll - ERROR:', error);
      throw error;
    }
  }

  @Get('roles')
  @Roles('admin', 'owner')
  @ApiOperation({ summary: 'Get all roles' })
  async getRoles() {
    console.log('[UsersController] getRoles - ENTERED');
    return this.usersService.getRoles();
  }

  @Get(':id')
  @Roles('admin', 'owner', 'supervisor')
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id') id: string) {
    console.log('[UsersController] findById - ENTERED, id:', id);
    return this.usersService.findById(id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() currentUser: any) {
    return this.usersService.create(dto, currentUser.id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a user' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.update(id, dto, currentUser.id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Deactivate a user' })
  async delete(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.usersService.delete(id, currentUser.id);
  }

  @Post(':id/roles')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign roles to user' })
  async assignRoles(
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
    @CurrentUser() currentUser: any,
  ) {
    await this.usersService.assignRoles(id, dto.roleIds, currentUser.id);
    return this.usersService.findById(id);
  }

  @Delete(':id/roles/:roleId')
  @Roles('admin')
  @ApiOperation({ summary: 'Remove role from user' })
  async removeRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @CurrentUser() currentUser: any,
  ) {
    await this.usersService.removeRole(id, roleId, currentUser.id);
    return this.usersService.findById(id);
  }
}
