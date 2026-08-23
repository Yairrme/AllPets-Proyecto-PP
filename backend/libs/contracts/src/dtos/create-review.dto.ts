import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty({ message: 'El ID del evaluador es obligatorio (reviewer_id).' })
  reviewer_id: string;

  @IsString()
  @IsNotEmpty({ message: 'El ID del cuidador es obligatorio (caregiver_id).' })
  caregiver_id: string;

  @IsNumber()
  @Min(1, { message: 'La calificación mínima es 1.' })
  @Max(5, { message: 'La calificación máxima es 5.' })
  @IsNotEmpty({ message: 'La calificación es obligatoria.' })
  score: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
