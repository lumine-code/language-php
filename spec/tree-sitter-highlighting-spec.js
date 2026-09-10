const fs = require("fs");
const path = require("path");
const { Point } = require("lumine");

const highlightsPath = path.join(__dirname, "..", "grammars", "php-shared-highlights.scm");

describe("PHP Tree-sitter highlighting", () => {
  let editor;
  let languageMode;

  beforeEach(async () => {
    await lumine.packages.activatePackage("language-php");
  });

  afterEach(() => editor?.destroy());

  async function setUp(source) {
    editor = await lumine.workspace.open("structural-highlights.php");
    editor.setText(source);
    editor.setGrammar(lumine.grammars.grammarForScopeName("source.php.only"));
    languageMode = editor.getBuffer().languageMode;
    await languageMode.ready;
  }

  function rawCaptures(startRow, endRow) {
    const options =
      startRow == null
        ? undefined
        : {
            startPosition: new Point(startRow, 0),
            endPosition: new Point(endRow, 0),
          };
    const layer = languageMode.rootLanguageLayer;
    return layer.queries.highlightsQuery.captures(layer.tree.rootNode, options);
  }

  it("keeps unbounded containers leaf-rooted and bounded parameters structural", () => {
    const query = fs.readFileSync(highlightsPath, "utf8");

    expect(query).not.toMatch(/\((?:array_creation_expression|list_literal)\s*\n\s*"/);
    expect(query).toContain("(#is? test.childOfType array_creation_expression)");
    expect(query).toContain("(#is? test.childOfType list_literal)");
    expect(query).toContain("(#is? test.childOfType formal_parameters)");
    expect(query).toContain("(simple_parameter\n  name: (variable_name)");
    expect(query.match(/adjust\.endBeforeFirstMatchOf "\\\\r\?\$"/g)?.length).toBe(2);
  });

  it("highlights parameter names, sigils, and delimiters", async () => {
    const source = "function f($value) {}";
    await setUp(source);

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
    await setUp(source);

    const lines = source.split("\n");
    const scopesAt = (row, column) =>
      editor.scopeDescriptorForBufferPosition([row, column]).getScopesArray();
    expect(scopesAt(0, lines[0].indexOf("Alpha"))).toContain("constant.other.enum.php");
    expect(scopesAt(1, lines[1].lastIndexOf("array"))).toContain(
      "support.function.builtin.array.php",
    );
    expect(scopesAt(1, lines[1].indexOf("("))).toContain(
      "punctuation.definition.parameters.begin.bracket.round.php",
    );
    expect(scopesAt(1, lines[1].indexOf(")"))).toContain(
      "punctuation.definition.parameters.end.bracket.round.php",
    );
    expect(scopesAt(2, 0)).toContain("support.function.builtin.list.php");
    expect(scopesAt(2, 4)).toContain("punctuation.definition.parameters.begin.bracket.round.php");
    expect(scopesAt(2, lines[2].indexOf(")"))).toContain(
      "punctuation.definition.parameters.end.bracket.round.php",
    );
  });

  it("keeps leaf-rooted captures viewport-local", async () => {
    await setUp(`function f(
  $first,
  $second,
) {
  $array = array(
    1,
    2,
  );
}`);

    const parameterCaptures = rawCaptures(2, 4).filter(
      (capture) =>
        capture.name === "variable.parameter.php" ||
        capture.name.startsWith("punctuation.definition.parameters."),
    );
    expect(parameterCaptures.every((capture) => capture.node.startPosition.row >= 2)).toBe(true);
    expect(
      parameterCaptures.some(
        (capture) =>
          capture.name === "variable.parameter.php" && capture.node.startPosition.row === 2,
      ),
    ).toBe(true);
    expect(
      parameterCaptures.some(
        (capture) =>
          capture.name === "punctuation.definition.parameters.end.bracket.round.php" &&
          capture.node.startPosition.row === 3,
      ),
    ).toBe(true);

    const arrayCaptures = rawCaptures(6, 8).filter((capture) =>
      capture.name.startsWith("punctuation.definition.parameters."),
    );
    expect(arrayCaptures.every((capture) => capture.node.startPosition.row >= 6)).toBe(true);
    expect(arrayCaptures.some((capture) => capture.node.startPosition.row === 7)).toBe(true);
  });

  it("bounds raw work inside a 6000-row array parent", async () => {
    const lines = ["$value = array("];
    for (let i = 0; i < 6000; i++) lines.push(`  $value_${i},`);
    lines.push(");");
    await setUp(lines.join("\r\n"));

    const tileCaptures = rawCaptures(2998, 3004);
    expect(tileCaptures.length).toBeLessThanOrEqual(64);
    expect(
      tileCaptures.every(
        (capture) =>
          capture.node.startPosition.row >= 2998 && capture.node.startPosition.row < 3004,
      ),
    ).toBe(true);
  });

  it("keeps escapes local inside a 6000-row encapsed string", async () => {
    const query = fs.readFileSync(highlightsPath, "utf8");
    expect(query).not.toContain("(encapsed_string\n");
    expect(query).not.toContain("(string\n");
    expect(query).toContain("(#is? test.childOfType encapsed_string)");

    const lines = ['$value = "'];
    for (let index = 0; index < 6000; index++) lines.push("  \\n");
    lines.push('";');
    await setUp(lines.join("\r\n"));
    expect(languageMode.tree.rootNode.hasError).toBe(false);

    const openingColumn = editor.lineTextForBufferRow(0).lastIndexOf('"');
    expect(editor.scopeDescriptorForBufferPosition([0, openingColumn]).getScopesArray()).toContain(
      "punctuation.definition.string.begin.php",
    );
    expect(editor.scopeDescriptorForBufferPosition([6001, 0]).getScopesArray()).toContain(
      "punctuation.definition.string.end.php",
    );

    const escapes = rawCaptures(3000, 3006).filter(
      (capture) => capture.name === "constant.character.escape.php",
    );
    expect(escapes.length).toBe(6);
    expect(
      escapes.every(
        (capture) =>
          capture.node.startPosition.row >= 3000 && capture.node.startPosition.row < 3006,
      ),
    ).toBe(true);
  });

  it("keeps trait method adaptations local inside a large use list", async () => {
    const lines = ["<?php", "class Example {", "  use Trait {"];
    for (let index = 0; index < 6000; index++) {
      lines.push(`    Trait::method_${index} as alias_${index};`);
    }
    lines.push("  }", "}");
    await setUp(lines.join("\r\n"));
    expect(languageMode.tree.rootNode.hasError).toBe(false);

    const methodColumn = editor.lineTextForBufferRow(3).indexOf("method_0");
    expect(editor.scopeDescriptorForBufferPosition([3, methodColumn]).getScopesArray()).toContain(
      "support.other.function.method.php",
    );
    const startRow = 3000;
    const endRow = startRow + 6;
    const captures = rawCaptures(startRow, endRow);
    expect(captures.length).toBeLessThanOrEqual(64);
    expect(
      captures
        .filter(({ name }) => name === "support.other.function.method.php")
        .every(({ node }) => node.startPosition.row >= startRow && node.startPosition.row < endRow),
    ).toBe(true);

    const query = fs.readFileSync(highlightsPath, "utf8");
    expect(query).not.toMatch(/\(use_list\s+\(_/);
    expect(query).toContain('(#is? test.typeAt "parent.parent.parent use_list")');
  });
});
