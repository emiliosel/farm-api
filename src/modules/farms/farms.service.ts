import dataSource from "orm/orm.config";
import { Farm } from "./entities/farm.entity";
import { CreateFarmInputDto } from "./dto/create-farm.dto";
import { FarmListOutputDto, FindFarmsInputDto } from "./dto/find-farms.dto";
import { UnprocessableEntityError } from "errors/errors";
import { UsersService } from "modules/users/users.service";
import { Not } from "typeorm";

export class FarmService {
  constructor(
    private readonly farmRepository = dataSource.getRepository(Farm),
    private readonly userService = new UsersService(),
  ) {}

  public async createFarm(createFarmDto: CreateFarmInputDto) {
    const { name, yield: farmYield, size, lat, long, address, userId } = createFarmDto;

    const user = await this.userService.findOneBy({ id: userId });

    if (!user) {
      throw new UnprocessableEntityError("User not found");
    }

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
    const [errors] = await FindFarmsInputDto.validate(findFarmsDto);

    if (errors) {
      throw new UnprocessableEntityError("Input validation errors.");
    }

    const { sortBy, outliers, userId } = findFarmsDto;

    const user = await this.userService.findOneBy({ id: userId });

    if (!user) {
      throw new Error("User not found");
    }

    const farmQueryBuilder = this.farmRepository.createQueryBuilder("farm");

    farmQueryBuilder.select([
      "farm.name as name", 
      "farm.yield as yield", 
      "farm.userId as userId", 
      "farm.address as address", 
      "farm.lat as lat", 
      "farm.long as long"
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
        userLong: user.long
      })
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

    return entities.map(entity => ({ ...entity, owner: user.email } as FarmListOutputDto)); 

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
        type: "DESC" as const,
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
