// Ported verbatim from the PHP app's views/lista_precios.view.php
// (SHEET_CATEGORY_MAP + SHEET_IGNORE_LIST) — this encodes Fortinet's exact
// AMER price-list sheet-naming convention, business-critical to get right.

export const SHEET_CATEGORY_MAP: Record<string, string> = {
  FortiGate: "FortiGate",
  FortiWiFi: "FortiWiFi",
  "FortiGate Chassis Platforms": "FortiGate Chassis Platforms",
  "FortiGate VM": "FortiGate VM",
  "Rugged Products": "Rugged Products",
  "VDOM & ADOM": "VDOM & ADOM",
  FortiSASE: "FortiSASE",
  FortiAnalyzer: "FortiAnalyzer",
  FortiManager: "FortiManager",
  FortiSwitch: "FortiSwitch",
  "Wireless Products": "Wireless Products",
  "FortiSandbox & ATP Products": "FortiSandbox & ATP Products",
  FortiMail: "FortiMail",
  FortiWeb: "FortiWeb",
  FortiClient: "FortiClient",
  FortiEndpoint: "FortiEndpoint",
  "Data Protection": "Data Protection",
  FortiEDR: "FortiEDR",
  FortiMonitor: "FortiMonitor",
  "FortiSIEM, SOAR & UEBA": "FortiSIEM, SOAR & UEBA",
  FortiCloud: "FortiCloud",
  "IAM, PAM, SRA": "IAM, PAM, SRA",
  FortiExtender: "FortiExtender",
  "ADN & DDoS Products": "ADN & DDoS Products",
  "Voice & Video": "Voice & Video",
  FortiNAC: "FortiNAC",
  "Proxy Products": "Proxy Products",
  "Transceivers-DAC": "Transceivers-DAC",
  "Other Products": "Other Products",
  Accessories: "Accessories",
  Training: "Training",
  "Adv-Services": "Adv-Services",
  LENC: "LENC",
  DataSet: "DataSet",
  Changes: "Changes",
};

// Sheets known NOT to be product categories — not reported as "omitted".
export const SHEET_IGNORE_LIST = ["Cover Sheet", "Index", "General Info", "Ordering Guides", "DataSet", "Changes"];

// Normalizes a sheet name (extra spaces, NBSP, case) so a minor tab-name
// change (double space, uppercase, missing comma) doesn't silently drop the
// whole category.
export function normalizeSheetName(name: string): string {
  return String(name || "")
    .replace(/ /g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export const NORMALIZED_SHEET_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SHEET_CATEGORY_MAP).map(([k, v]) => [normalizeSheetName(k), v])
);

export const NORMALIZED_IGNORE_SET = new Set(SHEET_IGNORE_LIST.map(normalizeSheetName));
