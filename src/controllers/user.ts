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

export function inviteToGroup(req: Request, res: Response, next: NextFunction) {
  req.assert("email", "Email is not valid").isEmail();
  req.assert("email", "Email cannot be blank").notEmpty();
  req.assert("groupId", "Group id cannot be blank").notEmpty();

  const errors = req.validationErrors();
  if (errors) return res.json({errors: errors});

  User.findOne({ email: req.body.email }, (err, user: UserModel) => {
    if (err) return next(err);
    if (!user) return res.json({errors: [{ msg: "user doesn't exists" }]});

    Group.findById(req.body.groupId, (err, group: GroupModel) => {
      if (err) return next(err);

      const notGroupOwner = !req.user._id.equals(group.createdBy);
      if (notGroupOwner)
        return res.json({errors: [{ msg: "can't add, you are not the owner of this group" }]});

      const userAlreadyExists = group.users.filter(id => id.equals(user._id));
      if (userAlreadyExists.length)
        return res.json({errors: [{ msg: "user already in group" }]});

      Event.findOne({receiver: user._id, associatedId: req.body.groupId}, (err, evnt) => {
        if (evnt) return res.json({errors: [{ msg: "user already in invited" }]});
        const event = new Event({
          type: EventType.GroupInvite,
          associatedId: req.body.groupId,
          receiver: user._id,
          sender: req.user._id,
          possibleActions: [ActionType.Accept, ActionType.Decline]
        });

        event.save((err, savedEvent: EventModel) => {
          savedEvent.actionLink = createGroupInviteLink(group._id, savedEvent._id);
          savedEvent.save(err => {
            if (err) return next(err);
            const notif = new Notification({
              type: NotificationType.GroupInvite,
              receiver: user._id,
              isSeen: false
            });
            notif.save(err => {
              return res.json({ msg: "success" });
            });
          });
        });
      });
    });
  });
}

export function createGroupInviteLink(groupId: string, eventId: string) {
  return "/account/" + groupId + "/" + eventId;
}

export function acceptGroupInvite(req: Request, res: Response, next: NextFunction) {
  Event.findById(req.params.eventId, (err, event: EventModel) => {
    if (!event)
      return res.json({errors: [{ msg: "you shouldn't be here" }]});

    if (!event.receiver.equals(req.user._id))
      return res.json({errors: [{ msg: "you shouldn't be here" }]});

    Group.findById(req.params.groupId, (err, group: GroupModel) => {
      if (err) return next(err);

      group.users.push(req.user._id);
      group.save(err => {
        if (err) return next(err);
        User.findById(req.user._id, (err, userToUpdate: UserModel) => {
          userToUpdate.groups.push(group._id);
          userToUpdate.save(err => {
            if (err) return next(err);
            // TODO: create notif
            // TODO: delte event
            return res.json({ msg: "success" });
          });
        });
      });
    });
  });
}

export function getNotifications(req: Request, res: Response, next: NextFunction) {
  Notification.find({receiver: req.user._id}, (err, notifications) => {
    if (err) return next(err);
    return res.json(notifications);
  });
}

export function getEvents(req: Request, res: Response, next: NextFunction) {
  Event.find({receiver: req.user._id}, (err, event) => {
    if (err) return next(err);
    return res.json(event);
  });
}
