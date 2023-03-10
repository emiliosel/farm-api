import { UsersService } from "modules/users/users.service";
import { FarmService } from "modules/farms/farms.service";
import dataSource from "orm/orm.config";
import { randomUsAddresses } from "../data/us-addresses";

interface FarmData {
  address: string;
  name: string;
  size: number;
  yield: number;
}

function generateFarmData(num: number = 120): FarmData[] {
  const farmData: FarmData[] = [];
  num = num > 0 && num < 250 ? num : 120
  for (const location of randomUsAddresses.addresses.slice(0, num)) {
    const name = Math.random().toString(36).substring(7); // Generate a random farm name
    const size = Math.random() * (500 - 20) + 20; // Generate a random size between 20 and 500
    const yieldFarm = Math.random() * (500 - 20) + 20; // Generate a random yield between 20 and 500

    farmData.push({
      address: `${location.address1}, ${location.city}, ${location.state} ${location.postalCode}`,
      name, 
      size,
      yield: yieldFarm,
    });
  }

  return farmData;
}

function generateUsers({num = 3, prefix = "user"}) {
  return Array.from({length: num}).map((_, i) => {
    const location = randomUsAddresses.addresses[121 + i];
    return {
      email: `${prefix}-${i}@gmail.com`,
      password: `123`,
      address: `${location.address1}, ${location.city}, ${location.state} ${location.postalCode}`
    }
  })
}

async function main({users: usersNum = 4, farms: farmsPerUser = 40, emailPrefix = "user"}) {
  await dataSource.initialize();

  const farms = generateFarmData(usersNum * farmsPerUser);

  const users = generateUsers({num: usersNum, prefix: emailPrefix});

  const userService = new UsersService();

  const farmService = new FarmService();

  console.log(`[Seeding] Creating ${usersNum} Users...`)
  console.log(`[Seeding] Creating ${usersNum * farmsPerUser} Farms... `);

  await Promise.all(
    users.map(async (user, i) => {
      const userCreated = await userService.createUser({
        email: user.email,
        address: user.address,
        password: user.password
      });

      console.log(`[Seeding] Created User: `, user);

      const start = (i * farmsPerUser);
      const end = (i * farmsPerUser + farmsPerUser);

      await Promise.all(
        farms.slice(start, end).map(farm =>
          farmService.createFarm({
            userId: userCreated.id,
            ...farm
          }),
        ),
      );
    })
  )
}

main({
  users: 4,
  farms: 40,
  emailPrefix: "farmer"
})
