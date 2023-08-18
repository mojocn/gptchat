import { Generated } from "kysely";

export interface PromptTable {
  id: Generated<number>;
  remark: string;
  prompt_format: string;
  mode: "public" | "private";
  name: string;
}
