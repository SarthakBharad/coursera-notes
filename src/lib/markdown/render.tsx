import type { Root } from "hast";
import { toJsxRuntime, type Components } from "hast-util-to-jsx-runtime";
import type { ComponentProps, ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { CodeBlock } from "@/components/reader/CodeBlock";
import { RevealAnswers } from "@/components/reader/RevealAnswers";
import { ZoomImage } from "@/components/reader/ZoomImage";

/**
 * Elements from the notes that need behaviour get a React component; all
 * others are rendered as plain HTML elements.
 */
const components: Partial<Components> = {
  img: (props: ComponentProps<"img">) => <ZoomImage {...props} />,
  pre: (props: ComponentProps<"pre">) => <CodeBlock {...props} />,
  div: (props: ComponentProps<"div">) =>
    "data-answers" in props ? <RevealAnswers>{props.children}</RevealAnswers> : <div {...props} />,
};

export function hastToReact(tree: Root): ReactNode {
  return toJsxRuntime(tree, { Fragment, jsx, jsxs, components, ignoreInvalidStyle: true });
}
