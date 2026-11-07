// Every view is drawn by @rede-enois/design-system. This app only composes design system
// components, feeds them data and wires their callbacks. Raw HTML elements and className/style
// props are how layout and styling leak back into the app, so they are refused here. Legacy code
// that predates this rule lives in eslint-suppressions.json and may only shrink.

// The document shell in src/routes/__root.tsx has to render these; nothing else may.
const DOCUMENT_ELEMENTS = new Set(["html", "head", "body", "meta", "link", "script", "title"]);

function normalizeFilename(filename) {
  return filename.replaceAll("\\", "/");
}

function isRootRoute(filename) {
  return filename.endsWith("/src/routes/__root.tsx") || filename === "src/routes/__root.tsx";
}

function elementName(node) {
  return node.type === "JSXIdentifier" ? node.name : null;
}

function isIntrinsic(name) {
  return name !== null && /^[a-z]/.test(name);
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Keep markup and styling in the design system: no raw HTML elements, className or style in the app",
    },
    schema: [],
    messages: {
      intrinsicElement:
        "<{{name}}> is markup. Build the view in @rede-enois/design-system and render it here.",
      styleProp:
        "`{{name}}` styles the view from the app. Add a variant or prop to the design system view instead.",
    },
  },

  create(context) {
    const rootRoute = isRootRoute(normalizeFilename(context.filename));

    return {
      JSXOpeningElement(node) {
        const name = elementName(node.name);
        if (!isIntrinsic(name)) return;
        if (rootRoute && DOCUMENT_ELEMENTS.has(name)) return;
        context.report({ node: node.name, messageId: "intrinsicElement", data: { name } });
      },

      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier") return;
        const { name } = node.name;
        if (name !== "className" && name !== "style") return;
        context.report({ node, messageId: "styleProp", data: { name } });
      },
    };
  },
};
