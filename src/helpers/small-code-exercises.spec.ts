import { filesInDirectory, transformNumeric, containsDigit } from "./small-code-exercises";

describe("readCSVFiles", () => {
  it("should return an array of CSV files in the specified directory", async () => {
    const files = await filesInDirectory("./files", ".csv");

    expect(files).toContain("export.csv");
    expect(files).toContain("import.csv");
    expect(files).not.toContain("file.csv.pdf");
    expect(files).not.toContain("excel.xls");
    expect(files).not.toContain("text.txt");
  });
});

describe("transformNumeric", () => {
  it("should transform numeric strings to numbers", () => {
    const input = ["1", "2.5", "3", "4.0"];
    const output = transformNumeric(input);

    expect(output).toEqual([1, 2.5, 3, 4]);
  });

  it("should leave non-numeric strings unchanged", () => {
    const input = ["test", "string", "123abc"];
    const output = transformNumeric(input);

    expect(output).toEqual(input);
  });

  it("should throw an error if the input array contains a non-string item", () => {
    const input: any[] = ["test", { some: "test" }];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(() => transformNumeric(input)).toThrowError("Array contains item that is not string");
  });
});

describe("containsDigit", () => {
  it("should return true if the string contains a digit", () => {
    const input = "test1";

    expect(containsDigit(input)).toBe(true);
  });

  it("should return false if the string does not contain a digit", () => {
    const input = "test";

    expect(containsDigit(input)).toBe(false);
  });
});
