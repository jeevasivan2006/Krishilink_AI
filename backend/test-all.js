import fs from 'fs';
import path from 'path';

async function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      await scan(fullPath);
    } else if (fullPath.endsWith('.js')) {
      try {
        await import('file://' + fullPath);
      } catch (err) {
        console.error(`Error importing ${fullPath}:`, err.message);
        process.exitCode = 1;
      }
    }
  }
}

scan(path.join(process.cwd(), 'src')).then(() => {
  if (!process.exitCode) console.log("All files imported successfully.");
});
