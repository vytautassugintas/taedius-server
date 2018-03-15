import { Request, Response, NextFunction } from "express";
import { WriteError } from "mongodb";
import { default as Event, EventModel, EventType, ActionType } from "../models/Event";

export async function getCurrentUserEvents(req: Request, res: Response) {
  const events = await Event.find({receiver: req.user._id});

  res.status(200).json(events);
}
