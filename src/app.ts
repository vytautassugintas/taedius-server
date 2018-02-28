import express from 'express';
import session from 'express-session';
import expressValidator from 'express-validator';
import mongo from 'connect-mongo';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';

import passport from 'passport';
import * as passportConfig from './config/passport';

import * as authController from './controllers/auth';

const MongoStore = mongo(session);

const app = express();

const MONGO_URL = 'mongodb://localhost/test';

mongoose.connect(MONGO_URL);

app.use(expressValidator());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'secret',
    store: new MongoStore({
      url: MONGO_URL,
      autoReconnect: true
    })
  }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    // After successful login, redirect back to the intended page
    if (!req.user &&
      req.path !== '/login' &&
      req.path !== '/signup' &&
      !req.path.match(/^\/auth/) &&
      !req.path.match(/\./)) {
      req.session.returnTo = req.path;
    } else if (req.user &&
      req.path == '/account') {
      req.session.returnTo = req.path;
    }
    next();
  });

app.get('/', (req: any, res: any) => res.send('Hello world!'));

app.post('/signup', authController.signup);

app.listen(3000, () => console.log('Example app listening on port 3000!'));

export default app;