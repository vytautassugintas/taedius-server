import { UserModel } from "./User";
import mongoose from "mongoose";

export type GroupModel = mongoose.Document & {
  name: string;
  createdBy: UserModel,
  users: [UserModel];
};

const groupSchema = new mongoose.Schema({
  name: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

const Group = mongoose.model("Group", groupSchema);

export default Group;