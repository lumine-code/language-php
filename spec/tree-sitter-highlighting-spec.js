describe("PHP Tree-sitter highlighting", () => {
  beforeEach(async () => {
    lumine.config.set("editor.useTreeSitterParsers", true);
    await lumine.packages.activatePackage("language-php");
  });

  it("highlights parameter names, sigils, and delimiters", async () => {
    const source = "function f($value) {}";
    const editor = await lumine.workspace.open("parameters.php");
    editor.setText(source);
    editor.setGrammar(lumine.grammars.grammarForScopeName("source.php.only"));
    await editor.getBuffer().languageMode.ready;

    const scopesAt = (column) =>
      editor.scopeDescriptorForBufferPosition([0, column]).getScopesArray();
    const openParen = source.indexOf("(");
    const sigil = source.indexOf("$");
    const closeParen = source.indexOf(")");

    expect(scopesAt(openParen)).toContain(
      "punctuation.definition.parameters.begin.bracket.round.php",
    );
    expect(scopesAt(sigil)).toContain("variable.parameter.php");
    expect(scopesAt(sigil)).toContain("punctuation.definition.variable.php");
    expect(scopesAt(sigil + 1)).toContain("variable.parameter.php");
    expect(scopesAt(closeParen)).toContain(
      "punctuation.definition.parameters.end.bracket.round.php",
    );
  });
});
