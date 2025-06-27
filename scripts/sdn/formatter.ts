import { formatDateOnly } from "../utils";

export const sdnFormatter = (
  addresses: string[],
  options: {
    sourceId: string;
    filePath: string;
    issuedAt?: string;
  }
) => {
  const deduped = Array.from(new Set(addresses.map((a) => a.toLowerCase())));
  console.log(`✔ [Formatter] ${deduped.length} unique addresses found`);

  return {
    meta: {
      source: options.sourceId,
      // filename: options.filePath,
      issuedAt: options.issuedAt,
      extractedAt: formatDateOnly(),
      recordCount: deduped.length,
    },
    data: deduped,
  };
};
