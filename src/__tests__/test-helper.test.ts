import fs from "fs-extra";
import path from "path";

import { dumpDir, prepareWorkspace } from "../test-helper";

describe("prepareWorkspace", () => {
  describe("when there are no directories", () => {
    it("can ensure a default directory", () => {
      const workspaceRoot = prepareWorkspace();
      const stats = fs.statSync(workspaceRoot);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe("when there is a directory containing files at the same path as the default directory", () => {
    let workspaceRoot: string;
    let fooFilePath: string;
    let barFilePath: string;

    beforeEach(() => {
      workspaceRoot = prepareWorkspace();
      fooFilePath = path.join(workspaceRoot, "foo");
      barFilePath = path.join(workspaceRoot, "bar");
      fs.writeFileSync(fooFilePath, "");
      fs.writeFileSync(barFilePath, "");
    });

    it("can ensure an empty default directory", () => {
      const workspaceRoot = prepareWorkspace();
      const stats = fs.statSync(workspaceRoot);
      expect(stats.isDirectory()).toBe(true);
      expect(fs.existsSync(fooFilePath)).toBe(false);
      expect(fs.existsSync(barFilePath)).toBe(false);
    });
  });
});

describe("dumpDir", () => {
  it("can get a list of files as an object", () => {
    const workspaceRoot = prepareWorkspace();
    fs.ensureDirSync(path.join(workspaceRoot, "x/y"));
    fs.writeFileSync(path.join(workspaceRoot, "foo"), "FOO");
    fs.writeFileSync(path.join(workspaceRoot, "bar"), "BAR");
    fs.writeFileSync(path.join(workspaceRoot, "x/y", "baz"), "BAZ");

    const dump = dumpDir(workspaceRoot);
    expect(dump).toStrictEqual({
      foo: "FOO",
      bar: "BAR",
      "x/y/baz": "BAZ",
    });
  });
});
