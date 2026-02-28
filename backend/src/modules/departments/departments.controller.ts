import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateDepartmentDto, @CurrentUser() user: any) {
    return this.departmentsService.create(dto, user.productionId);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    const departments = await this.departmentsService.findAll(user.productionId);
    return { data: departments };
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @CurrentUser() user: any) {
    return this.departmentsService.update(id, dto, user.productionId);
  }
}
