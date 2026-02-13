import { literal } from "zod";
import { AppDataSource } from "../db/data-source";
import { Category } from "../entities";
import { CreateCategoryDto } from "../schema/category.schema";
import { DataResponse } from "../lib/DataResponse";
import { ResponseStatus } from "../lib/ResponseStatus";

export class CategoryService {
  private categoryRepository = AppDataSource.getRepository(Category);

  // CRUD operations

  async createCategory(user_id: string, category: CreateCategoryDto) {
    // implement business logic here....

    const data = this.categoryRepository.create({ ...category, user_id }); //
    await this.categoryRepository.save(data);
    return this.mapCategoryToResponse(data);
  }

  // for listing we can follow best practice with pagination

  async listCategories(
    user_id: string,
    current_page: number,
    limit: number,
  ): Promise<DataResponse> {
    // we need take, skip var
    // take = limit

    const skip = (current_page - 1) * limit;

    const [categories, items] = await this.categoryRepository.findAndCount({
      where: { user_id },
      order: {
        created_at: "DESC",
      },
      skip: skip,
      take: limit,
    });

    const total_pages = Math.max(1, Math.ceil(items / limit));
    const is_prev = current_page > 1;
    const is_next = current_page < total_pages;
    // console.log("Categories: ", categories);
    const data = categories.map((category) =>
      this.mapCategoryToResponse(category),
    );

    return {
      status: ResponseStatus.SUCCESS,
      data: data,
      meta_data: {
        total_pages,
        limit,
        current_page,
        is_prev,
        is_next,
      },
    };
  }

  // internal helper function
  private mapCategoryToResponse(category: Category) {
    return {
      id: category.id,
      user_id: category.user_id,
      name: category.name,
      icon: category.icon,
      description: category.description,
      created_at: category.created_at,
      updated_at: category.updated_at,
    };
  }
}
