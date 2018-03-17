import { Request, Response, NextFunction } from "express";
import { WriteError } from "mongodb";
import { default as User, UserModel } from "../models/User";
import { default as Group, GroupModel } from "../models/Group";
import { default as Task, TaskModel, TaskType } from "../models/Task";
import { default as Event, EventModel, EventType, ActionType } from "../models/Event";

export async function randomAssign(req: Request, res: Response, next: NextFunction) {
  const group = await Group.findById(req.params.groupId).exec();
  if (!group) return res.json({errors: [{msg: "group doesn't exists"}]});

  const members = group.users;

  await group.populate({path: "tasks"}).execPopulate();

  group.tasks.forEach(async function(task) {
      task.assignee = group.users[Math.floor(Math.random() * Math.floor(group.users.length))];
      await task.save();
  });

  return res.json(group);
}

export function removeGroup(req: Request, res: Response, next: NextFunction) {
  Group.findByIdAndRemove(req.params.groupId, err => {
    if (err) next(err);
    res.json({msg: "success"});
  });
}

export function getTasks(req: Request, res: Response, next: NextFunction) {
  Group.findById(req.params.groupId)
    .populate({
      path: "tasks",
      populate: {
        path: "createdBy assignee",
        model: "User"
      }
    }).exec((err, group: GroupModel) => {
      if (!group) return res.json({errors: [{msg: "group doesn't exists"}]});
      return res.json(group);
    });
}

export function addTask(req: Request, res: Response, next: NextFunction) {
  req.assert("title", "Name cannot be blank").notEmpty();
  req.assert("points", "Points cannot be blank").notEmpty();
  req.assert("groupId", "Group id cannot be blank").notEmpty();

  const errors = req.validationErrors();
  if (errors) return res.json({errors: errors});

  const task = new Task({
    title: req.body.title,
    points: req.body.points,
    assignee: req.body.assigneeId || undefined,
    createdBy: req.user._id,
    status: TaskType.None
  });

  Group.findById(req.body.groupId, (err, group: GroupModel) => {
    task.save((err) => {
      if (err) next(err);
      group.tasks.push(task._id);
      group.save((err) => {
        if (err) next(err);
        res.json({msg: "success"});
      });
    });
  });
}

export function removeTask(req: Request, res: Response, next: NextFunction) {
  req.assert("taskId", "Task id cannot be blank").notEmpty();
  req.assert("groupId", "Group id cannot be blank").notEmpty();

  const errors = req.validationErrors();
  if (errors) return res.json({errors: errors});

  Group.findById(req.body.groupId, (err, group: GroupModel) => {
    group.tasks = group.tasks.filter(id => !id.equals(req.body.taskId));
    group.save(err => {
      if (err) next(err);
      Task.findByIdAndRemove(req.body.taskId, err => {
        if (err) next(err);
        res.json({msg: "success"});
      });
    });
  });
}

export async function askForApproval(req: Request, res: Response, next: NextFunction) {
  req.assert("taskId", "Task id cannot be blank").notEmpty();
  req.assert("groupId", "Group id cannot be blank").notEmpty();

  const errors = req.validationErrors();
  if (errors) return res.json({errors: errors});

  const group = await Group.findById(req.body.groupId).exec();
  if (!group) return res.json({errors: [{msg: "group doesn't exists"}]});

  const evnt = await Event.findOne({sender: req.user._id, associatedId: req.body.taskId}).exec();
  if (evnt) return res.status(400).json({errors: [{ msg: "already asked for approval" }]});

  await group.populate({path: "tasks"}).execPopulate();

  const taskToApprove = group.tasks.find(task => task._id.equals(req.body.taskId));
  if (!taskToApprove) return res.json({errors: [{msg: "task doesn't exists"}]});

  taskToApprove.status = TaskType.InReview;

  await taskToApprove.save();
  await group.populate({path: "users"}).execPopulate();

  const approver = getApprover(req.user._id, group.users);
  const event = new Event({
    type: EventType.TaskApproval,
    associatedId: req.body.taskId,
    receiver: approver._id,
    sender: req.user._id,
    possibleActions: [ActionType.Accept, ActionType.Decline]
  });

  await event.save();

  // eventToUpdate.actionLink = createGroupInviteLink(group._id, eventToUpdate._id);

  // await eventToUpdate.save();

  console.log(approver.email);

  return res.json({ msg: "success" });
}

export function getGroup(req: Request, res: Response, next: NextFunction) {
  Group.findById(req.params.groupId)
    .populate({
      path: "users"
    })
    .exec((err, group: GroupModel) => {
      return res.json(group);
  });
}

export function assign(req: Request, res: Response, next: NextFunction) {
  req.assert("taskId", "Task id cannot be blank").notEmpty();
  req.assert("assigneeId", "Assignee id cannot be blank").notEmpty();

  const errors = req.validationErrors();
  if (errors) return res.json({errors: errors});

  Task.findById(req.body.taskId, (err, task: TaskModel) => {
    if (err) next(err);
    task.assignee = req.body.assigneeId;
    task.save((err) => {
      if (err) next(err);
      res.json({msg: "success"});
    });
  });
}

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}

function getApprover(currentUserId: string, users: UserModel[]): UserModel {
  const randomNum = getRandomInt(users.length);
  if (users[randomNum] && users[randomNum]._id.equals(currentUserId)) {
      return users.find(user => user._id !== currentUserId);
  } else {
    return users[randomNum];
  }
}