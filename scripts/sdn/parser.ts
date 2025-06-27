import fs from "fs/promises";
import path from "path";
import { parseStringPromise } from "xml2js";
import { isEvmAddress } from "../utils";

const FEATURE_PREFIX = "Digital Currency Address - ";
const CURRENCIES = [
  "XBT",
  "ETH",
  "XMR",
  "LTC",
  "ZEC",
  "DASH",
  "BTG",
  "ETC",
  "BSV",
  "BCH",
  "XVG",
  "USDT",
  "USDC",
  "XRP",
  "TRX",
  "ARB",
  "BSC",
];

export async function sdnParser(
  xmlPath: string
): Promise<{ addresses: string[]; issuedAt: string }> {
  const xml = await fs.readFile(xmlPath, "utf-8");
  const parsed = await parseStringPromise(xml, {
    explicitArray: false,
    trim: true,
  });

  const root = parsed?.Sanctions;
  if (!root) throw new Error("No Sanctions root found");

  /** 0. Extract published date */
  const date = root.DateOfIssue;
  const issuedAt =
    date && date.Year && date.Month && date.Day
      ? `${date.Year}${String(date.Month).padStart(2, "0")}${String(
          date.Day
        ).padStart(2, "0")}`
      : "unknown";

  /** 1. Mapping FeatureType ID to Currency Name */
  const featureTypes = root.ReferenceValueSets.FeatureTypeValues
    .FeatureType as any[];
  const idToCurrency = new Map<string, string>();

  (Array.isArray(featureTypes) ? featureTypes : [featureTypes]).forEach(
    (ft) => {
      const text = typeof ft === "string" ? ft : ft._;
      const id = ft.$.ID;
      if (text?.startsWith(FEATURE_PREFIX)) {
        const curr = text.replace(FEATURE_PREFIX, "").trim();
        if (CURRENCIES.includes(curr)) idToCurrency.set(id, curr);
      }
    }
  );

  /** 2. Extract addresses */
  const addresses: string[] = [];
  const parties = root.DistinctParties.DistinctParty || [];

  const partyArr = Array.isArray(parties) ? parties : [parties];

  for (const party of partyArr) {
    const profiles = party.Profile || [];
    const profArr = Array.isArray(profiles) ? profiles : [profiles];

    for (const profile of profArr) {
      const features = profile.Feature || [];
      const featArr = Array.isArray(features) ? features : [features];

      for (const feature of featArr) {
        const currency = idToCurrency.get(feature.$.FeatureTypeID);
        if (!currency) continue;

        const versions = feature.FeatureVersion || [];
        const verArr = Array.isArray(versions) ? versions : [versions];

        for (const ver of verArr) {
          const details = ver.VersionDetail || [];
          const detArr = Array.isArray(details) ? details : [details];

          detArr.forEach((d) => {
            const addr = typeof d === "string" ? d : d._;
            if (addr && isEvmAddress(addr.trim())) {
              addresses.push(addr.trim());
            }
          });
        }
      }
    }
  }

  console.log(`✔ [sdn] Completed parsing ${addresses.length} addresses`);
  return { addresses, issuedAt };
}

/**
 * Deletes files in the specified directory that match the given pattern,
 * keeping only the most recent `max` files.
 */
export async function fileController(
  dir: string,
  pattern: RegExp,
  max: number
) {
  const files = await fs.readdir(dir);
  const matched = await Promise.all(
    files
      .filter((f) => pattern.test(f))
      .map(async (f) => ({
        name: f,
        time: (await fs.stat(path.join(dir, f))).ctimeMs,
      }))
  );

  if (matched.length === 0) {
    console.log(`✔ fileController: No matched files in ${dir}`);
    return;
  }

  matched.sort((a, b) => b.time - a.time);
  const toTrash = matched.slice(max);

  await Promise.all(
    toTrash.map(({ name }) =>
      fs
        .unlink(path.join(dir, name))
        .catch((e) => console.warn(`✔ failed to delete ${name}:`, e.message))
    )
  );
}
