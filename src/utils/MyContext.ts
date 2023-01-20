import { Request, Response } from "express";
import { Redis } from "ioredis";
import { createUserLoader } from "./ createUserLoader";
import { createCityLoader } from "./createCityLoader";
import { createCountryLoader } from "./createCountryLoader";
// import { createUserLoader } from "./createUserLoader";

interface MyContext {
  res: Response;
  req: Request;
  redis: Redis;
  userLoader: ReturnType<typeof createUserLoader>;
  cityLoader: ReturnType<typeof createCityLoader>;
  countryLoader: ReturnType<typeof createCountryLoader>;
}

export default MyContext;
