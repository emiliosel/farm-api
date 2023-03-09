import { Transform } from "class-transformer";
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

export type FarmListOutputDto = {
  name: string;
  yield: string;
  userId: string;
  address: string;
  lat: number;
  long: number;
  owner: number;
};
