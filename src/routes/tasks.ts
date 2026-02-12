import { NextFunction } from "express";
import express from "express";
import { Request, Response } from "express";
const taskRoutes = express.Router();
import { TaskService } from "../services/task.service";
import { requireAuth } from "../middleware/auth.middleware";
import { ResponseStatus } from "../lib/ResponseStatus";
import { validateBody } from "../middleware/validate.middleware";
import { createTaskSchema, updateTaskSchema } from "../schema/task.schema";
const taskService = new TaskService();
import { UpdateTaskDto } from "../schema/task.schema";

// list all tasks that belongs to a given user id
taskRoutes.get(
  "/",
  requireAuth,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      // from user also need : current_page: default is 1
      // limit: default 10

      const { current_page, limit } = req.query;

      console.log(`current page ${current_page} -- limit ${limit}`);

      const tasksResponse = await taskService.listTasksByUser(
        req.authUser!.id,
        Number(current_page),
        Number(limit),
      );
      // implement pagination and filtering here later

      // prepare response by using DataRespons Interface

      res.json(tasksResponse);
    } catch (error) {
      next(error);
    }
  },
);

// create a new task for a given user id

taskRoutes.post(
  "/",
  requireAuth,
  validateBody(createTaskSchema),
  async (req: Request, res: Response) => {
    try {
      const taskData = req.body;
      const user_id = req.authUser!.id;
      const newTask = await taskService.createTask(user_id, taskData);

      res.status(201).json({
        status: "success",
        data: newTask,
      });
    } catch (error) {
      res.status(500).json({ status: "Failed to create task", message: error });
    }
  },
);

// Remove task
taskRoutes.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const user_id = req.authUser.id;
    const task_id = String(req.params.id);

    const task = await taskService.deleteTask(user_id, task_id);
    res.status(200).json({
      status: ResponseStatus.SUCCESS,
      message: "task Deleted!",
    });
  } catch (error) {
    res.status(404).json({
      status: ResponseStatus.FAILED,
      message: error instanceof Error ? error.message : "Failed to delete task",
    });
  }
});

// update task

taskRoutes.patch(
  "/:id",
  requireAuth,
  validateBody(updateTaskSchema),

  async (req: Request, res: Response) => {
    try {
      const user_id = req.authUser.id;
      const task_id = String(req.params.id);

      const updateTaskDto: UpdateTaskDto = req.body; // map data from body to updateTask Dto

      const updatedTask = await taskService.updateTask(
        user_id,
        task_id,
        updateTaskDto,
      );

      res.status(200).json({
        status: ResponseStatus.SUCCESS,
        data: updatedTask,
      });
    } catch (error) {
      res.status(500).json(error.message);
    }
  },
);

export default taskRoutes;
