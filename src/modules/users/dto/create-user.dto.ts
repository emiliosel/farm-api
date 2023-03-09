import { IsEmail, IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  public email: string;

  @IsString()
  @IsNotEmpty()
  public password: string;

  @IsInt()
  public lat: number;

  @IsInt()
  public long: number;

  @IsString()
  public address: string;
}
