import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '../entities/user.entity'
import { ILoginDto, IRegisterDto, IAuthResponse, ICreateUserDto } from '../../common/interfaces/auth.interface'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { RoleType } from '../entities/role.entity'
import { RoleService } from './role.service'
import { ClientService } from '../../client/services/client.service'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly roleService: RoleService,
    @Inject(forwardRef(() => ClientService))
    private readonly clientService: ClientService,
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

    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    })

    await this.userRepository.save(user)

    const roleType = dto.role && Object.values(RoleType).includes(dto.role) ? dto.role : RoleType.CLIENT

    try {
      await this.roleService.addRoleToUser({
        userId: user.id,
        roleType,
      })
    } catch (error) {
      console.error('Error assigning role to user', error)
    }

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

    if (roleType === RoleType.CLIENT) {
      try {
        await this.clientService.createClientForUser(userWithRoles)
      } catch (error) {
        console.error('Error creating client for user:', error)
      }
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

  async createUserWithRole(dto: ICreateUserDto): Promise<IAuthResponse> {
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

    const hashedPassword = await bcrypt.hash(dto.temporaryPassword, 10)

    const user = this.userRepository.create({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      isActive: true,
    })

    await this.userRepository.save(user)

    try {
      await this.roleService.addRoleToUser({
        userId: user.id,
        roleType: dto.roleType,
      })
    } catch (error) {
      console.error('Error assigning role to user', error)
      throw new UnauthorizedException({
        success: false,
        error: {
          message: 'Error al asignar el rol al usuario',
          code: 'ROLE_ASSIGNMENT_ERROR',
        },
      })
    }

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

    if (dto.roleType === RoleType.CLIENT) {
      try {
        await this.clientService.createClientForUser(userWithRoles)
      } catch (error) {
        console.error('Error creating client for user:', error)
      }
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
        temporaryPassword: dto.temporaryPassword,
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
