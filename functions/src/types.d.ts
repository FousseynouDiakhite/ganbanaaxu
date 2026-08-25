import {Request as ExpressRequest} from "express";
import {AuthObject} from "@clerk/clerk-sdk-node";

declare module "express-serve-static-core" {
  interface Request extends ExpressRequest {
    auth?: AuthObject;
    file?: Express.Multer.File;
  }
}
