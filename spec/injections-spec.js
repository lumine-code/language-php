const fs = require("fs");
const path = require("path");

const packagePath = (name) => {
  const sibling = path.resolve(__dirname, "..", "..", name);
  return fs.existsSync(sibling) ? sibling : name;
};

describe("PHP static language injections", () => {
  let editor;

  beforeEach(async () => {
    for (const name of ["language-php", "language-html", "language-css"]) {
      await lumine.packages.activatePackage(packagePath(name));
    }
  });

  afterEach(() => editor?.destroy());

  async function setUp(source) {
    editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("text.html.php"));
    editor.setText(source);
    await editor.languageMode.ready;
    await editor.languageMode.atGrammarSettlement();
  }

  const htmlLayers = () =>
    editor.languageMode
      .getAllInjectionLayers()
      .filter((layer) => layer.grammar.scopeName === "text.html.basic");

  it("keeps HTML across nested PHP branches in one parsed document", async () => {
    await setUp("<article><?php if ($ok) { ?><b>Hi</b><?php } ?></article>");
    expect(htmlLayers().length).toBe(1);
    expect(htmlLayers()[0].tree.rootNode.hasError).toBe(false);
    expect(htmlLayers()[0].tree.rootNode.descendantsOfType("element").length).toBe(2);
  });

  it("injects current heredoc string_content nodes while excluding PHP interpolation", async () => {
    await setUp("<?php\n$markup = <<<HTML\n<div>$value</div>\nHTML;\n");
    expect(htmlLayers().length).toBe(1);
    expect(htmlLayers()[0].getCurrentRanges().length).toBe(2);
    const index = editor.getText().indexOf("$value");
    const position = editor.getBuffer().positionForCharacterIndex(index + 1);
    expect(editor.scopeDescriptorForBufferPosition(position).getScopesArray()).not.toContain(
      "text.html.basic",
    );
  });

  it("injects nowdoc literals using their exact declared language alias", async () => {
    await setUp("<?php\n$markup = <<<'HTML'\n<div>Heading</div>\nHTML;\n");
    expect(htmlLayers().length).toBe(1);
    expect(htmlLayers()[0].tree.rootNode.hasError).toBe(false);
  });
});
