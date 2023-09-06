import { jsonData } from "@/app/api/check-auth";
import { allPosts, Post } from "contentlayer/generated";
import { buildDocsTree } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const tree = buildDocsTree(allPosts);
  const posts = allPosts.map((e) => {
    return { ...e, body: undefined };
  });
  return jsonData({ posts, tree });
}
