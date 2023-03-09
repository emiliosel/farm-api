import { Request, Response, NextFunction } from "express";
import { AuthService } from "modules/auth/auth.service";
import { TokenUser } from "modules/auth/dto/auth-user.dto";

declare global {
  namespace Express {
    interface Request {
      user?: TokenUser;
    }
  }
}

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).send({ error: "Authentication required." });
  }

  try {
    const authService = new AuthService();
    req.user = authService.verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).send({ error: "Invalid token." });
  }
};

export default authenticate;
