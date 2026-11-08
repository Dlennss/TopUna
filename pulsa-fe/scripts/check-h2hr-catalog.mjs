import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function loadTS(relativePath) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, Intl, Number, Map });
  return exports;
}

const { getBrandLogo } = loadTS('lib/brand-logos.ts');
const { getCatalogCategoryKind } = loadTS('lib/catalog-category.ts');
const { getGuestCategoryPath } = loadTS('lib/category-routes.ts');
assert.equal(getGuestCategoryPath({ id: 1, nama: 'Asuransi' }), '/kategori/1?name=Asuransi');
assert.equal(getCatalogCategoryKind('E-Wallet'), 'wallet');
assert.equal(getCatalogCategoryKind('Paket Data'), 'data');
assert.equal(getCatalogCategoryKind('Tagihan Air'), 'billing');
const { getDisplayProductName, getProductPricing } = loadTS('components/guest/product-card-shared.tsx');
const snapshot = JSON.parse(fs.readFileSync(path.join(root, '../pulsa-be/internal/catalog/pulsa24jam_h2hr.json'), 'utf8'));
const { buildEwalletGroups } = loadTS('lib/ewallet-catalog.ts');
const walletItems = snapshot.Products.filter(p => p.Category === 'E-Wallet' && p.Brand === 'GOPAY').map((p, id) => ({
  id, sku: p.SKU, nama: p.Name, group_name: p.GroupName, tipe_harga: p.PriceType,
  harga_dasar_app: p.Price, aktif: true,
}));
const walletBefore = JSON.stringify(walletItems);
const walletGroups = buildEwalletGroups(walletItems);
assert.deepEqual(Array.from(walletGroups, g => g.key), ['PPOB', 'PULSA']);
assert.deepEqual(Array.from(walletGroups[0].items, p => p.sku).sort(), ['GOPAY', 'PPOBGOPAY']);
assert.ok(walletGroups[1].items.some(p => p.sku === 'GPYOPEN' && p.tipe_harga === 'OPEN_AMOUNT'));
assert.equal(JSON.stringify(walletItems), walletBefore, 'Grouping must not change provider products or prices');
assert.equal(buildEwalletGroups([{ ...walletItems[0], aktif: false }]).length, 0);
assert.equal(buildEwalletGroups([{ ...walletItems[0], sku: 'CEKGOPAY' }]).length, 0);
assert.equal(buildEwalletGroups([{ ...walletItems[0], group_name: '' }])[0].key, 'LAINNYA');
assert.equal(buildEwalletGroups([]).length, 0);
assert.equal(snapshot.Products.length, 15296);
for (const product of snapshot.Products) {
  assert.equal(getDisplayProductName({ nama: product.Name, kategori_nama: product.Category, brand_nama: product.Brand }), product.Name);
}
const open = { tipe_harga: 'OPEN_AMOUNT', harga_dasar_app: 1200, fee_user: 200, fee_guest: 300 };
assert.equal(getProductPricing(open, true).finalPrice, 1400);
assert.equal(getProductPricing(open, false).finalPrice, 1500);
assert.equal(getBrandLogo('Invented Provider'), null);
assert.equal(getBrandLogo('AstraPay').sourcePage, 'https://astrapay.com/');
assert.equal(getBrandLogo('i.saku').sourcePage, 'https://www.i-saku.com/');
assert.equal(getBrandLogo('ShopeePay').src, '/brand-logos/shopeepay-official.svg');

const brands = [...new Map(snapshot.Products.map(p => [p.Brand.toLowerCase(), p.Brand])).values()].sort();
const report = brands.map(brand => ({ brand, logo: getBrandLogo(brand) }));
for (const { brand, logo } of report) {
  if (!logo) continue;
  assert.ok(fs.existsSync(path.join(root, 'public', logo.src)), `Missing asset for ${brand}: ${logo.src}`);
  assert.ok(!logo.src.includes('-generated/'), `Generated logo for ${brand}`);
}
if (process.argv[2]) fs.writeFileSync(path.resolve(process.argv[2]), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ products: snapshot.Products.length, brands: brands.length, mappedLogos: report.filter(p => p.logo).length, missingLogos: report.filter(p => !p.logo).map(p => p.brand) }, null, 2));
