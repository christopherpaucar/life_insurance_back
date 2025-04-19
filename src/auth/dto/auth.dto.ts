import { IsEmail, IsString, MinLength, MaxLength, Matches, IsEnum } from 'class-validator'
import { ILoginDto, IRegisterDto } from '../../common/interfaces/auth.interface'
import { RoleType } from '../entities/role.entity'

export class LoginDto implements ILoginDto {
  @IsEmail({}, { message: 'Por favor, proporciona un email válido' })
  email: string

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(32, { message: 'La contraseña no debe exceder 32 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña debe contener al menos 1 letra mayúscula, 1 letra minúscula y 1 número o carácter especial',
  })
  password: string
}

export class RegisterDto extends LoginDto implements IRegisterDto {
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no debe exceder 50 caracteres' })
  name: string

  @IsEnum(RoleType, { message: 'El rol debe ser CLIENTE, ADMINISTRADOR, REVISOR o SUPER_ADMIN' })
  role: RoleType
}
