import { formatDate } from "@/lib/content/text";
import { site } from "@/lib/site";

// Evaluated when the static site is built, so it shows the build date.
const builtOn = formatDate(new Date().toISOString().slice(0, 10));

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__brand">{site.name}</p>
          <p>Personal study notes. Course names, figures and materials belong to their providers on Coursera.</p>
        </div>
        <div className="site-footer__meta">
          <span>Updated {builtOn}</span>
          <span>
            Press <kbd>/</kbd> to search
          </span>
          <a href="#top">Back to top</a>
        </div>
      </div>
    </footer>
  );
}
