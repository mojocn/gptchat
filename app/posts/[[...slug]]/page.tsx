import { allPosts, Post } from "contentlayer/generated";
import { useMDXComponent } from "next-contentlayer/hooks";
import {
  ArticleNav,
  ChildCard,
  DocsFooter,
  DocsHeader,
  DocsNavigation,
} from "@/components/posts-comp";
import { buildDocsTree } from "@/lib/utils";
import { mdxComponents } from "@/components/posts-mdx";
import { notFound } from "next/navigation";

function getSupportingProps(doc: Post, slugs: string[]) {
  let breadcrumbs: any = [];

  let arrSlugStr = [""];
  for (let i = 0; i < slugs.length; i++) {
    const p = slugs.slice(0, i + 1).join("/");
    arrSlugStr.push(p);
  }

  for (const s of arrSlugStr) {
    const postDoc = allPosts.find((_) => _.slug === s);
    if (!postDoc) continue;
    breadcrumbs.push({
      path: postDoc.slug ? "/posts/" + postDoc.slug : "/posts",
      title: postDoc?.nav_title || postDoc?.title,
    });
  }
  const tree = buildDocsTree(allPosts);
  const childrenTree = buildDocsTree(
    allPosts,
    doc.pathSegments.map((_: PathSegment) => _.pathName),
  );
  return { tree, breadcrumbs, childrenTree };
}

export async function generateStaticParams() {
  return allPosts.map((_) => {
    slug: _.slug.split("/");
  });
}

export const generateMetadata = ({
  params,
}: {
  params: { slug: string[] };
}) => {
  if (!params.slug) {
    params.slug = ["-"];
  }
  const post = firstPost(params.slug);
  if (!post) {
    return {};
  } else {
    return { title: post.title };
  }
};

function firstPost(slugs: string[]) {
  const path = "/" + slugs.join("/");
  const doc = allPosts.find((post) => post.slug === slugs.join("/"));
  if (!doc) {
    console.error(`Post not found for path: ${path}`);
    allPosts.forEach((e) => {
      console.error(e.slug);
    });
    return undefined;
  }
  return doc;
}

function ArticlePage({ params }: { params: { slug?: string[] } }) {
  if (!params.slug) {
    params.slug = [];
  }
  const doc = firstPost(params.slug);
  if (!doc) {
    notFound();
  }
  const { tree, breadcrumbs, childrenTree } = getSupportingProps(
    doc,
    params.slug,
  );
  //console.log(breadcrumbs)
  const MDXContent = useMDXComponent(doc.body.code || "");

  return (
    <article className="relative mx-auto w-full max-w-screen-2xl overscroll-y-auto lg:flex lg:items-start">
      <div
        style={{ height: "calc(100vh - 64px)" }}
        className="sticky top-16 hidden shrink-0 border-r border-gray-200 dark:border-gray-800 lg:block"
      >
        <div className="-ml-3 h-full p-8 pl-16">
          <DocsNavigation tree={tree} />
        </div>
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-t from-white/0 to-white/100 dark:from-gray-950/0 dark:to-gray-950/100" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-white/0 to-white/100 dark:from-gray-950/0 dark:to-gray-950/100" />
      </div>

      <div className="relative w-full grow ">
        <DocsHeader tree={tree} breadcrumbs={breadcrumbs} title={doc.title} />
        <div className="mx-auto mb-4 w-full max-w-3xl shrink p-4  pb-8  md:mb-8 md:px-8 lg:mx-0 lg:max-w-full lg:px-16">
          {MDXContent && <MDXContent components={mdxComponents as any} />}
          {doc.show_child_cards && (
            <>
              <hr />
              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
                {childrenTree.map((card, index) => (
                  <ChildCard
                    key={index}
                    url={card.urlPath}
                    className="h-full p-6 py-4 hover:border-violet-100 hover:bg-violet-50 dark:hover:border-violet-900/50 dark:hover:bg-violet-900/20"
                  >
                    <h3 className="mt-0 no-underline">{card.title}</h3>
                    {card.label && <span>{card.label}</span>}
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      <p>{card.excerpt}</p>
                    </div>
                  </ChildCard>
                ))}
              </div>
            </>
          )}
          <DocsFooter doc={doc} />
        </div>
      </div>
      <div
        style={{ maxHeight: "calc(100vh - 128px)" }}
        className="sticky top-32 hidden w-80 shrink-0 p-8 pr-16 xl:block"
      >
        <ArticleNav headings={doc.headings} />
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-t from-white/0 to-white/100 dark:from-gray-950/0 dark:to-gray-950/100" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-white/0 to-white/100 dark:from-gray-950/0 dark:to-gray-950/100" />
      </div>
    </article>
  );
}

export default ArticlePage;
