import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '../entities/user.entity'
import { ILoginDto, IRegisterDto, IAuthResponse } from '../../common/interfaces/auth.interface'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { RoleType } from '../entities/role.entity'
import { RoleService } from './role.service'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly roleService: RoleService,
  ) {}

  async register(dto: IRegisterDto): Promise<IAuthResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    })

    if (existingUser) {
      throw new UnauthorizedException({
        success: false,
        error: {
          message: 'El email ya está en uso',
          code: 'EMAIL_EXISTS',
        },
      })
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10)

    // Create the user first without roles
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    })

    await this.userRepository.save(user)

    // Then assign the default role (or specified role if valid)
    const roleType = dto.role && Object.values(RoleType).includes(dto.role) ? dto.role : RoleType.CLIENT

    try {
      await this.roleService.addRoleToUser({
        userId: user.id,
        roleType,
      })
    } catch (error) {
      // Log error but don't fail registration
      console.error('Error assigning role to user', error)
    }
    // Fetch the user with roles using query builder to select specific attributes
    const userWithRoles = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'role')
      .select(['user.id', 'user.email', 'user.name', 'role.id', 'role.name', 'role.permissions'])
      .where('user.id = :id', { id: user.id })
      .getOne()

    if (!userWithRoles) {
      throw new UnauthorizedException({
        success: false,
        error: {
          message: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        },
      })
    }

    const token = this.generateToken(userWithRoles)

    return new ApiResponseDto({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: userWithRoles.roles,
        },
        token,
      },
    })
  }

  async login(dto: ILoginDto): Promise<IAuthResponse> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'role')
      .select(['user', 'role.id', 'role.name', 'role.permissions'])
      .where('user.email = :email', { email: dto.email })
      .getOne()

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: {
          message: 'Credenciales inválidas',
          code: 'INVALID_CREDENTIALS',
        },
      })
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password)

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        success: false,
        error: {
          message: 'Credenciales inválidas',
          code: 'INVALID_CREDENTIALS',
        },
      })
    }

    const token = this.generateToken(user)

    return new ApiResponseDto({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
        },
        token,
      },
    })
  }

  private generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
    })
  }
}
