import { GroupModel } from "./Group";
import { Document, Schema, Model, Error, model } from "mongoose";
import bcrypt from "bcrypt-nodejs";
import crypto from "crypto";

export interface UserModel extends Document {
  email: string;
  password: string;
  groups: GroupModel[];

  profile: {
    name: string;
  };
}

const userSchema = new Schema(
  {
    email: { type: String, unique: true },
    password: String,
    groups: [{ type: Schema.Types.ObjectId, ref: "Group" }],

    profile: {
      name: String,
    }
  },
  { timestamps: true }
);

userSchema.pre("save", function save(next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, undefined, (err: Error, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(
  candidatePassword: string,
  cb: (err: any, isMatch: any) => {}
) {
  bcrypt.compare(
    candidatePassword,
    this.password,
    (err: Error, isMatch: boolean) => {
      cb(err, isMatch);
    }
  );
};

const User = model<UserModel>("User", userSchema);

export default User;
