import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";

import noFrontMarkup from "./no-front-markup.js";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2020,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-front-markup", noFrontMarkup, {
  valid: [
    {
      filename: "/repo/src/routes/feed.tsx",
      code: "const page = <FeedView posts={posts} onLike={like} />;",
    },
    {
      filename: "/repo/src/components/feed/feed-container.tsx",
      code: "const view = <Dialog.Content title={title}><Outlet /></Dialog.Content>;",
    },
    {
      filename: "/repo/src/components/feed/feed-container.tsx",
      code: "const view = <><FeedView /><Composer /></>;",
    },
    {
      filename: "/repo/src/routes/__root.tsx",
      code: "const doc = <html lang='pt-BR'><head><meta charSet='utf-8' /></head><body /></html>;",
    },
  ],
  invalid: [
    {
      filename: "/repo/src/components/feed/feed-preferences-panel.tsx",
      code: "const panel = <div><Switch /></div>;",
      errors: [{ messageId: "intrinsicElement", data: { name: "div" } }],
    },
    {
      filename: "/repo/src/routes/novidades.tsx",
      code: "const page = <button onClick={close}>Ok</button>;",
      errors: [{ messageId: "intrinsicElement", data: { name: "button" } }],
    },
    {
      filename: "/repo/src/components/post/link-preview-card.tsx",
      code: "const card = <Card className='rounded-xl p-4' />;",
      errors: [{ messageId: "styleProp", data: { name: "className" } }],
    },
    {
      filename: "/repo/src/components/calls/call-panel.tsx",
      code: "const bar = <CallBar style={{ top: 0 }} />;",
      errors: [{ messageId: "styleProp", data: { name: "style" } }],
    },
    {
      filename: "/repo/src/components/shell/head.tsx",
      code: "const tag = <meta name='x' />;",
      errors: [{ messageId: "intrinsicElement", data: { name: "meta" } }],
    },
  ],
});
