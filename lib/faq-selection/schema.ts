import { z } from "zod";

export const faqSelectionSchema = z.object({
  kind: z.enum(["match", "no_match"]),
  articleIds: z.array(z.string()).max(3),
}).superRefine((selection, context) => {
  if (selection.kind === "no_match") {
    if (selection.articleIds.length !== 0) {
      context.addIssue({
        code: "custom",
        path: ["articleIds"],
        message: "articleIds must be empty when kind is no_match",
      });
    }
  }

  if (selection.kind === "match") {
    if (selection.articleIds.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["articleIds"],
        message: "articleIds must contain 1 to 3 IDs when kind is match",
      });
    }
  }
});

export type FaqSelection = z.infer<typeof faqSelectionSchema>;
