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

      const { current_page, limit, category_id } = req.query;
      const page = Number(current_page) || 1;
      const take = Number(limit) || 10;
      const categoryId =
        typeof category_id === "string" && category_id.trim().length > 0
          ? category_id
          : undefined;

      console.log(`current page ${page} -- limit ${take}`);

      const tasksResponse = await taskService.listTasksByUser(
        req.authUser!.id,
        page,
        take,
        categoryId,
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
    } catch (error: any) {
      if (error.message === "Category not found or not owned by user") {
        return res.status(400).json({
          status: ResponseStatus.FAILED,
          message: error.message,
        });
      }

      res.status(500).json({
        status: ResponseStatus.FAILED,
        message: "Failed to create task",
      });
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
    } catch (error: any) {
      if (error.message === "Category not found or not owned by user") {
        return res.status(400).json({
          status: ResponseStatus.FAILED,
          message: error.message,
        });
      }

      if (error.message === "Task not found or not owned by user") {
        return res.status(404).json({
          status: ResponseStatus.FAILED,
          message: error.message,
        });
      }

      res.status(500).json({
        status: ResponseStatus.FAILED,
        message: "Failed to update task",
      });
    }
  },
);

export default taskRoutes;
