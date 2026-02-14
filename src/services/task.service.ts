import { AppDataSource } from "../db/data-source";
import { Task } from "../entities/Task";
import { Category } from "../entities/Category";

import { TaskResponseDto, UpdateTaskDto } from "../schema/task.schema";
import { CreateTaskDto } from "../schema/task.schema";
import { DataResponse } from "../lib/DataResponse";
import { ResponseStatus } from "../lib/ResponseStatus";
import { In } from "typeorm";

export class TaskService {
  private taskRepository = AppDataSource.getRepository(Task);
  private categoryRepository = AppDataSource.getRepository(Category);

  async createTask(
    user_id: string,
    taskDto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    if (taskDto.category_id) {
      await this.ensureCategoryOwnership(user_id, taskDto.category_id);
    }

    const payload = this.normalizeTaskPayload(taskDto);
    const nextOrderNumber = await this.getNextOrderNumberForUser(user_id);
    const task = this.taskRepository.create({
      ...payload,
      user_id,
      order_number:
        taskDto.order_number !== undefined
          ? taskDto.order_number
          : nextOrderNumber,
    }); // create a new task instance with the provided data
    await this.taskRepository.save(task); // save the task to the database
    return this.mapToTaskResponseDto(task); // return the created task as a response DTO
  }

  async reorderTasks(user_id: string, orderedTaskIds: string[]): Promise<void> {
    const uniqueTaskIds = Array.from(new Set(orderedTaskIds));
    if (uniqueTaskIds.length === 0) {
      return;
    }

    const existingTasks = await this.taskRepository.find({
      where: {
        user_id,
        id: In(uniqueTaskIds),
      },
      select: {
        id: true,
      },
    });

    if (existingTasks.length !== uniqueTaskIds.length) {
      throw new Error("Some tasks were not found or not owned by user");
    }

    // reroder task whenever newly created
    await AppDataSource.transaction(async (manager) => {
      for (let index = 0; index < uniqueTaskIds.length; index++) {
        await manager.update(
          Task,
          { id: uniqueTaskIds[index], user_id },
          { order_number: index + 1 },
        );
      }
    });
  }

  async updateTask(
    user_id: string,
    task_id: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    if (
      updateTaskDto.category_id !== undefined &&
      updateTaskDto.category_id !== null
    ) {
      await this.ensureCategoryOwnership(user_id, updateTaskDto.category_id);
    }

    const payload = this.normalizeTaskPayload(updateTaskDto);
    const updatedTask = await this.taskRepository.update(
      {
        user_id: user_id,
        id: task_id,
      },
      payload,
    );

    if (updatedTask.affected === 0) {
      throw new Error("Task not found or not owned by user");
    }

    return this.getTaskByOwerAndId(user_id, task_id);
    //
  }
  async deleteTask(user_id: string, task_id: string): Promise<string> {
    const deletedTask = await this.taskRepository.delete({
      user_id: user_id,
      id: task_id,
    });

    if (deletedTask.affected == 0) {
      throw new Error("Task not found!");
    }

    return "Task deleted";
  }

  // list all tasks that belongs to a given user id
  async listTasksByUser(
    user_id: string,
    current_page: number,
    limit: number,
    category_id?: string,
  ): Promise<DataResponse> {
    // prepare paginated info

    const page = current_page || 1;
    const take = limit || 10;
    const skip = (page - 1) * take;

    const whereClause: any = {
      user_id,
    };
    if (category_id) {
      whereClause.category_id = category_id;
    }

    const [tasks, total_items] = await this.taskRepository.findAndCount({
      where: whereClause,
      order: {
        order_number: "ASC",
        created_at: "DESC",
      },
      skip,
      take,
    });

    // Calculate total page  (atleast 1 page)

    const total_pages = Math.max(1, Math.ceil(total_items / take));
    const is_prev = page > 1;
    const is_next = page < total_pages;
    const data = tasks.map((task) => this.mapToTaskResponseDto(task));

    return {
      status: ResponseStatus.SUCCESS,
      data,
      meta_data: {
        total_pages,
        limit: take,
        current_page,
        is_prev,
        is_next,
      },
    }; // map each task to a TaskResponseDto
  }

  async getTaskByOwerAndId(
    user_id: string,
    task_id: string,
  ): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOneBy({ id: task_id, user_id });

    if (!task) {
      throw new Error("Task no found!");
    }
    return this.mapToTaskResponseDto(task);
  }

  private mapToTaskResponseDto(task: Task): TaskResponseDto {
    return {
      id: task.id,
      user_id: task.user_id,
      category_id: task.category_id || null,
      text: task.text,
      is_completed: task.is_completed,
      completed_at: task.completed_at,
      end_date: task.end_date,
      order_number: task.order_number,
      created_at: task.created_at,
      updated_at: task.updated_at,
    };
  }

  private normalizeTaskPayload(taskDto: CreateTaskDto | UpdateTaskDto) {
    if (!("end_date" in taskDto)) {
      return { ...taskDto };
    }

    if (taskDto.end_date === undefined) {
      return { ...taskDto };
    }

    return {
      ...taskDto,
      end_date: taskDto.end_date ? new Date(taskDto.end_date) : null,
    };
  }

  private async getNextOrderNumberForUser(user_id: string): Promise<number> {
    const latestTask = await this.taskRepository.findOne({
      where: { user_id },
      order: { order_number: "DESC" },
      select: { order_number: true },
    });

    if (!latestTask) {
      return 1;
    }

    return latestTask.order_number + 1;
  }

  private async ensureCategoryOwnership(user_id: string, category_id: string) {
    const category = await this.categoryRepository.findOne({
      where: {
        id: category_id,
        user_id,
      },
    });

    if (!category) {
      throw new Error("Category not found or not owned by user");
    }
  }
}
