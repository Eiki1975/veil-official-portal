export type SerialStoryImage = {
  id: string;
  alt: string;
  caption: string;
  image: string;
  after?: string;
  afterIndex?: number;
};

export type SerialStory = {
  id: string;
  memberSlug: string;
  season: number;
  episode: number;
  title: string;
  body: string;
  images: SerialStoryImage[];
  updatedAt: string;
};

export type SerialStorySummary = Omit<SerialStory, "body" | "images"> & {
  /** A single episode's static data, fetched only after the reader opens it. */
  contentUrl: string;
};

/**
 * This is generated from the published story source before development,
 * type-checking, and production builds. It deliberately omits every body and
 * image record, which are fetched as one static JSON file per episode.
 */
export const serialStories = serialStoriesIndexData as SerialStorySummary[];
import serialStoriesIndexData from "../content/serial-stories-index.json";
