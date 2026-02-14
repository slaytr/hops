#!/usr/bin/env node

import { readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = join(__dirname, '..', 'src');

async function checkDirectories(dir, basePath = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const directories = entries.filter(entry => entry.isDirectory());
  const files = entries.filter(entry => entry.isFile());

  let hasErrors = false;

  // Check if current directory has index.ts (except root src)
  if (basePath !== '') {
    const hasIndex = files.some(file => file.name === 'index.ts');
    if (!hasIndex) {
      console.error(`❌ Missing index.ts in: src/${basePath}`);
      hasErrors = true;
    } else {
      console.log(`✓ Found index.ts in: src/${basePath}`);
    }
  }

  // Recursively check subdirectories
  for (const subdir of directories) {
    const subdirPath = join(dir, subdir.name);
    const subdirBasePath = basePath ? `${basePath}/${subdir.name}` : subdir.name;
    const subdirHasErrors = await checkDirectories(subdirPath, subdirBasePath);
    hasErrors = hasErrors || subdirHasErrors;
  }

  return hasErrors;
}

async function main() {
  console.log('Checking for index.ts files in all directories...\n');

  try {
    const hasErrors = await checkDirectories(srcDir);

    if (hasErrors) {
      console.error('\n❌ Some directories are missing index.ts files!');
      process.exit(1);
    } else {
      console.log('\n✅ All directories have index.ts files!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
