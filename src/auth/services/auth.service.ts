/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '../entities/user.entity'
import { IAuthResponse } from '../../common/interfaces/auth.interface'
import { RoleType } from '../entities/role.entity'
import { Role } from '../entities/role.entity'
import { LoginDto, RegisterDto } from '../dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto, currentUser?: User): Promise<IAuthResponse> {
    const { email, password, name, role } = registerDto

    const existingUser = await this.userRepository.findOne({ where: { email } })
    if (existingUser) {
      throw new ConflictException('Email already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const roleType = currentUser ? role : RoleType.CLIENT
    const roleEntity = await this.roleRepository.findOne({ where: { name: roleType } })
    if (!roleEntity) {
      throw new ConflictException('Role not found')
    }

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      role: roleEntity,
    })

    const savedUser = await this.userRepository.save(user)

    if (currentUser && [RoleType.ADMIN, RoleType.SUPER_ADMIN].includes(currentUser.role.name)) {
      return {
        user: {
          ...savedUser,
          password,
        },
        token: this.jwtService.sign({
          sub: savedUser.id,
          email: savedUser.email,
          role: savedUser.role.name,
        }),
      }
    }

    const { password: _, ...userWithoutPassword } = savedUser
    return {
      user: userWithoutPassword,
      token: this.jwtService.sign({
        sub: savedUser.id,
        email: savedUser.email,
        role: savedUser.role.name,
      }),
    }
  }

  async login(loginDto: LoginDto): Promise<IAuthResponse> {
    const { email, password } = loginDto
    const user = await this.userRepository.findOne({ where: { email }, relations: ['role'] })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const { password: _, ...userWithoutPassword } = user
    return {
      user: userWithoutPassword,
      token: this.jwtService.sign({ sub: user.id, email: user.email, role: user.role.name }),
    }
  }

  private generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      onboardingCompleted: user.onboardingCompleted,
    })
  }
}
