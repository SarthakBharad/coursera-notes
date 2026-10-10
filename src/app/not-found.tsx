import Link from "next/link";
import { ArrowLeftIcon } from "@/components/Icons";

export default function NotFound() {
  return (
    <section className="container not-found">
      <p className="not-found__code display" title="404 in binary">
        110010100
      </p>
      <h1 className="display">This page isn&rsquo;t in the notes.</h1>
      <p>That&rsquo;s 404 in binary. The link may be old, or the module hasn&rsquo;t been written yet.</p>
      <Link href="/" className="btn btn--primary">
        <ArrowLeftIcon /> Back to all programs
      </Link>
    </section>
  );
}
