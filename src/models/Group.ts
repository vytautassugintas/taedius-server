import { Document, Schema, Model, model } from "mongoose";
import { UserModel } from "./User";
import { TaskModel } from "./Task";

export interface GroupModel extends Document {
  name: string;
  createdBy: UserModel;
  users: UserModel[];
  tasks: TaskModel[];

  findById: this;
}

const groupSchema = new Schema({
  name: String,
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  users: [{ type: Schema.Types.ObjectId, ref: "User" }],
  tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
}, { timestamps: true });

const Group = model<GroupModel>("Group", groupSchema);

export default Group;
