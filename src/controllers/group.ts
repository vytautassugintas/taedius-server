import { Request, Response, NextFunction } from "express";
import { WriteError } from "mongodb";
import { default as User, UserModel } from "../models/User";
import { default as Group, GroupModel } from "../models/Group";
import { default as Task, TaskModel } from "../models/Task";

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
    createdBy: req.user._id
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

export function getGroup(req: Request, res: Response, next: NextFunction) {
  Group.findById(req.params.groupId, (err, group: GroupModel) => {
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