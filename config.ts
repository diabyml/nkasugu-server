import { DataSourceOptions } from "typeorm";
import path from "path";

export const config: DataSourceOptions = {
  // name: "default",
  // host: "localhost",
  // port: 5432,
  // username: "postgres",
  // password: "Webdevwithdiaby@2021",
  // database: "nkasugu",
  type: "postgres",
  url: process.env.DATABASE_URL as string,
  entities: [path.join(__dirname, "/**/*.entity.{js,ts}")], //old: dist/src/entities/*.js,   --> __dirname + '/../**/*.entity.{js,ts}'
  migrations: ["dist/src/migration/*.js"],
  synchronize: false,
  logging: true,
} as any;
