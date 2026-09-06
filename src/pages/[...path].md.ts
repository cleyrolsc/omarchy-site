import type { APIRoute, GetStaticPaths } from "astro";
import { documents, documentMarkdown, type Document } from "../lib/markdown";
export const getStaticPaths = (async () =>
  (await documents()).map((doc) => ({
    params: {
      path: doc.path === "/" ? "index" : doc.path.replace(/^\/|\/$/g, ""),
    },
    props: { doc },
  }))) satisfies GetStaticPaths;
export const GET: APIRoute = ({ props }) =>
  new Response(documentMarkdown(props.doc as Document), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
