export interface SourceConfig {
  id: string;
  input: string;
  output: string;
  url: string;
}

export const SOURCES: SourceConfig[] = [
  {
    id: "sdn",
    input: "SDN_ADVANCED",
    output: "evm_wallet_blacklist",
    url: process.env.SDN_URL || "",
  },
  {
    id: "hackscan",
    input: "HACKSCAN",
    output: "evm_wallet_blacklist",
    url: process.env.HACKSCAN_URL || "",
  },
];
