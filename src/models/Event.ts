import { Document, Schema, Model, model } from "mongoose";
import { UserModel } from "./User";

export enum ActionType {
  Accept = "Accept",
  Decline = "Decline"
}

export enum EventType {
  GroupInvite = "GroupInvite",
  TaskApproval = "TaskApproval"
}

export interface EventModel extends Document {
  type: EventType;
  associatedId: string;
  receiver: UserModel;
  sender?: UserModel;
  actionLink: string;
  possibleActions: ActionType[];
}

const eventSchema = new Schema(
  {
    type: String,
    associatedId: String,
    receiver: { type: Schema.Types.ObjectId, ref: "User" },
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    actionLink: String,
    possibleActions: [String]
  },
  { timestamps: true }
);

const Event = model<EventModel>("Event", eventSchema);

export default Event;
