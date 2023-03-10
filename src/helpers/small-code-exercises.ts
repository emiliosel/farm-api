import fs from "fs/promises";
import path from "path";

export async function filesInDirectory(dir: string, extName: string): Promise<string[]> {
  const files = await fs.readdir(dir);

  return files.filter(file => path.extname(file) === extName);
}

export const transformNumeric = (items: string[]) => items.map(item => {
  if (typeof item !== "string") {
    throw new Error("Array contains item that is not string");
  }

  const num = Number(item);

  if (isNaN(num)) {
    return item;
  }

  return num;
});

export const containsDigit = (str: string) => /\d/.test(str);
