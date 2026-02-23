import { IsString, IsNumber, IsPositive, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  allocatedBudget?: number;
}
