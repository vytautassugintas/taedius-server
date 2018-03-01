import { Request, Response, NextFunction } from 'express';
import { default as User, UserModel } from '../models/User';

const request = require('express-validator');

export let signup = (req: Request, res: Response, next: NextFunction) => {
    // TODO: validate request

    const user = new User({
      email: req.body.email,
      password: req.body.password
    });

    User.findOne({ email: req.body.email }, (err, existingUser) => {
      if (err) { return next(err); }
      if (existingUser) {
        return res.json({message: 'user exists'});
      }

      user.save((err) => {
        if (err) { return next(err); }
          return res.json({message: 'success'});
      });
    });
  };