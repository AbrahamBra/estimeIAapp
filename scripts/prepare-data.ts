import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const OUTPUT_DIR = join(process.cwd(), 'static', 'data', 'bpe');

const CATEGORY_MAP: Record<string, string> = {
  A: 'services',
  B: 'shops',
  C: 'schools',
  D: 'health',
  E: 'transit',
  F: 'sports',
};

async function main() {
  console.log('Preparing BPE data...');

  const csvPath = join(process.cwd(), 'scripts', 'bpe24_ensemble_xy.csv');
  if (!existsSync(csvPath)) {
    console.error(`CSV not found at ${csvPath}`);
    console.error('Download from INSEE and place the CSV here, then re-run.');
    process.exit(1);
  }

  const { createReadStream } = await import('fs');
  const { createInterface } = await import('readline');

  const rl = createInterface({ input: createReadStream(csvPath) });
  const byDept: Record<string, Array<{ lat: number; lon: number; type: string; category: string; name: string }>> = {};

  let header: string[] = [];
  let lineNum = 0;

  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) {
      header = line.split(';').map(h => h.trim().replace(/"/g, ''));
      continue;
    }

    const cols = line.split(';').map(c => c.trim().replace(/"/g, ''));
    const typeCode = cols[header.indexOf('TYPEQU')] ?? '';
    const dept = cols[header.indexOf('DEP')] ?? '';
    const latStr = cols[header.indexOf('LATITUDE')];
    const lonStr = cols[header.indexOf('LONGITUDE')];
    const libelle = cols[header.indexOf('LIBELLE')] ?? typeCode;

    if (!latStr || !lonStr || !dept) continue;

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon)) continue;

    const domainLetter = typeCode.charAt(0);
    const category = CATEGORY_MAP[domainLetter];
    if (!category) continue;

    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push({ lat, lon, type: typeCode, category, name: libelle });
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const [dept, items] of Object.entries(byDept)) {
    const outPath = join(OUTPUT_DIR, `${dept}.json`);
    writeFileSync(outPath, JSON.stringify(items));
    console.log(`${dept}: ${items.length} items`);
  }

  console.log(`Done. ${Object.keys(byDept).length} departments written to ${OUTPUT_DIR}`);
}

main().catch(console.error);
