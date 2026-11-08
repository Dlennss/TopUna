export function getCatalogCategoryKind(name: string) {
  const key = name.trim().toLowerCase();
  if (key === "pulsa") return "pulsa";
  if (key.includes("data")) return "data";
  if (key === "e-wallet" || key === "e-money") return "wallet";
  if (key === "bpjs") return "bpjs";
  if (["asuransi", "internet pascabayar", "internet & telco", "multifinance", "pajak daerah", "pascabayar", "hp pascabayar", "pembayaran", "samsat", "tagihan air", "pdam", "tagihan gas", "gas negara"].includes(key)) return "billing";
  return "generic";
}
