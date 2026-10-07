describe("PHP grouped namespace imports", () => {
  let editor;

  beforeEach(async () => {
    await lumine.packages.activatePackage("language-php");
    editor = await lumine.workspace.open();
  });

  afterEach(() => editor?.destroy());

  for (const [scope, prefix] of [
    ["source.php", "<?php "],
    ["source.php.only", ""],
  ]) {
    it(`parses absolute grouped imports in ${scope}`, async () => {
      editor.setGrammar(lumine.grammars.grammarForScopeName(scope));
      editor.setText(`${prefix}use \\Vendor\\Package\\{Thing, Other};\n`);
      await editor.languageMode.ready;
      const root = editor.languageMode.tree.rootNode;
      expect(root.hasError).toBe(false);
      expect(root.descendantsOfType("namespace_use_group").length).toBe(1);
    });
  }
});
