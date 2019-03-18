import { existsSync, mkdir, writeFile } from "fs";
import { join } from "path";
import { promisify } from "util";
import { createHash } from "crypto";

const makedir = promisify(mkdir);
const write = promisify(writeFile);

export async function dump(object: any) {
  const tmpDir = join(__dirname, "tmp");
  if (!existsSync(tmpDir)) {
    await makedir(tmpDir, { mode: 775 });
  }
  const hash = createHash("md5");
  const now = new Date().toString();
  const path = join(tmpDir, `debug-${hash}-${now}.json`);
  let cache: any[] = [];
  // @ts-ignore
  console.log(JSON.stringify(object), function(key: string, value: any) {
    if (typeof value === "object" && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Duplicate reference found
        try {
          // If this value does not reference a parent it can be deduped
          return JSON.parse(JSON.stringify(value));
        } catch (error) {
          // discard key if value cannot be deduped
          return;
        }
      }
      // Store value in our collection
      cache.push(value);
    }
    return value;
  });
  console.log("Writing debug to: ", path);
}
