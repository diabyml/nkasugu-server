import axios from "axios";
import { Arg, Mutation, Query, Resolver } from "type-graphql";
import AppDataSource from "../../data-source";
import { City } from "../../entities/city.entity";
import { Country } from "../../entities/country.entity";
import { CountryRepository } from "./country.repo";
import { LocationResponse } from "./location.types";

@Resolver()
export class LocationResolver {
  @Query(() => LocationResponse)
  async userLocation(
    @Arg("countryCode", () => String) countryCode: string
  ): Promise<LocationResponse> {
    const countryRepo = CountryRepository;
    // let userIp = "";
    // const headers = req.headers["x-forwarded-for"] as any;
    // const clientIP = headers?.split(",").shift() || req.socket?.remoteAddress;

    // console.log("Client ip address:", clientIP);
    // userIp = clientIP;

    // console.log("userIp:", userIp);

    // if (clientIP === "::1") {
    //   console.log("user is on localhost");
    //   userIp = "41.221.189.237";
    // }

    // https://geolocation-db.com/json/apikey/41.221.189.237
    // const url = `https://geolocation-db.com/json/${process.env.GEOLOCATION_DB_API_KEY}/${userIp}`;
    // const geoData = await axios.get(url);
    // let country = null;

    // const countryRequest = await axios.get("https://api.country.is");
    // console.log("country request data:", countryRequest.data);
    // const countryCode = countryRequest.data.country;
    // // const ipAddress = countryRequest.data.ip;
    // console.log("coutry code:", countryRequest.data.country);

    //
    //  TODO: Before getting the country details, i should check first if that exists in db
    // check given the country code
    //

    const countryInDb = await countryRepo.findOne({
      where: { code: countryCode },
      relations: {
        cities: true,
      },
    });
    console.log("countryInDB:", countryInDb);

    if (countryInDb) {
      return {
        country: countryInDb,
      };
    }

    // country does not exists in db

    const locationDetails = await axios.get(
      `https://restcountries.com/v3.1/alpha/${countryCode}`
      // `https://restcountries.com/v3.1/name/${"Mali"}`
    );

    // console.log("location details:", locationDetails);

    if (locationDetails.status !== 200) {
      // error occured
      return {
        error: "Détails du pays introuvables",
      };
    }

    const data = locationDetails.data[0];

    console.log("data:", data);

    const countryInFr = data.name.nativeName?.fra?.common;
    const name = data.name.common;
    const phoneCode = data.idd.root + data.idd.suffixes[0];
    const flag = data.flags.png;

    // console.log("common:", countryInFr);

    // we got the user country
    const citiesRequest = await axios.post(
      "https://countriesnow.space/api/v0.1/countries/cities",
      {
        country: data.name.common,
      }
    );

    if (citiesRequest.status !== 200) {
      //error: occured
      return {
        error: "Villes non localisé",
      };
    }

    const cities = citiesRequest.data.data;

    console.log("cities:", cities);

    // save country, and cities in db
    let savedCountry: any = null;
    let savedCities: any = null;

    await AppDataSource.transaction(async (manager) => {
      const country = manager.create(Country, {
        code: countryCode,
        // name: countryInFr,
        name: countryInFr || name,
        flag: flag,
        phoneCode: phoneCode,
      });

      savedCountry = await manager.save(country);

      const cityEntities = cities.map((city: string) => {
        return manager.create(City, { name: city, country: savedCountry });
      });

      savedCities = await manager.save(cityEntities);
    });

    savedCountry.cities = savedCities;

    return {
      country: savedCountry,
    };
  }
  @Mutation(() => Boolean)
  async loadCountry(
    @Arg("countryCode", () => String) countryCode: string
  ): Promise<boolean> {
    const country = await CountryRepository.findOne({
      where: { code: countryCode },
    });

    if (country) {
      return true;
    }

    const locationDetails = await axios.get(`${countryCode}`);

    if (locationDetails.status !== 200) {
      // error occured
      return false;
    }

    const data = locationDetails.data[0];
    const countryInFr = data.name.nativeName.fra.common;
    const phoneCode = data.idd.root + data.idd.suffixes[0];
    const flag = data.flags.png;

    // we got the user country
    const citiesRequest = await axios.post(
      "https://countriesnow.space/api/v0.1/countries/cities",
      {
        country: data.name.common,
      }
    );

    if (citiesRequest.status !== 200) {
      //error: occured
      return false;
    }

    const cities = citiesRequest.data.data;

    await AppDataSource.transaction(async (manager) => {
      const country = manager.create(Country, {
        code: countryCode,
        name: countryInFr,
        flag: flag,
        phoneCode: phoneCode,
      });

      const savedCountry = await manager.save(country);

      const cityEntities = cities.map((city: string) => {
        return manager.create(City, { name: city, country: savedCountry });
      });

      await manager.save(cityEntities);
    });

    return true;
  }
}
