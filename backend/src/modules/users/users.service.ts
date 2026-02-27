/**
 * PROTOTYPE: findById returns the hardcoded user regardless of id.
 * Replace with real DB queries before production.
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { HARDCODED_USER } from '@modules/auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findById(_id: string): Promise<User> {
    return HARDCODED_USER as unknown as User;
  }

  async findByEmail(_email: string): Promise<User | null> {
    return HARDCODED_USER as unknown as User;
  }

  async findAll(productionId: string): Promise<User[]> {
    return this.repo.find({ where: { productionId } });
  }
}
