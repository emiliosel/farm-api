import { Transform, plainToInstance } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsUUID, validate } from "class-validator";

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

  public static async validate(obj: object): Promise<[string, null] | [null, FindFarmsInputDto]> {
    const instance = plainToInstance(FindFarmsInputDto, obj);
    console.log({ instance });
    const result = await validate(instance, {
      whitelist: true,
    });

    const errors = result && result.length ? result.map(er => er.constraints) : null;

    if (errors) {
      const errStr = errors
        .filter(exist => exist)
        .map((err: { [type: string]: string }) => Object.values(err).join("\n"))
        .flat()
        .join("\n");
      return [errStr, null];
    }

    return [null, obj as FindFarmsInputDto];
  }
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
