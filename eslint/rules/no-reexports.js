function normalizeFilename(filename) {
  return filename.replaceAll("\\", "/");
}

function isGeneratedRouteTree(filename) {
  return filename.endsWith("/src/routeTree.gen.ts") || filename === "src/routeTree.gen.ts";
}

function isSourceFile(filename) {
  return filename.includes("/src/") || filename.startsWith("src/");
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Forbid re-exports so consumers import directly from the canonical source",
    },
    schema: [],
    messages: {
      reexport:
        "Do not re-export declarations. Import directly from the canonical source instead.",
    },
  },

  create(context) {
    const filename = normalizeFilename(context.filename);

    if (!isSourceFile(filename) || isGeneratedRouteTree(filename)) {
      return {};
    }

    function checkNamedExport(node) {
      if (node.source) {
        context.report({ node, messageId: "reexport" });
      }
    }

    function checkExportAll(node) {
      context.report({ node, messageId: "reexport" });
    }

    return {
      ExportNamedDeclaration: checkNamedExport,
      ExportAllDeclaration: checkExportAll,
    };
  },
};
