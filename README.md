# Wallet Blacklist Extractor

Downloads & parses wallet-address feeds published by

1. **OFAC SDN Advanced XML**
2. **LazarusBounty Program (HackScan)**

It keeps only EVM-compatible addresses (`0x…`), deduplicates them, and writes a
single **`latest.json`** blacklist plus timestamped history files.

## ⚙️ Installation & Usage

```bash
npm install
npm start
```
