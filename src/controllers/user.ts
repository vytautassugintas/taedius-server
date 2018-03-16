import { Request, Response, NextFunction } from "express";
import { WriteError } from "mongodb";
import { default as User, UserModel } from "../models/User";
import { default as Group, GroupModel } from "../models/Group";
import { default as Notification, NotificationModel, NotificationType } from "../models/Notification";
import { default as Event, EventModel, EventType, ActionType } from "../models/Event";

export function updateProfile(req: Request, res: Response, next: NextFunction) {
  User.findById(req.user.id, (err, user: UserModel) => {
    if (err) return next(err);
      user.profile.name = req.body.name || "";
      user.save((err: WriteError) => {
        if (err) return next(err);
        res.json({success: { msg: "Profile information has been updated." }});
        });
    });
}

export function getProfile(req: Request, res: Response, next: NextFunction): Response {
  return res.json({
    id: req.user._id,
    email: req.user.email,
    groups: req.user.groups,
    profile: req.user.profile
  });
}

export function createGroup(req: Request, res: Response, next: NextFunction) {
  req.assert("name", "Name cannot be blank").notEmpty();

  const errors = req.validationErrors();
  if (errors) return res.json({errors: errors});

  const group = new Group({
    name: req.body.name,
    users: [req.user._id],
    createdBy: req.user._id
  });

  group.save((err, group: GroupModel) => {
    if (err) return next(err);
    User.findById(req.user._id, (err, user: UserModel) => {
      if (err) return next(err);
      user.groups.push(group._id);
      user.save(err => {
        if (err) return next(err);
        return res.json({ msg: "success" });
      });
    });
  });
}

export function getGroups(req: Request, res: Response, next: NextFunction) {
  User.findById(req.user._id)
    .populate("groups")
    .exec((error, user: UserModel) => {
      return res.json(user.groups);
    });
}

export async function inviteToGroup(req: Request, res: Response, next: NextFunction) {
  req.assert("email", "Email is not valid").isEmail();
  req.assert("email", "Email cannot be blank").notEmpty();
  req.assert("groupId", "Group id cannot be blank").notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    return res.status(400).json({errors: errors});
  }

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(400).json({errors: [{ msg: "user doesn't exists" }]});
  }

  const group = await Group.findById(req.body.groupId).exec();

  const notGroupOwner = !req.user._id.equals(group.createdBy);

  if (notGroupOwner) {
    return res.json({errors: [{ msg: "can't add, you are not the owner of this group" }]});
  }

  const userAlreadyExists = group.users.filter(id => id.equals(user._id));

  if (userAlreadyExists.length) {
    return res.json({errors: [{ msg: "user already in group" }]});
  }

  const evnt = await Event.findOne({receiver: user._id, associatedId: req.body.groupId}).exec();

  if (evnt) return res.json({errors: [{ msg: "user already in invited" }]});

  const event = new Event({
    type: EventType.GroupInvite,
    associatedId: req.body.groupId,
    receiver: user._id,
    sender: req.user._id,
    possibleActions: [ActionType.Accept, ActionType.Decline]
  });

  const eventToUpdate = await event.save();

  eventToUpdate.actionLink = createGroupInviteLink(group._id, eventToUpdate._id);

  await eventToUpdate.save();

  return res.json({ msg: "success" });
}

export async function acceptGroupInvite(req: Request, res: Response, next: NextFunction) {
  const event = await Event.findById(req.params.eventId).exec();

  if (!event) {
    return res.json({errors: [{ msg: "you shouldn't be here" }]});
  }

  if (!event.receiver.equals(req.user._id)) {
    return res.json({errors: [{ msg: "you shouldn't be here" }]});
  }

  const group = await Group.findById(req.params.groupId).exec();

  group.users.push(req.user._id);

  await group.save();

  const user = await User.findById(req.user._id).exec();

  user.groups.push(group._id);

  await user.save();
  await event.remove();

  return res.json({ msg: "success" });
}

function createGroupInviteLink(groupId: string, eventId: string) {
  return "/account/" + groupId + "/" + eventId;
}
