import { IsInt, IsNumber, IsString, IsUUID } from "class-validator"

export class CreateFarmInputDto {
  @IsString()
  public name: string;

  @IsString()
  public address: string;

  @IsNumber()
  public yield: number;

  @IsNumber()
  public size: number;

  @IsInt()
  public lat: number;

  @IsInt()
  public long: number;

  @IsUUID()
  public userId: string;
}
