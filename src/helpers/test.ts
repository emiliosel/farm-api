import { CreateUserDto } from "modules/users/dto/create-user.dto";
import { randomUsAddresses } from "../../data/us-addresses";
import { CreateFarmInputDto } from "modules/farms/dto/create-farm.dto";

export const random = {
  int: (min = 10, max = 150) => Math.floor(Math.random() * (max - min) + min),
  float: (min = 10, max = 150) => (Math.random() * (max - min) + min),
  email: () => `user-${Math.random().toString(36).substring(7)}@test.com`,
  name: () => `Farm ${Math.random().toString(36).substring(7)}`,
  size: (min = 20, max = 500) => Math.random() * (max - min) + min, // Generate a random size between 20 and max
  yield: (min = 20, max = 500) => Math.random() * (max - min) + min,
  address() {
    const location = randomUsAddresses.addresses[random.int()];
    return `${location.address1}, ${location.city}, ${location.state} ${location.postalCode}`;
  },
};

export const mockCreateUserDto = (): CreateUserDto => ({
  email: random.email(),
  password: "password",
  address: random.address(),
});

export const mockCreateFarmInputDto = (userId: string): CreateFarmInputDto => ({
  name: random.name(),
  userId,
  size: random.size(),
  address: random.address(),
  yield: random.yield(),
});
