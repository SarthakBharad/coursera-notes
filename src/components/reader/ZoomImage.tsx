"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "../Icons";

/**
 * An image from the notes. Click it to see it full screen; Esc or a click
 * closes it. The viewer is mounted into <body> only while open, so an image
 * inside a paragraph still produces valid HTML.
 */
export function ZoomImage({ alt = "", ...props }: ComponentProps<"img">) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
  }, [open]);

  const close = () => dialogRef.current?.close();

  return (
    <>
      <button type="button" className="zoom" onClick={() => setOpen(true)} aria-label={`Enlarge image: ${alt}`}>
        <img alt={alt} {...props} />
      </button>
      {open &&
        createPortal(
          <dialog ref={dialogRef} className="lightbox" aria-label={alt || "Image"} onClick={close} onClose={() => setOpen(false)}>
            <img src={props.src} alt={alt} width={props.width} height={props.height} />
            {alt && <p className="lightbox__caption">{alt}</p>}
            <button type="button" className="icon-btn lightbox__close" aria-label="Close image" onClick={close}>
              <CloseIcon />
            </button>
          </dialog>,
          document.body,
        )}
    </>
  );
}
