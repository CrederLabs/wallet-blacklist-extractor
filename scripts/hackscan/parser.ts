import fs from "fs/promises";
import { isEvmAddress } from "../utils";

const CURRENCIES = ["eth", "bsc", "arbi", "arb", "op", "avax"];

export async function hackscanParser(
  jsonPath: string
): Promise<{ addresses: string[]; issuedAt: string }> {
  const raw = await fs.readFile(jsonPath, "utf-8");
  const js = JSON.parse(raw) as Record<string, { [k: string]: string[] }>;

  const addresses: string[] = [];

  for (const chains of Object.values(js)) {
    Object.entries(chains).forEach(([chainId, list]) => {
      if (CURRENCIES.includes(chainId)) {
        list.forEach((addr) => {
          if (isEvmAddress(addr)) addresses.push(addr);
        });
      }
    });
  }

  console.log(`✔ [hackscan] Completed parsing ${addresses.length} addresses`);
  return { addresses, issuedAt: "unknown" };
}
