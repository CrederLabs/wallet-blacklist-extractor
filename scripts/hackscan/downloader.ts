import fs from "fs";
import https from "https";
import path from "path";
import { URL } from "url";
import { formatDateOnly, logError } from "../utils";

export const hackscanDownloader = (
  url: string,
  targetDir: string
): Promise<string> =>
  new Promise((resolve, reject) => {
    const fname = `${formatDateOnly()}.json`;
    const fpath = path.join(targetDir, fname);
    fs.mkdirSync(targetDir, { recursive: true });

    const opts = {
      headers: {
        "User-Agent": process.env.USER_AGENT || "",
        Accept: "application/json",
      },
    };

    const getFile = (u: string) =>
      https
        .get(u, opts, (res) => {
          const code = res.statusCode ?? 0;
          const type = res.headers["content-type"] || "";

          // 301/302 follow
          if ([301, 302].includes(code) && res.headers.location) {
            return getFile(new URL(res.headers.location, u).href);
          }

          if (code !== 200 || !type.includes("json")) {
            const err = `Bad response: HTTP ${code}, type=${type}`;
            logError(err);
            res.resume();
            return reject(new Error(err));
          }

          let bytes = 0;
          const file = fs.createWriteStream(fpath);
          res.on("data", (c) => (bytes += c.length));
          res.pipe(file);

          file.on("finish", () => {
            file.close();
            if (!bytes) {
              fs.unlinkSync(fpath);
              const err = "Downloaded file empty";
              logError(err);
              return reject(new Error(err));
            }
            resolve(fpath);
          });

          file.on("error", (e) => {
            if (fs.existsSync(fpath)) fs.unlinkSync(fpath);
            logError(`File write error: ${e.message}`);
            reject(e);
          });
        })
        .on("error", (e) => {
          logError(`HTTPS error: ${e.message}`);
          reject(e);
        });

    getFile(url);
  });
