require("dotenv").config();
import "reflect-metadata";
import path from "path";
import http from "http";
import express, { Request, Response } from "express";

// apollo server
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
// for session, go back to odl playground
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { graphqlUploadExpress } from "graphql-upload";

import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import { COOKIE_NAME, __prod__ } from "./constants";

import AppDataSource from "./data-source";
import MyContext from "./utils/MyContext";
import { createUserLoader } from "./utils/ createUserLoader";
import { createCityLoader } from "./utils/createCityLoader";
import { createCountryLoader } from "./utils/createCountryLoader";

// so req.session works properly
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

// cloudnary congig
import { v2 as cloudinary } from "cloudinary/";
const cloud_name = process.env.CLOUDINARY_NAME as any;
const api_key = process.env.CLOUDINARY_API_KEY as any;
const api_secret = process.env.CLOUDNARY_API_SECRET as any;

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

const PORT = process.env.PORT || 4000;
const app = express();

// session stuff
const RedisStore = connectRedis(session);
const redis = new Redis(process.env.REDIS_URL as string);
// const redis = new Redis();
app.set("trust proxy", 1);
app.use(
  cors({
    // origin: true,
    // origin: "http://localhost:3000",
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(
  session({
    name: COOKIE_NAME,
    store: new RedisStore({
      client: redis,
      disableTouch: true,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
      httpOnly: true,
      sameSite: "lax", // csrf
      secure: __prod__, // cookie only works in https
      domain: __prod__ ? ".nkasugu.com" : undefined,
    },
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET as string,
    resave: false,
  })
);

app.get("/", (_: Request, res: Response) =>
  res.send(`<h1>Nkasugu 2023, diabyml</h1>`)
);

const server = http.createServer(app);

async function startServer() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();

  const schema = await buildSchema({
    resolvers: [path.join(__dirname, "**/*.resolver.js")],
    validate: false,
  });

  //   // console.log(schema);

  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }): MyContext => ({
      req,
      res,
      redis: redis,
      userLoader: createUserLoader(),
      cityLoader: createCityLoader(),
      countryLoader: createCountryLoader(),
    }),
    // enable this to get caching work properly
    plugins: [
      ApolloServerPluginLandingPageGraphQLPlayground({
        // options
      }),
    ],
  });

  await apolloServer.start();
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));
  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  server.listen(PORT, () => {
    console.log(`Listening on  http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((err) => console.log("main server err: ", err));
