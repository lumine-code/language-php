describe("PHP embedded delimiter ranges", () => {
  let editor;
  beforeEach(async () => {
    await lumine.packages.activatePackage("language-html");
    await lumine.packages.activatePackage("language-php");
    editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("text.html.php"));
  });
  afterEach(async () => {
    editor.destroy();
    await lumine.packages.deactivatePackage("language-php");
    await lumine.packages.deactivatePackage("language-html");
  });
  const scopesAt = (needle) =>
    editor
      .scopeDescriptorForBufferPosition(
        editor.getBuffer().positionForCharacterIndex(editor.getText().indexOf(needle)),
      )
      .getScopesArray();
  const embedded = (needle) =>
    scopesAt(needle).some((scope) => /^meta\.embedded\.(line|block)\.php$/.test(scope));
  for (const [label, source, inside, outside] of [
    ["one closed block", "<?php echo 1; ?> <div>outside</div>", ["echo 1"], ["outside"]],
    [
      "multiple closed blocks",
      "<?php echo 1; ?> <div>outside</div> <?php echo 2; ?> <span>after</span>",
      ["echo 1", "echo 2"],
      ["outside", "after"],
    ],
    [
      "a closed block followed by an open block",
      "<?php echo 1; ?> <div>outside</div> <?php echo 2;",
      ["echo 1", "echo 2"],
      ["outside"],
    ],
  ]) {
    it(`keeps ${label} separate from the actual HTML positions`, async () => {
      editor.setText(source);
      await editor.languageMode.ready;
      await editor.languageMode.atTransactionEnd();
      for (const needle of inside) expect(embedded(needle)).toBe(true);
      for (const needle of outside) expect(embedded(needle)).toBe(false);
    });
  }
});
