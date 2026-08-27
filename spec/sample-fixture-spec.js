const path = require("path");

// The fixture beside this file is a plain sample of the language — the file to
// open when you want to look at the highlighting rather than assert on it. This
// spec is only what stops the sample quietly rotting: the grammar still claims
// it, and it still tokenizes.

describe("PHP sample fixtures", () => {
  beforeEach(async () => {
    await lumine.packages.activatePackage("language-html");
    await lumine.packages.activatePackage("language-php");
    lumine.config.set("editor.useTreeSitterParsers", true);
  });

  it("parses sample.php without error", async () => {
    const editor = await lumine.workspace.open(path.join(__dirname, "fixtures", "sample.php"));
    const languageMode = editor.getBuffer().getLanguageMode();
    await languageMode.ready;

    expect(editor.getGrammar().scopeName).toBe("text.html.php");
    expect(languageMode.tree.rootNode.hasError).toBe(false);
  });
});
