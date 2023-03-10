import dataSource from "orm/orm.config";
import { Farm } from "./entities/farm.entity";
import { CreateFarmInputDto } from "./dto/create-farm.dto";
import { FarmListOutputDto, FindFarmsInputDto } from "./dto/find-farms.dto";
import { NotFoundError, UnprocessableEntityError } from "errors/errors";
import { UsersService } from "modules/users/users.service";
import { Not } from "typeorm";
import { DeleteFarmInputDto } from "./dto/delete-farm.dto";
import { transformInputAndValidate } from "helpers/validate";
import { GoogleApiErrorsEnum, findDrivingDistance, findLatLngFromAddress } from "helpers/geo.service";
import { User } from "modules/users/entities/user.entity";

export class FarmService {
  constructor(
    private readonly farmRepository = dataSource.getRepository(Farm),
    private readonly userService = new UsersService(),
  ) {}

  public async createFarm(createFarmDto: CreateFarmInputDto) {
    const { 
      name, 
      yield: farmYield, 
      size, 
      address, 
      userId 
    } = await transformInputAndValidate(createFarmDto, CreateFarmInputDto);

    const user = await this.userService.findOneBy({ id: userId });

    if (!user) {
      throw new UnprocessableEntityError("User not found");
    }

    const [error, result] = await findLatLngFromAddress(address);

    if (error === GoogleApiErrorsEnum.ApiError) {
      throw new Error("Some api error occured");
    }

    if (error === GoogleApiErrorsEnum.DataNotFound) {
      throw new UnprocessableEntityError("Could not find latitude and longitude for the address given");
    }

    const { lat, lng: long } = result;

    const farm = this.farmRepository.create({
      name,
      yield: farmYield,
      size,
      lat,
      long,
      address,
      user,
    });

    return this.farmRepository.save(farm);
  }

  public async findMany(findFarmsDto: FindFarmsInputDto) {
    const { sortBy, outliers, userId } = await transformInputAndValidate(findFarmsDto, FindFarmsInputDto);

    const user = await this.userService.findOneBy({ id: userId });

    if (!user) {
      throw new UnprocessableEntityError("User not found");
    }

    const farmQueryBuilder = this.farmRepository.createQueryBuilder("farm");

    farmQueryBuilder.select([
      "farm.id as id",
      "farm.name as name",
      "farm.yield as yield",
      "farm.size as size",
      "farm.userId as userId",
      "farm.address as address",
      "farm.lat as lat",
      "farm.long as long",
    ]);

    // Get farms that don't belong to current user
    farmQueryBuilder.andWhere({ user: { id: Not(userId) } });

    if (sortBy === "distance") {
      farmQueryBuilder.addSelect(
        `earth_distance(
          ll_to_earth(:userLat, :userLong),
          ll_to_earth(farm.lat, farm.long)
        )`,
        "distance",
      );
      farmQueryBuilder.setParameters({
        userLat: user.lat,
        userLong: user.long,
      });
    }

    // Get outliers
    if (outliers) {
      const yieldAverage = await this.findYieldAverage();
      const yieldBelowAverage30 = yieldAverage - yieldAverage * 0.7;
      const yieldAboveAverage30 = yieldAverage - yieldAverage * 0.3;

      farmQueryBuilder.andWhere(`(farm.yield < :yieldBelowAverage30 OR farm.yield > :yieldAboveAverage30)`, {
        yieldBelowAverage30,
        yieldAboveAverage30,
      });
    }

    // Sort results
    const sort = this.getSortOption(sortBy);
    farmQueryBuilder.orderBy({ [sort.field]: sort.type });

    const entities = await farmQueryBuilder.getRawMany();

    const farmsWithDistance = await Promise.all(
      entities.map(
        async (entity: Omit<FarmListOutputDto, "owner">) => this.findDrivingDistance(entity, user)
      )
    );

    return farmsWithDistance;
  }

  public async deleteFarm(deleteInput: DeleteFarmInputDto) {
    const { userId, farmId } = await transformInputAndValidate(deleteInput, DeleteFarmInputDto);
    const result = await this.farmRepository.delete({ id: farmId, user: { id: userId } });

    if (result.affected === 1) {
      return true;
    }

    throw new NotFoundError("Farm not found!");
  }

  private async findDrivingDistance(farm: Omit<FarmListOutputDto, "owner">, user: User) {

    const origin = {
      lat: user.lat,
      lng: user.long
    }

    const destination = {
      lat: farm.lat,
      lng: farm.long
    }

    const [error, apiDistanceResult] = await findDrivingDistance(origin, destination);

    const drivingDistance = error === null ? apiDistanceResult : farm.distance

    return new FarmListOutputDto({ 
      ...farm, 
      owner: user.email,
      drivingDistance
    }).expose()
  }

  private getSortOption(sortBy?: FindFarmsInputDto["sortBy"]) {
    // Sort if option exist
    const sortByOptions = {
      name: {
        field: "farm.name" as const,
        type: "ASC" as const,
      },
      date: {
        field: "farm.createdAt" as const,
        type: "DESC" as const,
      },
      distance: {
        field: "distance" as const,
        type: "ASC" as const,
      },
      default: {
        field: "farm.createdAt" as const,
        type: "DESC" as const,
      },
    };

    return sortByOptions[sortBy || "default"];
  }

  private async findYieldAverage() {
    const result = await this.farmRepository
      .createQueryBuilder("farm")
      .select("AVG(farm.yield)", "averageYield")
      .getRawOne<{ averageYield: number }>();

    return result?.averageYield || 0;
  }
}
