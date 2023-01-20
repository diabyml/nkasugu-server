
import AppDataSource from '../../data-source';
import { City } from '../../entities/city.entity';

export const CityRepository = AppDataSource.getRepository(City).extend({
    // custom methods here
});