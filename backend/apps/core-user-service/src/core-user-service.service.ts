import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Buffer } from 'node:buffer';
import {
  CreateReviewDto,
  LoginDto,
  PaginationDto,
  RegisterDto,
  UpdateCaregiverProfileDto,
  UserRole,
} from 'y/contracts';
import { User, UserDocument } from './schemas/user.schema';
import {
  CaregiverProfile,
  CaregiverProfileDocument,
} from './schemas/caregiver-profile.schema';
import { Review, ReviewDocument } from './schemas/review.schema';
import { decryptPhone, encryptPhone } from './security/phone-crypto';

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
    const savedUser = await createdUser.save();

    // Si el rol es paseador o cuidador, inicializar su perfil de cuidador
    if (role === UserRole.WALKER || role === UserRole.CAREGIVER) {
      const caregiverProfile = new this.profileModel({
        user_id: savedUser._id,
        bio: '',
        services: [],
        rating_avg: 0,
        availability: [],
      });
      await caregiverProfile.save();
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

  async deleteUser(id: string): Promise<{ message: string; user_id: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID de usuario no válido');
    }

    const userId = new Types.ObjectId(id);
    const user = await this.userModel.findById(userId).select('_id').exec();
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    await Promise.all([
      this.profileModel.deleteOne({ user_id: userId }).exec(),
      this.reviewModel
        .deleteMany({
          $or: [{ reviewer_id: userId }, { caregiver_id: userId }],
        })
        .exec(),
      this.userModel.deleteOne({ _id: userId }).exec(),
    ]);

    return {
      message: 'Usuario eliminado correctamente.',
      user_id: id,
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
        { new: true, runValidators: true },
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
        .sort({ created_at: -1 })
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

  async getCaregivers(pagination: PaginationDto): Promise<{
    data: Omit<User, 'password_hash' | 'email'>[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit } = pagination;
    const caregiverRoles = [UserRole.WALKER, UserRole.CAREGIVER];
    const filter = { role: { $in: caregiverRoles } };
    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const publicUsers = await Promise.all(
      users.map(async (user) => {
        const publicUser = await this.toPublicUser(user);
        const { email: _email, ...safeUser } = publicUser;
        return safeUser;
      }),
    );

    return {
      data: publicUsers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
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

  async updateCaregiverProfile(
    userId: string,
    updateData: UpdateCaregiverProfileDto,
  ): Promise<CaregiverProfile> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('ID de usuario no válido');
    }
    const profile = await this.profileModel
      .findOneAndUpdate(
        { user_id: new Types.ObjectId(userId) },
        { $set: updateData },
        { new: true, runValidators: true },
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
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
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
        .populate('reviewer_id', 'name email')
        .sort({ created_at: -1 })
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

  // Función interna para recalcular promedio de estrellas
  private async updateCaregiverAverageRating(
    caregiverId: string,
  ): Promise<void> {
    const reviews = await this.reviewModel
      .find({ caregiver_id: new Types.ObjectId(caregiverId) })
      .exec();
    if (reviews.length === 0) return;

    const sum = reviews.reduce((acc, curr) => acc + curr.score, 0);
    const avg = parseFloat((sum / reviews.length).toFixed(2));

    await this.profileModel
      .updateOne(
        { user_id: new Types.ObjectId(caregiverId) },
        { $set: { rating_avg: avg } },
      )
      .exec();
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

      if (phone !== user.phone) {
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
