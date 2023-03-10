import config from "config/config";
import { UnprocessableEntityError } from "errors/errors";
import { Express } from "express";
import { setupServer } from "server/server";
import { disconnectAndClearDatabase } from "helpers/utils";
import http, { Server } from "http";
import ds from "orm/orm.config";
import { UsersService } from "modules/users/users.service";
import { User } from "modules/users/entities/user.entity";
import { FarmService } from "../farms.service";
import { CreateFarmInputDto } from "../dto/create-farm.dto";
import { Farm } from "../entities/farm.entity";
import { GeoService, GoogleApiErrorsEnum } from "helpers/geo.service";
import { Repository } from "typeorm";
import { DeleteFarmInputDto } from "../dto/delete-farm.dto";
import { FarmSortByEnum, FindFarmsInputDto } from "../dto/find-farms.dto";
import { mockCreateFarmInputDto, mockCreateUserDto } from "helpers/test";

describe("FarmsService", () => {
  let app: Express;
  let server: Server;

  let usersService: UsersService;
  let farmService: FarmService;

  let user: User;

  beforeAll(() => {
    app = setupServer();
    server = http.createServer(app).listen(config.APP_PORT);
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(async () => {
    await ds.initialize();
    usersService = new UsersService();
    farmService = new FarmService();

    usersService = new UsersService();
    
  });

  afterEach(async () => {
    await disconnectAndClearDatabase(ds);
  });

  describe(".createFarm", () => {
    it("should create new farm", async () => {
      const userDto = mockCreateUserDto();
      user = await usersService.createUser(userDto);
      const createFarmDto: CreateFarmInputDto = mockCreateFarmInputDto(user.id);
      const createdFarm = await farmService.createFarm(createFarmDto);

      expect(createdFarm).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        address: expect.any(String),
        size: expect.any(Number),
        yield: expect.any(Number),
        lat: expect.any(Number),
        long: expect.any(Number),
      });
    });

    it("should throw UnprocessableEntityError if user not found", async () => {
      const mockCreateFarmInputDto = {
        name: "Mock Farm",
        yield: 200,
        size: 50,
        address: "Mock Address",
        userId: "456",
      };

      await expect(farmService.createFarm(mockCreateFarmInputDto)).rejects.toThrow(UnprocessableEntityError);
    });

    it("should throw an Error if an API error occurred while finding latitude and longitude", async () => {
      const createFarmDto: CreateFarmInputDto = {
        name: "Farm Name",
        yield: 1000,
        size: 50,
        address: "1234 Farm St, Farmville, TX 12345",
        userId: "5f810b92-bf5f-11ed-afa1-0242ac120002",
      };

      const mockUserService = {
        findOneBy: jest.fn().mockResolvedValue({ id: "123", lat: 0, long: 0 }),
      };
      const mockGeoService = {
        findLatLngFromAddress: jest.fn().mockResolvedValue([GoogleApiErrorsEnum.ApiError, undefined]),
      };
      const mockFarmRepository = {
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn(),
      };
      const farmService = new FarmService(
        mockFarmRepository as unknown as Repository<Farm>, 
        mockUserService as unknown as UsersService, 
        mockGeoService as unknown as GeoService
      );

      const createFarmPromise = farmService.createFarm(createFarmDto);

      await expect(createFarmPromise).rejects.toThrow(Error);
      expect(mockUserService.findOneBy).toHaveBeenCalledWith({ id: createFarmDto.userId });
      expect(mockGeoService.findLatLngFromAddress).toHaveBeenCalledWith(createFarmDto.address);
    });

    it("should throw an UnprocessableEntityError if latitude and longitude were not found for the given address", async () => {
      const createFarmDto: CreateFarmInputDto = {
        name: "Farm Name",
        yield: 1000,
        size: 50,
        address: "1234 Farm St, Farmville, TX 12345",
        userId: "5f810b92-bf5f-11ed-afa1-0242ac120002",
      };
      const mockUserService = {
        findOneBy: jest.fn().mockResolvedValue({ id: 1, lat: 0, long: 0 }),
      };
      const mockGeoService = {
        findLatLngFromAddress: jest.fn().mockResolvedValue([GoogleApiErrorsEnum.DataNotFound, undefined]),
      };
      const mockFarmRepository = {
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn(),
      };
      const farmService = new FarmService(
        mockFarmRepository as unknown as Repository<Farm>,
        mockUserService as unknown as UsersService,
        mockGeoService as unknown as GeoService,
      );
      const createFarmPromise = farmService.createFarm(createFarmDto);

      await expect(createFarmPromise).rejects.toThrow(UnprocessableEntityError);
    });
  });

  describe(".deleteFarm", () => {
    it("should return true if a farm is deleted successfully", async () => {
      const deleteInput = new DeleteFarmInputDto();
      deleteInput.userId = "5f810b92-bf5f-11ed-afa1-0242ac120002";
      deleteInput.farmId = "5f810b92-bf5f-11ed-afa1-0242ac120003";

      const farmRepositoryMock = {
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        findOne: jest.fn().mockResolvedValue({ id: deleteInput.farmId, user: {id: deleteInput.userId} }),
      };

      const farmService = new FarmService(farmRepositoryMock as unknown as Repository<Farm>);

      const result = await farmService.deleteFarm(deleteInput);

      expect(result).toBe(true);
    });

    it("should return false if affected rows not equal 1", async () => {
      const deleteInput = new DeleteFarmInputDto();
      deleteInput.userId = "5f810b92-bf5f-11ed-afa1-0242ac120002";
      deleteInput.farmId = "5f810b92-bf5f-11ed-afa1-0242ac120003";

      const farmRepositoryMock = {
        delete: jest.fn().mockResolvedValue({ affected: 0 }),
        findOne: jest.fn().mockResolvedValue({ id: deleteInput.farmId, user: { id: deleteInput.userId } }),
      };

      const farmService = new FarmService(farmRepositoryMock as unknown as Repository<Farm>);

      const result = await farmService.deleteFarm(deleteInput);
      expect(result).toEqual(false);
    });
  });

  describe(".findMany", () => {
    test("should return farms that don't belong to the current user", async () => {
      

      const userDto = mockCreateUserDto();
      const user = await usersService.createUser(userDto);
      const user2Dto = mockCreateUserDto();
      const user2 = await usersService.createUser(user2Dto);

      await farmService.createFarm(mockCreateFarmInputDto(user.id));
      await farmService.createFarm(mockCreateFarmInputDto(user2.id));

      const findFarmsDto: FindFarmsInputDto = {
        userId: user.id,
        sortBy: FarmSortByEnum.Name,
        outliers: true,
      };

      const farms = await farmService.findMany(findFarmsDto);
      const farmsBelongingToUser = farms.filter(farm => farm.userId === findFarmsDto.userId);
      expect(farmsBelongingToUser.length).toBe(0);
    });

    test("should throw an UnprocessableEntityError if the user is not found", async () => {
      const findFarmsDto: FindFarmsInputDto = {
        userId: user.id,
        sortBy: FarmSortByEnum.Name,
        outliers: true,
      };
      const userService = new UsersService();
      jest.spyOn(userService, "findOneBy").mockResolvedValueOnce(null);
      await expect(farmService.findMany(findFarmsDto)).rejects.toThrow(UnprocessableEntityError);
    });

    test("should return farms sorted by name in ascending order", async () => {
      const userDto = mockCreateUserDto();
      const user = await usersService.createUser(userDto);
      const user2Dto = mockCreateUserDto();
      const user2 = await usersService.createUser(user2Dto);

      await farmService.createFarm(mockCreateFarmInputDto(user.id));
      await farmService.createFarm(mockCreateFarmInputDto(user2.id));
      await farmService.createFarm(mockCreateFarmInputDto(user2.id));
      await farmService.createFarm(mockCreateFarmInputDto(user2.id));

      const findFarmsDto: FindFarmsInputDto = {
        userId: user.id,
        sortBy: FarmSortByEnum.Name,
        outliers: true,
      };
      const farms = await farmService.findMany(findFarmsDto);
      const sortedFarms = [...farms].sort((a, b) => (a.name as string).localeCompare(b.name as string));
      expect(farms).toEqual(sortedFarms);
    });

    test("should return farms sorted by createdAt in descending order", async () => {
      const userDto = mockCreateUserDto();
      const user = await usersService.createUser(userDto);
      const user2Dto = mockCreateUserDto();
      const user2 = await usersService.createUser(user2Dto);

      await farmService.createFarm(mockCreateFarmInputDto(user.id));
      await farmService.createFarm(mockCreateFarmInputDto(user2.id));
      await farmService.createFarm(mockCreateFarmInputDto(user2.id));
      await farmService.createFarm(mockCreateFarmInputDto(user2.id));

      const findFarmsDto: FindFarmsInputDto = {
        userId: user.id,
        sortBy: FarmSortByEnum.Date,
        outliers: true,
      };
      const farms = await farmService.findMany(findFarmsDto);
      const sortedFarms = [...farms].sort(
        (a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
      );
      expect(farms).toEqual(sortedFarms);
    });

    test("should return farms sorted by distance in ascending order", async () => {
      const userDto = mockCreateUserDto();
      const user = await usersService.createUser(userDto);
      const user2Dto = mockCreateUserDto();
      const user2 = await usersService.createUser(user2Dto);

      await farmService.createFarm(mockCreateFarmInputDto(user.id));
      await farmService.createFarm(mockCreateFarmInputDto(user2.id));
      await farmService.createFarm(mockCreateFarmInputDto(user2.id));
      await farmService.createFarm(mockCreateFarmInputDto(user2.id));

      const findFarmsDto: FindFarmsInputDto = {
        userId: user.id,
        sortBy: FarmSortByEnum.Date,
        outliers: true,
      };
      const farms = await farmService.findMany(findFarmsDto);
      const sortedFarms = [...farms].sort((a, b) => a.distance - b.distance);
      expect(farms).toEqual(sortedFarms);
    });
  })
});
