import Link from "next/link";
import { SearchPalette } from "./SearchPalette";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand" aria-label="Sarthak's Coursera Notes, home">
          <span className="brand__mark" aria-hidden="true">
            <span>S</span>
          </span>
          <span className="brand__name">
            <span className="brand__first">Sarthak&rsquo;s </span>
            <em>Coursera</em> Notes
          </span>
        </Link>
        <SearchPalette />
        <ThemeToggle />
      </div>
    </header>
  );
}
