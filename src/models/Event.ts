import mongoose from "mongoose";
import { UserModel } from "./User";

export enum ActionType {
  Accept = "Accept",
  Decline = "Decline"
}

export enum EventType {
  GroupInvite = "GroupInvite"
}

export type EventModel = mongoose.Document & {
  type: EventType;
  receiver: UserModel;
  sender?: UserModel;
  actionLink: string;
  possibleActions: ActionType[];
};

const eventSchema = new mongoose.Schema(
  {
    type: String,
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actionLink: String,
    possibleActions: [String]
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

export default Event;
