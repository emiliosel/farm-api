import config from "config/config";
import { Express } from "express";
import { setupServer } from "server/server";
import { disconnectAndClearDatabase } from "helpers/utils";
import http, { Server } from "http";
import ds from "orm/orm.config";
import supertest, { SuperAgentTest } from "supertest";
import { UsersService } from "modules/users/users.service";
import { AuthService } from "modules/auth/auth.service";
import { FarmService } from "../farms.service";
import { mockCreateFarmInputDto, mockCreateUserDto } from "helpers/test";

describe("FarmsController", () => {
  let app: Express;
  let agent: SuperAgentTest;
  let server: Server;

  let usersService: UsersService;

  beforeAll(() => {
    app = setupServer();
    server = http.createServer(app).listen(config.APP_PORT);
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(async () => {
    await ds.initialize();
    agent = supertest.agent(app);

    usersService = new UsersService();
  });

  afterEach(async () => {
    await disconnectAndClearDatabase(ds);
  });

  describe("POST /farms", () => {
    it("should create new farm", async () => {
      const userDto = mockCreateUserDto();
      const user = await usersService.createUser(userDto);
      const farmDto = mockCreateFarmInputDto(user.id);
      const { token } = await new AuthService().login({ email: userDto.email, password: userDto.password });
      const res = await agent.post("/api/farms").set("Authorization", `Bearer ${token}`).send(farmDto);

      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        address: expect.any(String),
        size: expect.any(Number),
        yield: expect.any(Number),
        lat: expect.any(Number),
        long: expect.any(Number),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  })

  describe("GET /farms", () => {
    it("should get list of farms", async () => {
      const userDto = mockCreateUserDto();
      const user = await usersService.createUser(userDto);

      await new FarmService().createFarm(mockCreateFarmInputDto(user.id));

      const user2Dto = mockCreateUserDto();
      await usersService.createUser(user2Dto);

      const authService = new AuthService();
      const { token: user2Token } = await authService.login({ email: user2Dto.email, password: user2Dto.password });


      const res = await agent.get("/api/farms").set("Authorization", `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject([
        {
          id: expect.any(String),
          name: expect.any(String),
          address: expect.any(String),
          owner: expect.any(String),
          size: expect.any(Number),
          yield: expect.any(Number),
          drivingDistance: expect.any(Number),
        },
      ]);
    });
  });

  describe("DELETE /farms/:farmId", () => {
    it("should delete owned farm", async () => {
      const userDto = mockCreateUserDto();
      const user = await usersService.createUser(userDto);
      const { token } = await new AuthService().login({ email: userDto.email, password: userDto.password });
      const farm = await new FarmService().createFarm(mockCreateFarmInputDto(user.id))
      const res = await agent.delete(`/api/farms/${farm.id}`).set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        deleted: true
      });
    });

    it("should return 403 when deleting not owned farm", async () => {
      const userDto = mockCreateUserDto();
      const user = await usersService.createUser(userDto);
      const user2Dto = mockCreateUserDto()
      const authService = new AuthService();
      await usersService.createUser(user2Dto);
      await authService.login({ email: userDto.email, password: userDto.password });
      const { token: user2Token } = await authService.login({ email: user2Dto.email, password: user2Dto.password });
      const farm = await new FarmService().createFarm(mockCreateFarmInputDto(user.id))
      const res = await agent.delete(`/api/farms/${farm.id}`).set("Authorization", `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(403);
    });

    it("should return 404 when deleting not existing farm", async () => {
      const userDto = mockCreateUserDto();
      const user = await usersService.createUser(userDto);
      const authService = new AuthService();
      const {token} = await authService.login({ email: userDto.email, password: userDto.password });
      await new FarmService().createFarm(mockCreateFarmInputDto(user.id));
      const res = await agent.delete(`/api/farms/${user.id}`).set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
