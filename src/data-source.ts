import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "../config";

const AppDataSource = new DataSource(config);

export default AppDataSource;
