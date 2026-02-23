import { IsString, IsNumber, IsPositive, IsNotEmpty } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsPositive()
  allocatedBudget: number;
}
