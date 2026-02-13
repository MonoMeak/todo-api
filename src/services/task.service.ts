import { AppDataSource } from "../db/data-source";
import { Task } from "../entities/Task";

import { TaskResponseDto, UpdateTaskDto } from "../schema/task.schema";
import { CreateTaskDto } from "../schema/task.schema";
import { DataResponse } from "../lib/DataResponse";
import { ResponseStatus } from "../lib/ResponseStatus";

export class TaskService {
  private taskRepository = AppDataSource.getRepository(Task);

  async createTask(
    user_id: string,
    taskDto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = this.taskRepository.create({ ...taskDto, user_id }); // create a new task instance with the provided data
    await this.taskRepository.save(task); // save the task to the database
    return this.mapToTaskResponseDto(task); // return the created task as a response DTO
  }

  async updateTask(
    user_id: string,
    task_id: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const updatedTask = await this.taskRepository.update(
      {
        user_id: user_id,
        id: task_id,
      },
      { ...updateTaskDto },
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
    userId: string,
    current_page: number,
    limit: number,
  ): Promise<DataResponse> {
    // prepare paginated info

    const page = current_page || 1;
    const take = limit || 10;
    const skip = (page - 1) * take;

    const [tasks, total_items] = await this.taskRepository.findAndCount({
      where: { user_id: userId },
      order: {
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
      created_at: task.created_at,
      updated_at: task.updated_at,
    };
  }
}
