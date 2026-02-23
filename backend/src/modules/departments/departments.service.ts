import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) {}

  async findById(id: string, productionId: string): Promise<Department> {
    const dept = await this.departmentRepo.findOne({ where: { id, productionId } });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async findAll(productionId: string): Promise<Department[]> {
    return this.departmentRepo.find({ where: { productionId } });
  }

  async create(dto: CreateDepartmentDto, productionId: string): Promise<Department> {
    const dept = this.departmentRepo.create({ ...dto, productionId });
    return this.departmentRepo.save(dept);
  }

  async update(id: string, dto: UpdateDepartmentDto, productionId: string): Promise<Department> {
    const dept = await this.findById(id, productionId);
    Object.assign(dept, dto);
    return this.departmentRepo.save(dept);
  }
}
