import { Expose } from "class-transformer";
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

  @IsUUID()
  public userId: string;
}

export class CreateFarmOutputDto {
  @Expose()
  public readonly id: string;

  @Expose()
  public name: string;

  @Expose()
  public address: string;

  @Expose()
  public size: number;

  @Expose()
  public yield: number;

  @Expose()
  public lat: number;

  @Expose()
  public long: number;

  @Expose()
  public createdAt: Date;

  @Expose()
  public updatedAt: Date;
}
