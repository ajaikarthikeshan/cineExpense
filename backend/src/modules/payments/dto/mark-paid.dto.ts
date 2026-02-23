import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime()) && date <= new Date();
  }

  defaultMessage(): string {
    return 'paymentDate cannot be a future date';
  }
}

export class MarkPaidDto {
  @IsEnum(['cash', 'bank'])
  paymentMethod: 'cash' | 'bank';

  @IsString()
  @MinLength(1)
  referenceNumber: string;

  @IsString()
  @IsNotEmpty()
  @Validate(IsNotFutureDateConstraint)
  paymentDate: string;
}
