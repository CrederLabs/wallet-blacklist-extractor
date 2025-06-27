import fs from "fs";
import https from "https";
import path from "path";
import { URL } from "url";
import { formatDateOnly, logError } from "../utils";

export const sdnDownloader = (
  url: string,
  targetDir: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const timestamp = formatDateOnly();
    const targetFile = path.join(targetDir, `${timestamp}.xml`);
    fs.mkdirSync(targetDir, { recursive: true });

    const options = {
      headers: {
        "User-Agent": process.env.USER_AGENT || "",
        Accept: "application/xml",
      },
    };

    const makeRequest = (downloadUrl: string) => {
      https
        .get(downloadUrl, options, (res) => {
          const code = res.statusCode ?? 0;
          const ctype = res.headers["content-type"] || "unknown";

          if ((code === 301 || code === 302) && res.headers.location) {
            const redirectedUrl = new URL(res.headers.location, downloadUrl)
              .href;
            return makeRequest(redirectedUrl);
          }

          if (code !== 200 || !ctype.includes("xml")) {
            const errMsg = `Unexpected response: HTTP ${code}, type=${ctype}`;
            logError(errMsg);
            res.resume();
            return reject(new Error(errMsg));
          }

          let byteCount = 0;
          const file = fs.createWriteStream(targetFile);
          res.on("data", (chunk) => (byteCount += chunk.length));
          res.pipe(file);

          file.on("finish", () => {
            file.close();
            if (byteCount === 0) {
              fs.unlinkSync(targetFile);
              const msg = "Downloaded file is empty";
              logError(msg);
              return reject(new Error(msg));
            }
            resolve(targetFile);
          });

          file.on("error", (err) => {
            if (fs.existsSync(targetFile)) fs.unlinkSync(targetFile);
            logError(`File write error: ${err.message}`);
            reject(err);
          });
        })
        .on("error", (err) => {
          logError(`HTTPS request error: ${err.message}`);
          reject(err);
        });
    };

    makeRequest(url);
  });
};
