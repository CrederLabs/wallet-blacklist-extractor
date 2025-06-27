import { sdnFormatter as baseFormatter } from "../sdn/formatter";

export const hackscanFormatter = (
  addresses: string[],
  options: {
    sourceId: string;
    filePath: string;
    issuedAt?: string;
  }
) =>
  baseFormatter(addresses, {
    sourceId: options.sourceId,
    filePath: options.filePath,
    issuedAt: options.issuedAt,
  });
