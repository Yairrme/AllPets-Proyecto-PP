import {
  Controller,
  Get,
  Inject,
  Param,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PaginationDto } from 'y/contracts';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Caregivers')
// Límite más amplio: el listado público pide el perfil de cada paseador.
// TODO: devolver los perfiles unidos en /caregivers para evitar N+1 requests.
@Throttle({ default: { limit: 300, ttl: 60_000 } })
@Controller('caregivers')
export class PublicCaregiversController {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar cuidadores y paseadores activos (Paginado)',
  })
  @ApiResponse({ status: 200, description: 'Listado obtenido exitosamente' })
  async getCaregivers(@Query() pagination: PaginationDto) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send({ cmd: 'get_caregivers' }, pagination),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al obtener paseadores y cuidadores',
      );
    }
  }

  @Get(':userId/profile')
  @ApiOperation({ summary: 'Obtener perfil público de un cuidador' })
  @ApiParam({ name: 'userId', description: 'ID del cuidador' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
  async getCaregiverProfile(@Param('userId') userId: string) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send(
          { cmd: 'get_caregiver_profile' },
          { user_id: userId },
        ),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al obtener el perfil del cuidador',
      );
    }
  }

  @Get(':caregiverId/reviews')
  @ApiOperation({ summary: 'Obtener reseñas públicas de un cuidador' })
  @ApiParam({ name: 'caregiverId', description: 'ID del cuidador' })
  @ApiResponse({ status: 200, description: 'Reseñas obtenidas exitosamente' })
  async getReviews(
    @Param('caregiverId') caregiverId: string,
    @Query() pagination: PaginationDto,
  ) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send(
          { cmd: 'get_reviews_for_caregiver' },
          { caregiver_id: caregiverId, pagination },
        ),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al obtener reseñas del cuidador',
      );
    }
  }
}
