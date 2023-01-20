import DataLoader from "dataloader";
import { City } from "../entities/city.entity";
import { CityRepository } from "../resolvers/location/city.repo";

export const createCityLoader = () =>
  new DataLoader<number, City>(async (cityIds) => {
    const repo = CityRepository;
    const cities = await repo.findByIds(cityIds as number[]);

    const cityMap: Record<number, City> = {};

    cities.forEach((c) => {
      cityMap[c.id] = c;
    });

    return cityIds.map((id) => cityMap[id]);
  });
