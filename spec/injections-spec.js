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

  it("keeps PHPDoc annotations inside the documentation layer and ordinary comments in PHP", async () => {
    await lumine.packages.activatePackage(packagePath("language-hyperlink"));
    await lumine.packages.activatePackage(packagePath("language-todo"));
    await setUp(
      "<?php\n// TODO https://example.com/plain\n" +
        "/** TODO https://example.com/docs */\n" +
        "/**** TODO https://example.com/ordinary */\n",
    );
    const annotations = editor.languageMode
      .getAllInjectionLayers()
      .filter((layer) => ["text.todo", "text.hyperlink"].includes(layer.grammar.scopeName));
    expect(annotations.some((layer) => layer.depth === 2)).toBe(true);
    const host = annotations.filter((layer) => layer.depth === 1);
    expect(host.length).toBe(4);
    expect(host.every((layer) => layer.getCurrentRanges()[0].start.row !== 2)).toBe(true);
  });

  it("annotates real string_content leaves while excluding PHP interpolation", async () => {
    await lumine.packages.activatePackage(packagePath("language-hyperlink"));
    const text = '<?php $url = "$prefix https://example.com/path";';
    await setUp(text);
    const links = editor.languageMode
      .getAllInjectionLayers()
      .filter((layer) => layer.grammar.scopeName === "text.hyperlink");
    expect(links.length).toBe(1);
    expect(links[0].getCurrentRanges().map((range) => editor.getTextInBufferRange(range))).toEqual([
      " https://example.com/path",
    ]);
    const position = editor.getBuffer().positionForCharacterIndex(text.indexOf("/path"));
    expect(editor.scopeDescriptorForBufferPosition(position).getScopesArray()).toContain(
      "markup.underline.link.hyperlink",
    );
  });
});
