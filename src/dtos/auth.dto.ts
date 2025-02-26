import { IsEmail, IsString } from 'class-validator';

export class LoginRequestDTO {
  @IsEmail()
  public email: string;

  @IsString()
  public password: string;
}
