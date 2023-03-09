import { NextFunction, Request, Response } from "express";
import { FarmService } from "./farms.service";
import { CreateFarmInputDto } from "./dto/create-farm.dto";
import { FindFarmsInputDto } from "./dto/find-farms.dto";
import { DeleteFarmInputDto } from "./dto/delete-farm.dto";

export class FarmsController {
  private readonly farmsService: FarmService;

  constructor() {
    this.farmsService = new FarmService();
  }

  public async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const farm = await this.farmsService.createFarm({
        userId,
        ...req.body,
      } as CreateFarmInputDto);

      res.status(201).send(farm);
    } catch (error) {
      next(error);
    }
  }

  public async findFarms(req: Request, res: Response, next: NextFunction) {
    try {
      const farm = await this.farmsService.findMany({
        userId: req.user?.id,
        ...req.query,
      } as FindFarmsInputDto);

      res.status(201).send(farm);
    } catch (error) {
      next(error);
    }
  }

  public async deleteFarm(req: Request, res: Response, next: NextFunction) {
    try {
      const farm = await this.farmsService.deleteFarm({
        userId: req.user?.id,
        farmId: req.params.farmId,
      } as DeleteFarmInputDto);

      res.status(201).send(farm);
    } catch (error) {
      next(error);
    }
  }
}
