
import AppDataSource from '../../data-source';
import { Country } from '../../entities/country.entity';

export const CountryRepository = AppDataSource.getRepository(Country).extend({
    // custom methods here
});