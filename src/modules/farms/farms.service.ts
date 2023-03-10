import dataSource from "orm/orm.config";
import { Farm } from "./entities/farm.entity";
import { CreateFarmInputDto, CreateFarmOutputDto } from "./dto/create-farm.dto";
import { FarmListOutputDto, FindFarmsInputDto } from "./dto/find-farms.dto";
import { NotAuthorizedError, NotFoundError, UnprocessableEntityError } from "errors/errors";
import { UsersService } from "modules/users/users.service";
import { Not } from "typeorm";
import { DeleteFarmInputDto } from "./dto/delete-farm.dto";
import { transformInputAndValidate, transformOutput } from "helpers/validate";
import { GeoService, GoogleApiErrorsEnum } from "helpers/geo.service";
import { User } from "modules/users/entities/user.entity";

export class FarmService {
  constructor(
    private readonly farmRepository = dataSource.getRepository(Farm),
    private readonly userService = new UsersService(),
    private readonly geoService = new GeoService()
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

    const [error, result] = await this.geoService.findLatLngFromAddress(address);

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

    const createdFarm = await this.farmRepository.save(farm);

    return transformOutput(createdFarm, CreateFarmOutputDto);
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
      "user.email as owner",
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

    farmQueryBuilder.innerJoin("farm.user", "user")

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

    const farm = await this.farmRepository.findOne({
      where: { id: farmId },
      relations: { user: true },
      select: { id: true, user: { id: true } },
    });

    if (!farm) {
      throw new NotFoundError("Farm not found!");
    }

    if (farm.user.id !== userId) {
      throw new NotAuthorizedError("Farm belongs to another user!");
    }

    const result = await this.farmRepository.delete({ id: farmId, user: { id: userId } });

    return result.affected === 1;
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

    const [error, apiDistanceResult] = await this.geoService.findDrivingDistance(origin, destination);

    const drivingDistance = error === null ? apiDistanceResult : farm.distance

    return new FarmListOutputDto({ 
      ...farm, 
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
