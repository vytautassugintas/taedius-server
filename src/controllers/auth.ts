import { Request, Response, NextFunction } from "express";
import { default as User, UserModel } from "../models/User";

const request = require("express-validator");

export function signup(req: Request, res: Response, next: NextFunction): Response {
  req.assert("email", "Email is not valid").isEmail();
  req.assert("password", "Password must be at least 4 characters long").len({ min: 4 });
  req.sanitize("email").normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) return res.json({errors: errors});

  const user = new User({
    email: req.body.email,
    password: req.body.password
  });

  User.findOne({ email: req.body.email }, (err, existingUser) => {
    if (err) return next(err);
    if (existingUser) return res.json({errors: [{ msg: "user exists" }]});

    user.save(err => {
      if (err) return next(err);
      return res.json({ msg: "success" });
    });
  });
}
