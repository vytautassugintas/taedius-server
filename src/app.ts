import express from "express";
import { Request, Response, NextFunction } from "express";
import session from "express-session";
import expressValidator from "express-validator";
import cors from "cors";
import mongo from "connect-mongo";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import passport from "passport";
import passportLocal from "passport-local";
import request from "request";
import { createServer, Server } from "http";
import SocketIO from "socket.io";

import { default as User } from "./models/User";
import * as authController from "./controllers/auth";
import * as userController from "./controllers/user";
import * as groupController from "./controllers/group";
import * as eventController from "./controllers/event";

const LOCAL_MONGO_URL = "mongodb://localhost/taedius-test";
const MONGO_URL = process.env.MONGO_URL || LOCAL_MONGO_URL;
const PORT = process.env.PORT || 3000;

const LocalStrategy = passportLocal.Strategy;
const MongoStore = mongo(session);
const app = express();
const server = createServer(app);
const io = SocketIO(server);

const sessionMiddleware = session({
  resave: true,
  saveUninitialized: true,
  secret: "secret",
  store: new MongoStore({
    url: MONGO_URL,
    autoReconnect: true
  })
});

mongoose.connect(MONGO_URL);

app.use(expressValidator());
app.use(sessionMiddleware);
app.use(cors({credentials: true, origin: true}));
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
    res.status(401).json({errors: [{msg: "unauthorized"}]});
};

app.get("/", (req: any, res: any) => res.send("Hello world!"));
app.post("/signup", authController.signup);
app.post("/login", authController.login);
app.get("/logout", authController.logout);
app.get("/account", isAuthenticated, userController.getProfile);
app.post("/account/update", isAuthenticated, userController.updateProfile);
app.post("/account/group", isAuthenticated, userController.createGroup);
app.post("/account/group/invite", isAuthenticated, userController.inviteToGroup);
app.post("/account/:groupId/:eventId/accept", isAuthenticated, userController.acceptGroupInvite);
app.get("/account/group", isAuthenticated, userController.getGroups);
app.get("/account/events", isAuthenticated, eventController.getCurrentUserEvents);
app.delete("/group/:groupId", isAuthenticated, groupController.removeGroup);
app.post("/group/task/add", isAuthenticated, groupController.addTask);
app.post("/group/task/remove", isAuthenticated, groupController.removeTask);
app.post("/group/task/assign", isAuthenticated, groupController.assign);
app.post("/group/task/request", isAuthenticated, groupController.askForApproval);
app.get("/group/:groupId/tasks", isAuthenticated, groupController.getTasks);
app.get("/group/:groupId", isAuthenticated, groupController.getGroup);
app.get("/group/:groupId/assign/random", isAuthenticated, groupController.randomAssign);

io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res, next);
});

io.on("connection", socket => {
  if (socket.request.session && socket.request.session.passport) {
    console.log("a user connected, user ID is", socket.request.session.passport.user);
  }
});

io.on("connect", socket => {
  console.log("Connected client on port %s.", PORT);

  socket.on("event", (m: any) => {
      console.log("[server](message): %s", JSON.stringify(m));
      io.emit("event", m);
  });

  socket.on("disconnect", () => {
      console.log("Client disconnected");
  });
});

server.listen(PORT, () => console.log("Example app listening on port " + PORT + "::::" + MONGO_URL));

export default app;
