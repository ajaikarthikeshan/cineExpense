import { IsString, IsNumber, IsPositive, IsDateString, IsUUID } from 'class-validator';

export class CreateExpenseDto {
  @IsUUID()
  departmentId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsDateString()
  expenseDate: string;

  @IsString()
  description: string;
}
