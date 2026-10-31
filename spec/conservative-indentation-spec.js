const path = require("node:path");

describe("language-php conservative indentation", () => {
  let editor;

  beforeEach(async () => {
    const pack = await lumine.packages.activatePackage(path.resolve(__dirname, ".."));
    for (const grammar of pack.grammars) {
      if (grammar.queryPaths?.indentsQuery) await grammar.getQuery("indentsQuery");
    }
    editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("source.php"));
    editor.update({ tabLength: 2, softTabs: true });
  });

  afterEach(() => editor?.destroy());

  async function setText(source) {
    editor.setText(source);
    expect(await editor.whenGrammarSettled()).toBe(true);
  }

  async function enter(source, expected, row = 0) {
    await setText(source);
    editor.setCursorBufferPosition([row, Infinity]);
    editor.insertText("\n", { autoIndent: true, autoIndentNewline: true });
    await editor.whenGrammarSettled();
    expect(editor.lineTextForBufferRow(row + 1))
      .withContext(source)
      .toBe(" ".repeat(expected));
    expect(editor.getCursorBufferPosition().column).withContext(source).toBe(expected);
  }

  it("indents unambiguous delimiters and leaves one-line operations alone", async () => {
    await enter("<?php function run() {", 2);
    for (const source of ["<?php function run() {}", '<?php $text = "{";', "<?php // {"])
      await enter(source, 0);
  });

  it("dedents a closing brace typed after Enter", async () => {
    await enter("<?php function run() {", 2);
    editor.insertText("}", { autoIndent: true, autoDecreaseIndent: true });
    await editor.whenGrammarSettled();
    expect(editor.lineTextForBufferRow(1)).toBe("}");
  });

  it("preserves whitespace inside multiline literals and comments when reindenting", async () => {
    const source =
      "<?php\n$text = <<<TXT\n       literal {\n raw }\nTXT;\n/* head\n     aligned\n*/";
    await setText(source);
    const before = editor.getText().split("\n");
    await editor.autoIndentBufferRows(0, editor.getLastBufferRow());
    for (const row of [2, 3, 4, 6, 7]) {
      expect(editor.lineTextForBufferRow(row)).withContext(String(row)).toBe(before[row]);
    }
  });
});
