import type { ThumbResult } from "../types/api.js";

const THUMB_FILEID = 0;
const THUMB_RESULT = 1;
const THUMB_SIZE = 2;
const THUMB_URL = 3;

function parseLine(line: string): { result: number; url: string; fileid: number; size: string } {
  const parts = line.split("|");
  return {
    result: parseInt(parts[THUMB_RESULT] ?? "0", 10),
    url: parts[THUMB_URL]?.trim() ?? "",
    fileid: parseInt(parts[THUMB_FILEID] ?? "0", 10),
    size: parts[THUMB_SIZE] ?? "",
  };
}

export function createThumbParser(): (text: string) => ThumbResult[] {
  let lastLinePos = 0;
  const thumbs: ThumbResult[] = [];

  return (text: string): ThumbResult[] => {
    const setThumbs: ThumbResult[] = [];

    while (true) {
      const nextLinePos = text.indexOf("\n", lastLinePos + 1);
      if (nextLinePos === -1) break;

      const {
        result: rawResult,
        url: rawUrl,
        fileid,
        size,
      } = parseLine(text.substring(lastLinePos, nextLinePos));
      let result = rawResult;
      let url = rawUrl;
      lastLinePos = nextLinePos;

      if (result === 6001) {
        const cached = thumbs[parseInt(size, 10)];
        if (cached) {
          url = cached.url;
          result = 0;
        }
      }

      if (result === 0) {
        const thumb: ThumbResult = { url, fileid };
        thumbs.push(thumb);
        setThumbs.push(thumb);
      }
    }

    return setThumbs;
  };
}
