import fs from "fs";
import * as fsPromises from "fs/promises";
import path from "path";

/**
 * @returns YYYYMMDD format (e.g., 20250626)
 */
export const formatDateOnly = () => {
  const date = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate())
  );
};

export const isEvmAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

export const logError = (message: string) => {
  const timestamp = new Date().toISOString();
  const log = `[${timestamp}] ${message}\n`;
  fs.mkdirSync("logs", { recursive: true });
  fs.appendFileSync("logs/error.log", log, "utf-8");
};

export const uniqLower = (arr: string[]) =>
  Array.from(new Set(arr.map((a) => a.toLowerCase())));

export const rotateFiles = async (
  dir: string,
  baseName: string,
  keep: number
) => {
  const re = new RegExp(`^${baseName}_\\d+\\.json$`);
  const files = (await fsPromises.readdir(dir))
    .filter((f) => re.test(f))
    .map(async (f) => ({
      name: f,
      time: (await fsPromises.stat(path.join(dir, f))).ctimeMs,
    }));

  const sorted = (await Promise.all(files)).sort((a, b) => b.time - a.time);
  await Promise.all(
    sorted
      .slice(keep)
      .map(({ name }) =>
        fsPromises.unlink(path.join(dir, name)).catch(() => undefined)
      )
  );
};
