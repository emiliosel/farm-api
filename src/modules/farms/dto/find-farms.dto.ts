import { Expose, Transform, instanceToPlain } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsUUID } from "class-validator";

export enum FarmSortByEnum {
  Name = "name",
  Date = "date",
  Distance = "distance"
}

export class FindFarmsInputDto {
  @IsEnum(FarmSortByEnum)
  @IsOptional()
  public sortBy?: FarmSortByEnum;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value === "true" ? true : false))
  public outliers?: boolean;

  @IsUUID()
  public userId: string;

}

export class FarmListOutputDto {
  constructor(partial?: Partial<FarmListOutputDto>) {
    Object.assign(this, partial);
  }

  @Expose()
  public id: string;

  @Expose()
  public name: string;

  @Expose()
  public yield: number;

  @Expose()
  public size: number;

  @Expose()
  public userId: string;

  @Expose()
  public address: string;

  public lat: number;

  public long: number;

  @Expose()
  public owner: string;

  public distance: number;

  @Expose()
  public drivingDistance?: number;

  public expose() {
    return instanceToPlain(this, { strategy: "excludeAll" });
  }
}
