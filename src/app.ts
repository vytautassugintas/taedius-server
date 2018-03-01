import express from "express";
import { Request, Response, NextFunction } from "express";
import session from "express-session";
import expressValidator from "express-validator";
import mongo from "connect-mongo";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import passport from "passport";
import passportLocal from "passport-local";
import request from "request";

import { default as User } from "./models/User";
import * as authController from "./controllers/auth";

const MONGO_URL = "mongodb://localhost/test";

const LocalStrategy = passportLocal.Strategy;
const MongoStore = mongo(session);
const app = express();

mongoose.connect(MONGO_URL);

app.use(expressValidator());
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: "secret",
    store: new MongoStore({
      url: MONGO_URL,
      autoReconnect: true
    })
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser<any, any>((user, done) => {
  done(undefined, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    User.findOne({ email: email.toLowerCase() }, (err, user: any) => {
      if (err) return done(err);
      if (!user) return done(undefined, false, { message: `Email ${email} not found.` });

      user.comparePassword(password, (err: Error, isMatch: boolean) => {
        if (err) return done(err);
        if (isMatch) return done(undefined, user);
        return done(undefined, false, {
          message: "Invalid email or password."
        });
      });
    });
  })
);

export let isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.json({errors: [{msg: "unauthorized"}]});
};

app.get("/", (req: any, res: any) => res.send("Hello world!"));
app.post("/signup", authController.signup);
app.post("/login", authController.login);
app.get("/logout", authController.logout);
app.get("/account", isAuthenticated, authController.getCurrentUser);

app.listen(3000, () => console.log("Example app listening on port 3000!"));

export default app;
