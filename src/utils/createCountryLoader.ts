import DataLoader from "dataloader";
import { Country } from "../entities/country.entity";
import { CountryRepository } from "../resolvers/location/country.repo";

export const createCountryLoader = () =>
  new DataLoader<number, Country>(async (ids) => {
    const repo = CountryRepository;
    const items = await repo.findByIds(ids as number[]);

    const map: Record<number, Country> = {};

    items.forEach((item) => {
      map[item.id] = item;
    });

    return ids.map((id) => map[id]);
  });
