import { Request, Response, NextFunction } from "express";
import { WriteError } from "mongodb";
import { IVerifyOptions } from "passport-local";
import { default as User, UserModel } from "../models/User";

export let updateProfile = (req: Request, res: Response, next: NextFunction) => {
  User.findById(req.user.id, (err, user: UserModel) => {
    if (err) return next(err);
      user.profile.name = req.body.name || "";
      user.save((err: WriteError) => {
        if (err) return next(err);
          res.json({success: { msg: "Profile information has been updated." }});
        });
    });
};

export function getCurrentUser(req: Request, res: Response, next: NextFunction): Response {
  return res.json({
    id: req.user._id,
    email: req.user.email,
    profile: req.user.profile
  });
}