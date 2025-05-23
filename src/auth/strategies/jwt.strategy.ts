import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { User } from '../entities/user.entity'
import { IJwtPayload } from '../../common/interfaces/auth.interface'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET')
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined')
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    })
  }

  async validate(payload: IJwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, deletedAt: IsNull() },
      relations: ['role'],
    })

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: {
          message: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        },
      })
    }

    return user
  }
}
