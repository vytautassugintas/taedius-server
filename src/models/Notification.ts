import mongoose from "mongoose";
import { UserModel } from "./User";

export enum NotificationType {
  GroupInvite = "GroupInvite"
}

export type NotificationModel = mongoose.Document & {
  type: NotificationType;
  receiver: UserModel;
  isSeen: boolean;
  actionId: string
};

const notificationSchema = new mongoose.Schema(
  {
    type: String,
    isSeen: Boolean,
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actionId: { type: mongoose.Schema.Types.ObjectId, ref: "Action" }
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
