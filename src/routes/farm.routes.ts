import { RequestHandler, Router } from "express";
import authenticate from "middlewares/authentication.middleware";
import { FarmsController } from "modules/farms/farms.controller";

const router = Router();
const farmController = new FarmsController();

router.post("/", authenticate, farmController.create.bind(farmController) as RequestHandler);
router.get("/", authenticate, farmController.findFarms.bind(farmController) as RequestHandler);

export default router;
