function isWhitespaceText(node) {
  return node.type === "JSXText" && node.value.trim() === "";
}

function isJsxBlock(node) {
  return node.type === "JSXElement" || node.type === "JSXFragment";
}

function hasMeaningfulContent(node) {
  if (!isJsxBlock(node)) {
    return false;
  }

  return node.children.some((child) => {
    if (child.type === "JSXText") {
      return child.value.trim() !== "";
    }

    if (child.type === "JSXExpressionContainer") {
      return child.expression.type !== "JSXEmptyExpression";
    }

    return (
      child.type === "JSXElement" || child.type === "JSXFragment" || child.type === "JSXSpreadChild"
    );
  });
}

function getIndentation(sourceText, node) {
  const lineStart = sourceText.lastIndexOf("\n", node.range[0] - 1) + 1;
  const prefix = sourceText.slice(lineStart, node.range[0]);

  return /^[\t ]*$/.test(prefix) ? prefix : null;
}

export default {
  meta: {
    type: "layout",
    docs: {
      description:
        "Require blank lines around JSX siblings with meaningful content and group empty siblings",
    },
    fixable: "whitespace",
    schema: [],
    messages: {
      requireBlankLine: "JSX elements with content must be separated by a blank line.",
      removeBlankLine: "JSX elements without content should stay grouped without blank lines.",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;
    const sourceText = sourceCode.text;
    const eol = sourceText.includes("\r\n") ? "\r\n" : "\n";

    function checkChildren(parent) {
      const children = parent.children;

      for (let index = 0; index < children.length; index += 1) {
        const left = children[index];

        if (!isJsxBlock(left)) {
          continue;
        }

        let rightIndex = index + 1;

        while (rightIndex < children.length && isWhitespaceText(children[rightIndex])) {
          rightIndex += 1;
        }

        const right = children[rightIndex];

        if (!right || !isJsxBlock(right)) {
          continue;
        }

        const betweenNodes = children.slice(index + 1, rightIndex);

        if (!betweenNodes.every(isWhitespaceText)) {
          continue;
        }

        const shouldHaveBlankLine = hasMeaningfulContent(left) || hasMeaningfulContent(right);
        const rightIndentation = getIndentation(sourceText, right);
        const leftIndentation = getIndentation(sourceText, left);
        const indentation = rightIndentation ?? leftIndentation ?? "";
        const expectedGap = shouldHaveBlankLine
          ? `${eol}${eol}${indentation}`
          : `${eol}${indentation}`;
        const currentGap = sourceText.slice(left.range[1], right.range[0]);

        if (currentGap === expectedGap) {
          continue;
        }

        context.report({
          node: right,
          messageId: shouldHaveBlankLine ? "requireBlankLine" : "removeBlankLine",
          fix(fixer) {
            return fixer.replaceTextRange([left.range[1], right.range[0]], expectedGap);
          },
        });
      }
    }

    return {
      JSXElement: checkChildren,
      JSXFragment: checkChildren,
    };
  },
};
