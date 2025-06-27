import "dotenv/config";
import path from "path";
import * as fs from "fs/promises";
import { SOURCES } from "./config";
import { formatDateOnly, uniqLower, rotateFiles } from "./scripts/utils";

async function run() {
  const aggregated: string[] = [];
  const metaList: any[] = [];

  for (const src of SOURCES) {
    const { id, input, url } = src;

    // 1. Load module dynamically
    const { [`${id}Downloader`]: downloadFile } = await import(
      `./scripts/${id}/downloader`
    );
    const { [`${id}Parser`]: parse } = await import(`./scripts/${id}/parser`);
    const { [`${id}Formatter`]: formatJson } = await import(
      `./scripts/${id}/formatter`
    );

    // 2. Download
    const subDir = path.join("./data", input);
    const filePath: string = await downloadFile(url, subDir);
    console.log(`✔ [${id}] Downloaded to ${filePath}`);

    // 3. Parse
    const { addresses, issuedAt } = await parse(filePath);
    console.log(`✔ [${id}] ${addresses.length} addresses parsed`);

    // 4. Format
    const formatted = formatJson(addresses, {
      sourceId: id,
      filePath: filePath,
      issuedAt,
    });

    aggregated.push(...formatted.data);
    metaList.push(formatted.meta);

    // 5. Clean up
    await fs.rm(subDir, { recursive: true, force: true });
  }

  // 6. Save to output directory
  const outputDir = "./output";
  await fs.mkdir(outputDir, { recursive: true });

  const deduped = uniqLower(aggregated);
  const timestamp = formatDateOnly();
  const baseName = "evm_wallet_blacklist";

  const latestPath = path.join(outputDir, "latest.json");
  const datedPath = path.join(outputDir, `${baseName}_${timestamp}.json`);

  const finalJson = {
    meta: {
      sources: metaList,
      extractedAt: timestamp,
      recordCount: deduped.length,
    },
    data: deduped,
  };

  // 7. Rename latest file if it exists
  try {
    await fs.rename(latestPath, datedPath);
  } catch (_) {}

  await fs.writeFile(latestPath, JSON.stringify(finalJson, null, 2));
  console.log(`✔ Saved result to ${latestPath}`);

  // 8. Rotate old files
  await rotateFiles(outputDir, baseName, 5);
}

run()
  .catch((err) => {
    console.error("✔ Unhandled Error:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
