"use client";

import { useState, type CSSProperties } from "react";
import { ResetIcon } from "../Icons";

const WORD = "NOTES";
const PLACES = [128, 64, 32, 16, 8, 4, 2, 1];

function toBits(code: number): boolean[] {
  return PLACES.map((place) => (code & place) !== 0);
}

function toCode(bits: boolean[]): number {
  return bits.reduce((sum, on, index) => sum + (on ? (PLACES[index] ?? 0) : 0), 0);
}

function printable(code: number): string | null {
  return code >= 33 && code <= 126 ? String.fromCharCode(code) : code === 32 ? "␣" : null;
}

const initial = () => [...WORD].map((char) => toBits(char.charCodeAt(0)));

/**
 * A little binary playground for the hero: each row is one byte of ASCII.
 * Flip a bit and the decimal value and the character change with it.
 */
export function ByteBoard() {
  const [rows, setRows] = useState<boolean[][]>(initial);
  const word = rows.map((bits) => printable(toCode(bits)) ?? "·").join("");
  const changed = word !== WORD;

  const flip = (row: number, bit: number) => {
    setRows((current) => current.map((bits, r) => (r === row ? bits.map((on, b) => (b === bit ? !on : on)) : bits)));
  };

  return (
    <figure className="byteboard rise" style={{ "--i": 3 } as CSSProperties}>
      <div className="byteboard__frame">
        <div className="byteboard__head" aria-hidden="true">
          {PLACES.map((place) => (
            <span key={place}>{place}</span>
          ))}
          <span className="byteboard__eq">dec</span>
          <span className="byteboard__eq">char</span>
        </div>
        {rows.map((bits, r) => {
          const code = toCode(bits);
          const char = printable(code);
          return (
            <div className="byteboard__row" key={r} role="group" aria-label={`Byte ${r + 1}: ${char ?? "not printable"}`}>
              {bits.map((on, b) => (
                <button
                  key={b}
                  type="button"
                  className="bit"
                  data-on={on}
                  aria-pressed={on}
                  aria-label={`Bit worth ${PLACES[b]}`}
                  onClick={() => flip(r, b)}
                  style={{ "--d": r * 8 + b } as CSSProperties}
                >
                  {on ? 1 : 0}
                </button>
              ))}
              <span className="byteboard__dec">{code}</span>
              <span className="byteboard__char" data-printable={char !== null} aria-live="polite">
                {char ?? "·"}
              </span>
            </div>
          );
        })}
      </div>
      <figcaption className="byteboard__caption">
        <span>
          Each row is one byte of ASCII. <strong>Flip a bit</strong> and the letter changes.
        </span>
        {changed && (
          <button type="button" className="btn btn--ghost btn--small" onClick={() => setRows(initial())}>
            <ResetIcon /> Reset to {WORD}
          </button>
        )}
      </figcaption>
    </figure>
  );
}
