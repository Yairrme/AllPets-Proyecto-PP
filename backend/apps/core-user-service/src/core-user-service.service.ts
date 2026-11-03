import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Buffer } from 'node:buffer';
import { RpcException } from '@nestjs/microservices';
import { escapeRegex, isDuplicateKeyError } from 'y/common';
import {
  AdminCaregiversQueryDto,
  CAREGIVER_FILE_LIMITS,
  CaregiverDirectoryQueryDto,
  CaregiverFileField,
  PET_SIZES,
  CreateReviewDto,
  LoginDto,
  PaginationDto,
  ProfileStatus,
  RegisterDto,
  UpdateCaregiverProfileDto,
  UpdateUserDto,
  UserRole,
} from 'y/contracts';
import { User, UserDocument } from './schemas/user.schema';
import {
  CaregiverProfile,
  CaregiverProfileDocument,
} from './schemas/caregiver-profile.schema';
import { Review, ReviewDocument } from './schemas/review.schema';
import {
  decryptPhone,
  encryptPhone,
  isEncryptedPhone,
} from './security/phone-crypto';

/**
 * Sin campo status = perfil anterior a SCRUM-112 = aprobado. Con $in (null incluye
 * el campo ausente) Mongo puede usar el índice de status; con $nin no.
 */
const APPROVED_PROFILE = {
  status: { $in: [ProfileStatus.APPROVED, null] },
};

/** Los comprobantes pueden tener datos personales: solo los ven el dueño y el admin. */
const PUBLIC_PROFILE_FIELDS = '-__v -certification_documents';

/**
 * Lo único del usuario que sale en el directorio público. Es una lista blanca: un
 * campo nuevo de User no se publica por accidente (ni email, ni teléfono, ni hash).
 */
const PUBLIC_USER_FIELDS = {
  name: 1,
  role: 1,
  city: 1,
  profile_image: 1,
  created_at: 1,
  updated_at: 1,
};

interface DirectoryRow {
  user: Record<string, unknown>;
  [field: string]: unknown;
}

/** Forma de cada prestador en el directorio: el usuario con su perfil adentro. */
function toDirectoryItem({ user, ...profile }: DirectoryRow) {
  return { ...user, profile };
}

@Injectable()
export class CoreUserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(CaregiverProfile.name)
    private readonly profileModel: Model<CaregiverProfileDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // 1. AUTENTICACIÓN: Registro
  async register(registerDto: RegisterDto): Promise<any> {
    const { password, name, city, phone, role } = registerDto;
    const email = registerDto.email.trim().toLowerCase();

    // Defensa en profundidad: nunca permitir crear administradores por registro
    if (role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'No está permitido registrarse con ese rol.',
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Crear el usuario
    const createdUser = new this.userModel({
      name,
      email,
      password_hash,
      city,
      phone: phone ? encryptPhone(phone, this.getPhoneEncryptionKey()) : phone,
      role,
    });
    let savedUser: UserDocument;
    try {
      savedUser = await createdUser.save();
    } catch (error: unknown) {
      // Dos registros simultáneos pasan la verificación de arriba: decide el índice único.
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(
          'El correo electrónico ya está registrado.',
        );
      }
      throw error;
    }

    // Si el rol es paseador o cuidador, inicializar su perfil de cuidador
    if (role === UserRole.WALKER || role === UserRole.CAREGIVER) {
      const caregiverProfile = new this.profileModel({
        user_id: savedUser._id,
        bio: '',
        services: [],
        rating_avg: 0,
        total_reviews: 0,
        hourly_rate: 4000,
        experience_years: 1,
        accepted_sizes: ['pequeño', 'mediano', 'grande'],
        availability: [],
        certifications: [],
        certification_documents: [],
        status: ProfileStatus.PENDING,
      });
      try {
        await caregiverProfile.save();
      } catch (error: unknown) {
        // Sin perfil no hay aprobación posible: se deshace el registro.
        await this.userModel.deleteOne({ _id: savedUser._id }).exec();
        throw error;
      }
    }

    // Retornar usuario sin la contraseña hash
    return this.toPublicUser(savedUser);
  }

  // 2. AUTENTICACIÓN: Login
  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; user: any }> {
    const email = loginDto.email.trim().toLowerCase();
    const { password } = loginDto;

    // Buscar usuario por email
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // Validar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // Generar JWT
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      user: await this.toPublicUser(user),
    };
  }

  /** Datos vigentes del usuario: el gateway los usa para no confiar solo en el JWT. */
  async getUserSession(userId: string): Promise<{ role: UserRole }> {
    const user = Types.ObjectId.isValid(userId)
      ? await this.userModel.findById(userId).select('role').exec()
      : null;
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return { role: user.role };
  }

  // 3. GESTIÓN DE USUARIOS
  async getUserById(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID no válido');
    }
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return this.toPublicUser(user);
  }

  async updateUser(userId: string, updateData: UpdateUserDto): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('ID de usuario no válido');
    }

    const updatePayload: Record<string, unknown> = {};

    if (updateData.name !== undefined) {
      updatePayload.name = updateData.name.trim();
    }

    if (updateData.email !== undefined) {
      const normalizedEmail = updateData.email.trim().toLowerCase();
      const duplicate = await this.userModel
        .findOne({
          email: normalizedEmail,
          _id: { $ne: new Types.ObjectId(userId) },
        })
        .select('_id')
        .exec();
      if (duplicate) {
        throw new ConflictException(
          'El correo electrónico ya está en uso por otra cuenta.',
        );
      }
      updatePayload.email = normalizedEmail;
    }

    if (updateData.city !== undefined) {
      updatePayload.city = updateData.city;
    }

    if (updateData.phone !== undefined) {
      const trimmedPhone = updateData.phone.trim();
      updatePayload.phone = trimmedPhone
        ? encryptPhone(trimmedPhone, this.getPhoneEncryptionKey())
        : '';
    }

    let user: UserDocument | null;
    try {
      user = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $set: updatePayload },
          { returnDocument: 'after', runValidators: true },
        )
        .exec();
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(
          'El correo electrónico ya está en uso por otra cuenta.',
        );
      }
      throw error;
    }

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    return this.toPublicUser(user);
  }

  /** Devuelve las rutas de sus archivos para que el gateway los borre del disco. */
  async deleteUser(
    id: string,
  ): Promise<{ message: string; user_id: string; files: string[] }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID de usuario no válido');
    }

    const userId = new Types.ObjectId(id);
    const user = await this.userModel
      .findById(userId)
      .select('_id profile_image')
      .exec();
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const profile = await this.profileModel
      .findOne({ user_id: userId })
      .select('profile_image gallery_images certification_documents')
      .exec();
    // Sus reseñas desaparecen: hay que recalcular a quienes había calificado.
    const reviewedCaregivers = await this.reviewModel
      .distinct('caregiver_id', { reviewer_id: userId })
      .exec();

    await Promise.all([
      this.profileModel.deleteOne({ user_id: userId }).exec(),
      this.reviewModel
        .deleteMany({
          $or: [{ reviewer_id: userId }, { caregiver_id: userId }],
        })
        .exec(),
      this.userModel.deleteOne({ _id: userId }).exec(),
    ]);
    await Promise.all(
      reviewedCaregivers.map((caregiverId) =>
        this.updateCaregiverAverageRating(String(caregiverId)),
      ),
    );

    return {
      message: 'Usuario eliminado correctamente.',
      user_id: id,
      files: [
        user.profile_image,
        profile?.profile_image,
        ...(profile?.gallery_images ?? []),
        ...(profile?.certification_documents ?? []),
      ].filter((path): path is string => Boolean(path)),
    };
  }

  async updateUserProfileImage(
    userId: string,
    profile_image: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('ID de usuario no válido');
    }
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { profile_image } },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.toPublicUser(user);
  }

  async getAllUsers(pagination: PaginationDto): Promise<{
    data: Omit<User, 'password_hash'>[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit } = pagination;
    const [users, total] = await Promise.all([
      this.userModel
        .find()
        .sort({ created_at: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments().exec(),
    ]);

    return {
      data: await Promise.all(users.map((user) => this.toPublicUser(user))),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCaregivers(query: CaregiverDirectoryQueryDto): Promise<{
    data: Record<string, unknown>[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit } = query;
    const [result] = await this.profileModel
      .aggregate<{ data: DirectoryRow[]; total: { count: number }[] }>([
        ...this.directoryStages(query),
        {
          $facet: {
            data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
            total: [{ $count: 'count' }],
          },
        },
      ])
      .exec();
    const total = result.total[0]?.count ?? 0;

    return {
      data: result.data.map(toDirectoryItem),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Un prestador del directorio (ej. un enlace directo a su perfil). */
  async getDirectoryCaregiver(
    userId: string,
  ): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('ID de usuario no válido');
    }
    const [row] = await this.profileModel
      .aggregate<DirectoryRow>([
        { $match: { user_id: new Types.ObjectId(userId) } },
        ...this.directoryStages({}),
        { $limit: 1 },
      ])
      .exec();
    if (!row) {
      throw new NotFoundException('Paseador o cuidador no encontrado');
    }
    return toDirectoryItem(row);
  }

  /**
   * Solo perfiles aprobados, unidos a su usuario. Un usuario sin perfil no aparece
   * porque se parte de los perfiles: nadie lo revisó.
   */
  private directoryStages(filters: Partial<CaregiverDirectoryQueryDto>) {
    const { q, city, role, max_rate, min_rating, pet_size, available } =
      filters;

    const profileMatch: Record<string, unknown> = { ...APPROVED_PROFILE };
    if (max_rate !== undefined) profileMatch.hourly_rate = { $lte: max_rate };
    if (min_rating) profileMatch.rating_avg = { $gte: min_rating };
    // Perfiles anteriores a estos campos: aceptan todos los tamaños y están disponibles.
    if (available) profileMatch.is_available = { $ne: false };
    if (
      pet_size &&
      PET_SIZES.includes(pet_size as (typeof PET_SIZES)[number])
    ) {
      profileMatch.$or = [
        { accepted_sizes: pet_size },
        { accepted_sizes: { $exists: false } },
        { accepted_sizes: { $size: 0 } },
      ];
    }

    const userMatch: Record<string, unknown> = {
      'user.role': role ?? { $in: [UserRole.WALKER, UserRole.CAREGIVER] },
    };
    if (city) userMatch['user.city'] = city;
    if (q) {
      const term = { $regex: escapeRegex(q), $options: 'i' };
      userMatch.$or = [
        { 'user.name': term },
        { 'user.city': term },
        { bio: term },
      ];
    }

    return [
      { $match: profileMatch },
      { $project: { __v: 0, certification_documents: 0 } },
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: 'user_id',
          foreignField: '_id',
          pipeline: [{ $project: PUBLIC_USER_FIELDS }],
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: userMatch },
      // Primero quienes toman clientes; _id deja el orden estable entre páginas.
      { $addFields: { takes_clients: { $ne: ['$is_available', false] } } },
      { $sort: { takes_clients: -1, created_at: -1, _id: -1 } },
      { $project: { takes_clients: 0 } },
    ] as PipelineStage[];
  }

  // 4. PERFILES DE CUIDADORES / PASEADORES
  async getCaregiverProfileByUserId(userId: string): Promise<CaregiverProfile> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('ID de usuario no válido');
    }
    const profile = await this.profileModel
      .findOne({ user_id: new Types.ObjectId(userId) })
      .exec();
    if (!profile) {
      throw new NotFoundException('Perfil de cuidador no encontrado');
    }
    return profile;
  }

  /** Perfil visible para cualquiera: solo si está aprobado y sin los comprobantes. */
  async getPublicCaregiverProfile(userId: string): Promise<CaregiverProfile> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('ID de usuario no válido');
    }
    const profile = await this.profileModel
      .findOne({ user_id: new Types.ObjectId(userId), ...APPROVED_PROFILE })
      .select(PUBLIC_PROFILE_FIELDS)
      .exec();
    if (!profile) {
      throw new NotFoundException('Perfil de cuidador no encontrado');
    }
    return profile;
  }

  /** Teléfono de un prestador aprobado que está tomando clientes nuevos. */
  async getCaregiverContact(userId: string): Promise<{ phone: string | null }> {
    const user = await this.requireCaregiverUser(userId);
    const profile = await this.profileModel
      .findOne({ user_id: user._id, ...APPROVED_PROFILE })
      .select('is_available')
      .exec();
    if (!profile) {
      throw new NotFoundException('Perfil de cuidador no encontrado');
    }
    if (profile.is_available === false) {
      throw new ConflictException(
        'Este prestador no está tomando clientes nuevos.',
      );
    }
    return {
      phone: user.phone
        ? decryptPhone(user.phone, this.getPhoneEncryptionKey())
        : null,
    };
  }

  async updateCaregiverProfileImage(
    userId: string,
    profile_image: string,
  ): Promise<CaregiverProfile> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('ID de usuario no válido');
    }
    const profile = await this.profileModel
      .findOneAndUpdate(
        { user_id: new Types.ObjectId(userId) },
        { $set: { profile_image } },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (!profile) {
      throw new NotFoundException('Perfil de cuidador no encontrado');
    }
    return profile;
  }

  /**
   * Agrega archivos a la galería o a los comprobantes. Es una sola operación en
   * Mongo: dos subidas simultáneas no se pisan ni pueden superar el límite.
   */
  async addCaregiverFiles(
    userId: string,
    field: CaregiverFileField,
    paths: string[],
  ): Promise<CaregiverProfile> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('ID de usuario no válido');
    }
    const user_id = new Types.ObjectId(userId);
    const limit = CAREGIVER_FILE_LIMITS[field];
    const profile = await this.profileModel
      .findOneAndUpdate(
        {
          user_id,
          $expr: {
            $lte: [
              { $size: { $ifNull: [`$${field}`, []] } },
              limit - paths.length,
            ],
          },
        },
        { $push: { [field]: { $each: paths } } },
        { returnDocument: 'after' },
      )
      .exec();
    if (profile) return profile;

    if (!(await this.profileModel.exists({ user_id }))) {
      throw new NotFoundException('Perfil de cuidador no encontrado');
    }
    throw new ConflictException(
      `Se pueden tener hasta ${limit} archivos. Eliminá alguno antes de subir más.`,
    );
  }

  /** Quita un archivo del perfil; 404 si no le pertenece, y así nunca se borra uno ajeno. */
  async removeCaregiverFile(
    userId: string,
    field: CaregiverFileField,
    path: string,
  ): Promise<CaregiverProfile> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('ID de usuario no válido');
    }
    const profile = await this.profileModel
      .findOneAndUpdate(
        { user_id: new Types.ObjectId(userId), [field]: path },
        { $pull: { [field]: path } },
        { returnDocument: 'after' },
      )
      .exec();
    if (!profile) {
      throw new NotFoundException('El archivo no pertenece a este perfil');
    }
    return profile;
  }

  async updateCaregiverProfile(
    userId: string,
    updateData: UpdateCaregiverProfileDto,
  ): Promise<CaregiverProfile> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('ID de usuario no válido');
    }

    const { phone, ...profileFields } = updateData;

    if (phone !== undefined) {
      const trimmedPhone = phone.trim();
      const encryptedPhone = trimmedPhone
        ? encryptPhone(trimmedPhone, this.getPhoneEncryptionKey())
        : '';
      await this.userModel
        .findByIdAndUpdate(
          userId,
          { $set: { phone: encryptedPhone } },
          { returnDocument: 'after', runValidators: true },
        )
        .exec();
    }

    const profile = await this.profileModel
      .findOneAndUpdate(
        { user_id: new Types.ObjectId(userId) },
        { $set: profileFields },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!profile) {
      throw new NotFoundException(
        'Perfil de cuidador no encontrado para actualizar',
      );
    }
    return profile;
  }

  // 5. RESEÑAS / VALORACIONES
  async createReview(createReviewDto: CreateReviewDto): Promise<Review> {
    const { reviewer_id, caregiver_id, score, comment } = createReviewDto;

    if (
      !Types.ObjectId.isValid(reviewer_id) ||
      !Types.ObjectId.isValid(caregiver_id)
    ) {
      throw new NotFoundException('IDs de usuario o cuidador inválidos');
    }

    // Verificar que el cuidador exista y tenga un rol adecuado
    const caregiverUser = await this.userModel.findById(caregiver_id).exec();
    if (
      !caregiverUser ||
      (caregiverUser.role !== UserRole.WALKER &&
        caregiverUser.role !== UserRole.CAREGIVER)
    ) {
      throw new NotFoundException(
        'El usuario calificado no es un paseador o cuidador válido',
      );
    }

    const reviewerUser = await this.userModel.findById(reviewer_id).exec();
    if (!reviewerUser) {
      throw new NotFoundException('El usuario que deja la reseña no existe');
    }
    if (reviewerUser.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Solo los clientes pueden dejar reseñas');
    }
    if (reviewer_id === caregiver_id) {
      throw new ForbiddenException('No puedes dejarte una reseña a ti mismo');
    }

    // Guardar reseña
    const review = new this.reviewModel({
      reviewer_id: new Types.ObjectId(reviewer_id),
      caregiver_id: new Types.ObjectId(caregiver_id),
      score,
      comment,
    });
    let savedReview: ReviewDocument;
    try {
      savedReview = await review.save();
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(
          'El cliente ya dejó una reseña para este cuidador.',
        );
      }
      throw error;
    }

    // Recalcular el rating_avg del cuidador
    await this.updateCaregiverAverageRating(caregiver_id);

    return savedReview;
  }

  async getReviewsForCaregiver(
    caregiverId: string,
    pagination: PaginationDto,
  ): Promise<{
    data: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    if (!Types.ObjectId.isValid(caregiverId)) {
      throw new NotFoundException('ID de cuidador no válido');
    }
    const filter = { caregiver_id: new Types.ObjectId(caregiverId) };
    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        // Solo datos públicos del autor: NUNCA exponer el email (endpoint público)
        .populate('reviewer_id', 'name profile_image')
        .sort({ created_at: -1, _id: -1 })
        .skip((pagination.page - 1) * pagination.limit)
        .limit(pagination.limit)
        .exec(),
      this.reviewModel.countDocuments(filter).exec(),
    ]);

    return {
      data: reviews,
      pagination: {
        ...pagination,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  // Función interna para recalcular promedio de estrellas y total de reseñas
  private async updateCaregiverAverageRating(
    caregiverId: string,
  ): Promise<void> {
    const user_id = new Types.ObjectId(caregiverId);
    const [stats] = await this.reviewModel
      .aggregate<{ avg: number; total: number }>([
        { $match: { caregiver_id: user_id } },
        { $group: { _id: null, avg: { $avg: '$score' }, total: { $sum: 1 } } },
      ])
      .exec();

    await this.profileModel
      .updateOne(
        { user_id },
        {
          $set: {
            rating_avg: stats ? parseFloat(stats.avg.toFixed(2)) : 0,
            total_reviews: stats?.total ?? 0,
          },
        },
      )
      .exec();
  }

  // 6. ADMINISTRACIÓN DE PASEADORES Y CUIDADORES (SCRUM-112)
  async getCaregiversForAdmin(query: AdminCaregiversQueryDto): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit, status } = query;
    const caregiverRoles = [UserRole.WALKER, UserRole.CAREGIVER];

    const idFilter =
      status === ProfileStatus.APPROVED
        ? { _id: { $in: await this.approvedUserIds() } }
        : status
          ? { _id: { $in: await this.userIdsWithStatus([status]) } }
          : {};
    const filter = { role: { $in: caregiverRoles }, ...idFilter };

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ created_at: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const profiles = await this.profileModel
      .find({ user_id: { $in: users.map((user) => user._id) } })
      .select('user_id status is_available profile_image')
      .exec();
    const profileByUser = new Map(
      profiles.map((profile) => [String(profile.user_id), profile]),
    );

    const data = await Promise.all(
      users.map(async (user) => {
        const profile = profileByUser.get(user._id.toString());
        return {
          ...(await this.toPublicUser(user)),
          // Sin perfil no hubo revisión: no puede figurar como aprobado.
          profile_status: profile?.status ?? ProfileStatus.PENDING,
          is_available: profile?.is_available ?? true,
          caregiver_image: profile?.profile_image || null,
        };
      }),
    );

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCaregiverForAdmin(
    userId: string,
  ): Promise<{ user: any; profile: CaregiverProfile }> {
    const user = await this.requireCaregiverUser(userId);
    const profile = await this.profileModel
      .findOne({ user_id: user._id })
      .exec();
    if (!profile) {
      throw new RpcException({
        status: 404,
        message: 'Perfil de cuidador no encontrado',
      });
    }
    return { user: await this.toPublicUser(user), profile };
  }

  async setCaregiverStatus(
    userId: string,
    status: ProfileStatus,
  ): Promise<CaregiverProfile> {
    const user = await this.requireCaregiverUser(userId);
    const profile = await this.profileModel
      .findOneAndUpdate(
        { user_id: user._id },
        { $set: { status } },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (!profile) {
      throw new RpcException({
        status: 404,
        message: 'Perfil de cuidador no encontrado',
      });
    }
    return profile;
  }

  /** Usuario con rol paseador/cuidador, o 404 (sale con su código por TCP). */
  private async requireCaregiverUser(userId: string): Promise<UserDocument> {
    const user = Types.ObjectId.isValid(userId)
      ? await this.userModel.findById(userId).exec()
      : null;
    if (
      !user ||
      (user.role !== UserRole.WALKER && user.role !== UserRole.CAREGIVER)
    ) {
      throw new RpcException({
        status: 404,
        message: 'Paseador o cuidador no encontrado',
      });
    }
    return user;
  }

  /** Un usuario sin perfil no aparece: nadie lo revisó. */
  private async approvedUserIds(): Promise<Types.ObjectId[]> {
    const profiles = await this.profileModel
      .find(APPROVED_PROFILE)
      .select('user_id')
      .exec();
    return profiles.map((profile) => profile.user_id as Types.ObjectId);
  }

  /** IDs de usuario cuyo perfil tiene alguno de los estados indicados. */
  private async userIdsWithStatus(
    statuses: ProfileStatus[],
  ): Promise<Types.ObjectId[]> {
    const profiles = await this.profileModel
      .find({ status: { $in: statuses } })
      .select('user_id')
      .exec();
    return profiles.map((profile) => profile.user_id as Types.ObjectId);
  }

  private async toPublicUser(
    user: UserDocument,
  ): Promise<Omit<User, 'password_hash'>> {
    const userResponse = user.toObject();
    delete userResponse.password_hash;

    if (userResponse.phone) {
      const phone = decryptPhone(
        userResponse.phone,
        this.getPhoneEncryptionKey(),
      );
      userResponse.phone = phone;

      // Migración: si el teléfono estaba guardado en texto plano, cifrarlo.
      // (Antes se comparaba `phone !== user.phone`, que siempre era true para
      // teléfonos cifrados y provocaba un UPDATE en cada lectura.)
      if (!isEncryptedPhone(user.phone)) {
        await this.userModel
          .updateOne(
            { _id: user._id },
            {
              $set: {
                phone: encryptPhone(phone, this.getPhoneEncryptionKey()),
              },
            },
          )
          .exec();
      }
    }

    return userResponse as Omit<User, 'password_hash'>;
  }

  private getPhoneEncryptionKey(): Buffer {
    const encodedKey = this.configService.get<string>('PHONE_ENCRYPTION_KEY');
    if (!encodedKey) {
      throw new Error(
        'PHONE_ENCRYPTION_KEY debe estar configurada para cifrar teléfonos.',
      );
    }

    const key = Buffer.from(encodedKey, 'base64');
    if (key.length !== 32) {
      throw new Error(
        'PHONE_ENCRYPTION_KEY debe ser una clave base64 de 32 bytes.',
      );
    }

    return key;
  }
}
