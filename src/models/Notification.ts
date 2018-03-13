import mongoose from "mongoose";
import { UserModel } from "./User";

export enum NotificationType {
  GroupInvite = "GroupInvite"
}

export type NotificationModel = mongoose.Document & {
  type: NotificationType;
  receiver: UserModel;
  isSeen: boolean;
};

const notificationSchema = new mongoose.Schema(
  {
    type: String,
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isSeen: Boolean
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
