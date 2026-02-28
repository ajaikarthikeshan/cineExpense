import { IsString, IsNumber, IsPositive, IsDateString, IsUUID, IsOptional } from 'class-validator';

export class UpdateExpenseDto {
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
