import express from "express";
import { Request, Response } from "express";
import { validateBody } from "../middleware/validate.middleware";
import {
  CreateCategoryDto,
  createCategorySchema,
} from "../schema/category.schema";
import { requireAuth } from "../middleware/auth.middleware";
import { CategoryService } from "../services/category.service";
const categoryRoutes = express.Router();

const categoryService = new CategoryService();

categoryRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  // get user_id from middleware

  const user_id = req.authUser.id;
  // const limit = req.query.limit || 10;
  // const current_page = req.query.page || 1;

  const { limit, current_page } = req.query;
  const result = await categoryService.listCategories(
    user_id,
    Number(current_page),
    Number(limit),
  );

  res.status(200).json(result);
});

categoryRoutes.post(
  "/",
  requireAuth,
  validateBody(createCategorySchema),
  async (req: Request, res: Response) => {
    try {
      const user_id = req.authUser.id;
      const categoryData: CreateCategoryDto = req.body;
      //   console.log(">>> category data", categoryData);
      const category = await categoryService.createCategory(
        user_id,
        categoryData,
      );

      res.status(200).json(category);
    } catch (error: any) {
      error.message = "Something went wrong during create category!";

      res.status(500).json({ messager: error });
    }
  },
);

categoryRoutes.get("/:id", async (req: Request, res: Response) => {
  res.json({ message: "List of categories" });
});

categoryRoutes.patch("/:id", async (req: Request, res: Response) => {
  res.json({ message: "List of categories" });
});
categoryRoutes.delete("/:id", async (req: Request, res: Response) => {
  res.json({ message: "List of categories" });
});

export default categoryRoutes;
