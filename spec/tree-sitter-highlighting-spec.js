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

  it("highlights array/list syntax and enum cases with local captures", async () => {
    const source = `enum Choice { case Alpha; }
$array = array(1, 2);
list($first, $second) = $array;`;
    const editor = await lumine.workspace.open("containers.php");
    editor.setText(source);
    editor.setGrammar(lumine.grammars.grammarForScopeName("source.php.only"));
    await editor.getBuffer().languageMode.ready;

    const lines = source.split("\n");
    const scopesAt = (row, column) =>
      editor.scopeDescriptorForBufferPosition([row, column]).getScopesArray();
    expect(scopesAt(0, lines[0].indexOf("Alpha"))).toContain("constant.other.enum.php");
    expect(scopesAt(1, lines[1].lastIndexOf("array"))).toContain(
      "support.function.builtin.array.php",
    );
    expect(scopesAt(2, 0)).toContain("support.function.builtin.list.php");
    expect(scopesAt(2, 4)).toContain("punctuation.definition.parameters.begin.bracket.round.php");
  });
});
