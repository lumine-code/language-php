describe("PHP upstream parser regressions", () => {
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

    it(`accepts keyword constants and casts of match expressions in ${scope}`, async () => {
      editor.setGrammar(lumine.grammars.grammarForScopeName(scope));
      editor.setText(
        `${prefix}const void = 1, mixed = 2;\n(int) match ($value) { default => 1 };\n`,
      );
      expect(await editor.whenGrammarSettled()).toBeTrue();
      const root = editor.getSyntaxNodeAtBufferPosition([0, 0], (node) => !node.parent);
      expect(root.hasError).toBe(false);
      expect(
        root.descendantsOfType("const_element").map((node) => node.firstNamedChild.text),
      ).toEqual(["void", "mixed"]);
      const [cast] = root.descendantsOfType("cast_expression");
      expect(cast.childForFieldName("value").type).toBe("match_expression");
    });
  }
});
