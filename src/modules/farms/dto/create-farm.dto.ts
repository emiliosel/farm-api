import { IsNumber, IsString, IsUUID } from "class-validator"

export class CreateFarmInputDto {
  @IsString()
  public name: string;

  @IsString()
  public address: string;

  @IsNumber()
  public yield: number;

  @IsNumber()
  public size: number;

  @IsNumber()
  public lat: number;

  @IsNumber()
  public long: number;

  @IsUUID()
  public userId: string;
}
