import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { ProfileStatus } from '../enums/profile-status.enum';
import { PaginationDto } from './pagination.dto';

const STATUS_MESSAGE = 'El estado debe ser pending, approved o rejected.';

export class AdminCaregiversQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: ProfileStatus,
    description: 'Filtrar por estado del perfil',
  })
  @IsOptional()
  @IsEnum(ProfileStatus, { message: STATUS_MESSAGE })
  status?: ProfileStatus;
}

export class UpdateProfileStatusDto {
  @ApiProperty({ enum: ProfileStatus, example: ProfileStatus.APPROVED })
  @IsEnum(ProfileStatus, { message: STATUS_MESSAGE })
  status: ProfileStatus;
}

export class CaregiverUserIdParamDto {
  @ApiProperty({
    example: '64b7f0c2a1d3e4f5a6b7c8da',
    description: 'ID del usuario paseador/cuidador',
  })
  @IsMongoId()
  userId: string;
}
