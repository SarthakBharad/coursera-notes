export const site = {
  name: "Sarthak's Coursera Notes",
  shortName: "Coursera Notes",
  author: "Sarthak",
  description:
    "Sarthak's study notes from the Coursera programs he is taking: written in plain language, with analogies, worked examples and exercises.",
  /** Change this once the site has a real address (used for canonical/OG URLs). */
  url: "https://coursera-notes.vercel.app",
};

/** Keys used in localStorage. Bump the suffix if the stored shape ever changes. */
export const storageKeys = {
  theme: "scn:theme",
  textSize: "scn:text-size",
} as const;
