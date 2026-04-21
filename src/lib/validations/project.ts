import { z } from "zod";

export const PEER_MIN = 3;
export const PEER_MAX = 1000;

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be under 100 characters"),
  description: z.string().max(500, "Description must be under 500 characters").optional(),
  region: z.string().optional(),
  focus_company_id: z.number().int().positive({
    message: "Select a focus company",
  }),
  peer_company_ids: z
    .array(z.number().int().positive())
    .min(PEER_MIN, `Select at least ${PEER_MIN} peers`)
    .max(PEER_MAX, `Select at most ${PEER_MAX} peers`),
  benchmark_year: z.number().int().min(1900).max(2100),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z
  .object({
    name: z.string().min(1, "Project name is required").max(100).optional(),
    description: z.string().max(500).optional(),
    region: z.string().optional(),
    benchmark_year: z.number().int().min(1900).max(2100).optional(),
    status: z.enum(["active", "paused", "archived"]).optional(),
    focus_company_id: z.number().int().positive().optional(),
    peer_company_ids: z.array(z.number().int().positive()).min(PEER_MIN).max(PEER_MAX).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field required",
  });

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
