import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  CaregiverDirectoryQueryDto,
  CaregiverUserIdParamDto,
  PaginationDto,
  UserRole,
} from 'y/contracts';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Roles } from './auth/roles.decorator';
import { RolesGuard } from './auth/roles.guard';
import { UserClient } from './user.client';

@ApiTags('Caregivers')
// Directorio público: GET /caregivers ya incluye el perfil de cada prestador.
@Throttle({ default: { limit: 300, ttl: 60_000 } })
@Controller('caregivers')
export class PublicCaregiversController {
  constructor(private readonly users: UserClient) {}

  @Get()
  @ApiOperation({
    summary: 'Listar cuidadores y paseadores aprobados con filtros (Paginado)',
  })
  @ApiResponse({ status: 200, description: 'Listado obtenido exitosamente' })
  getCaregivers(@Query() query: CaregiverDirectoryQueryDto) {
    return this.users.send(
      'get_caregivers',
      query,
      'Error al obtener paseadores y cuidadores',
    );
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Obtener un prestador del directorio' })
  @ApiResponse({ status: 200, description: 'Prestador con su perfil' })
  @ApiResponse({ status: 404, description: 'No existe o no está aprobado' })
  getCaregiver(@Param() { userId }: CaregiverUserIdParamDto) {
    return this.users.send(
      'get_directory_caregiver',
      { user_id: userId },
      'Error al obtener el paseador o cuidador',
    );
  }

  @Get(':userId/profile')
  @ApiOperation({ summary: 'Obtener perfil público de un cuidador aprobado' })
  @ApiParam({ name: 'userId', description: 'ID del cuidador' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'No existe o no está aprobado' })
  getCaregiverProfile(@Param('userId') userId: string) {
    return this.users.send(
      'get_public_caregiver_profile',
      { user_id: userId },
      'Error al obtener el perfil del cuidador',
    );
  }

  /**
   * El teléfono no está en el directorio: se entrega de a uno y con sesión,
   * para que no se pueda copiar la lista completa.
   */
  @Get(':userId/contact')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener el teléfono de un cuidador (con sesión)' })
  @ApiResponse({ status: 200, description: 'Teléfono del cuidador' })
  @ApiResponse({ status: 401, description: 'Requiere iniciar sesión' })
  @ApiResponse({ status: 409, description: 'No está tomando clientes nuevos' })
  getCaregiverContact(@Param() { userId }: CaregiverUserIdParamDto) {
    return this.users.send(
      'get_caregiver_contact',
      { user_id: userId },
      'Error al obtener el contacto del cuidador',
    );
  }

  @Get(':caregiverId/reviews')
  @ApiOperation({ summary: 'Obtener reseñas públicas de un cuidador' })
  @ApiParam({ name: 'caregiverId', description: 'ID del cuidador' })
  @ApiResponse({ status: 200, description: 'Reseñas obtenidas exitosamente' })
  getReviews(
    @Param('caregiverId') caregiverId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.users.send(
      'get_reviews_for_caregiver',
      { caregiver_id: caregiverId, pagination },
      'Error al obtener reseñas del cuidador',
    );
  }
}
