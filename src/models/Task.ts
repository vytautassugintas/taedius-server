import mongoose from "mongoose";
import { UserModel } from "./User";

export enum TaskType {
  None = "None",
  InReview = "InReview",
  Completed = "Completed"
}

export type TaskModel = mongoose.Document & {
  title: string;
  points: number;
  assignee: UserModel;
  createdBy: UserModel;
  status: TaskType;
};

const taskSchema = new mongoose.Schema(
  {
    title: String,
    points: Number,
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: String
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
