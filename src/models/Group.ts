import mongoose from "mongoose";
import { UserModel } from "./User";
import { TaskModel } from "./Task";

export type GroupModel = mongoose.Document & {
  name: string;
  createdBy: UserModel,
  users: UserModel[];
  tasks: TaskModel[]
};

const groupSchema = new mongoose.Schema({
  name: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
}, { timestamps: true });

const Group = mongoose.model("Group", groupSchema);

export default Group;