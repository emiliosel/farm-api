import * as bcrypt from "bcrypt";
import config from "config/config";
import { UnprocessableEntityError } from "errors/errors";
import { DeepPartial, FindOptionsWhere, Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import { User } from "./entities/user.entity";
import dataSource from "orm/orm.config";
import { GoogleApiErrorsEnum, findLatLngFromAddress } from "helpers/geo.service";

export class UsersService {
  private readonly usersRepository: Repository<User>;

  constructor() {
    this.usersRepository = dataSource.getRepository(User);
  }

  public async createUser(data: CreateUserDto): Promise<User> {
    const { email, password, address } = data;

    const [error, result] = await findLatLngFromAddress(address);

    if (error === GoogleApiErrorsEnum.ApiError) {
      throw new Error("Some api error occured")
    }

    if (error === GoogleApiErrorsEnum.DataNotFound) {
      throw new UnprocessableEntityError("Could not find latitude and longitude for the address given");
    }

    const {lat, lng: long} = result;

    const existingUser = await this.findOneBy({ email: email });

    if (existingUser) throw new UnprocessableEntityError("A user for the email already exists");

    const hashedPassword = await this.hashPassword(password);

    const userData: DeepPartial<User> = { email, hashedPassword, address, lat, long };

    const newUser = this.usersRepository.create(userData);

    return this.usersRepository.save(newUser);
  }

  public async findOneBy(param: FindOptionsWhere<User>): Promise<User | null> {
    return this.usersRepository.findOneBy({ ...param });
  }

  private async hashPassword(password: string, salt_rounds = config.SALT_ROUNDS): Promise<string> {
    const salt = await bcrypt.genSalt(salt_rounds);
    return bcrypt.hash(password, salt);
  }
}
