import { storageKeys } from "@/lib/site";

/**
 * Runs before the first paint so the page never flashes the wrong theme or
 * text size. Kept tiny and dependency-free on purpose.
 */
const script = `(function(){try{var d=document.documentElement,t=localStorage.getItem(${JSON.stringify(
  storageKeys.theme,
)});if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.dataset.theme=t;var s=localStorage.getItem(${JSON.stringify(
  storageKeys.textSize,
)});if(s==="s"||s==="l")d.dataset.textSize=s}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
