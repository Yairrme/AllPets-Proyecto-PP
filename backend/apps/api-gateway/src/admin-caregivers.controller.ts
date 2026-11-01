import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import {
  AdminCaregiversQueryDto,
  CaregiverUserIdParamDto,
  UpdateProfileStatusDto,
  UserRole,
} from 'y/contracts';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Roles } from './auth/roles.decorator';
import { RolesGuard } from './auth/roles.guard';

/**
 * Administración de paseadores y cuidadores (SCRUM-112).
 * Editar y eliminar reutilizan los endpoints existentes:
 *  - PUT    /users/:id
 *  - PUT    /users/:userId/caregiver-profile
 *  - DELETE /users/:id
 */
@ApiTags('Admin - Caregivers')
@ApiBearerAuth('JWT-auth')
@Controller('admin/caregivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCaregiversController {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar paseadores y cuidadores con su estado (Solo Admin)',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado' })
  @ApiResponse({ status: 403, description: 'Requiere rol ADMIN' })
  list(@Query() query: AdminCaregiversQueryDto) {
    return this.send(
      'admin_get_caregivers',
      query,
      'Error al obtener paseadores y cuidadores',
    );
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Ver usuario y perfil de un paseador/cuidador' })
  @ApiResponse({ status: 200, description: 'Usuario y perfil' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  getOne(@Param() { userId }: CaregiverUserIdParamDto) {
    return this.send(
      'admin_get_caregiver',
      { user_id: userId },
      'Error al obtener el perfil',
    );
  }

  @Patch(':userId/status')
  @ApiOperation({ summary: 'Aprobar, rechazar o poner en pendiente un perfil' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  setStatus(
    @Param() { userId }: CaregiverUserIdParamDto,
    @Body() { status }: UpdateProfileStatusDto,
  ) {
    return this.send(
      'admin_set_caregiver_status',
      { user_id: userId, status },
      'Error al actualizar el estado del perfil',
    );
  }

  private async send<T>(
    cmd: string,
    payload: object,
    fallback: string,
  ): Promise<T> {
    try {
      return await firstValueFrom(
        this.userServiceClient.send<T>({ cmd }, payload),
      );
    } catch (error) {
      const status = Number.isInteger(error?.status)
        ? (error.status as number)
        : HttpStatus.BAD_REQUEST;
      throw new HttpException(error?.message || fallback, status);
    }
  }
}
