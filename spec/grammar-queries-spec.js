const path = require("path");

// Compiles every query this package declares against its committed wasm.
//
// The editor's own sweep (`spec/grammar-query-validation-spec.js`) only covers
// grammars it ships, so a package living in its own repository needs this or it
// has no query gate at all — and a broken highlights query does NOT fail the
// grammar's other specs. LanguageLayer degrades to a placeholder instead, so
// everything else stays green while highlighting is silently dead.
//
// It matters more here than in a single-grammar package: `tree-sitter-php.json`
// and `tree-sitter-php-only.json` name the same four query files against two
// different wasms, so a node type present in one dialect and absent from the
// other breaks exactly one of them, and only this spec would say which.
//
// Bump EXPECTED_GRAMMARS when a grammar config is added or removed. Its job is
// to catch a config dropped by a JSON error or a renamed directory, which a
// count derived at runtime could never do.

// Four Tree-sitter configs: `text.html.php` (the mixed HTML+PHP root),
// `source.php` (PHP between `<?php` delimiters), `source.php.only` (bare PHP,
// for template languages) and the PHPDoc dialect. The two TextMate grammars
// beside them are not counted.
const PACKAGE_NAME = "language-php";
const EXPECTED_GRAMMARS = 4;

describe(`${PACKAGE_NAME} Tree-sitter queries`, () => {
  let grammars;

  beforeEach(async () => {
    jasmine.useRealClock();
    await lumine.packages.activatePackage(PACKAGE_NAME);

    // Every bundled grammar is registered too; keep only this package's.
    const packageDir = path.resolve(__dirname, "..");
    grammars = lumine.grammars
      .getGrammars({ includeTreeSitter: true })
      .filter((grammar) => grammar.constructor.name === "TreeSitterGrammar")
      .filter((grammar) => grammar.grammarFilePath?.startsWith(packageDir));
  });

  it(`registers all ${EXPECTED_GRAMMARS} Tree-sitter grammar config(s)`, () => {
    expect(grammars.length).toBe(EXPECTED_GRAMMARS);
  });

  it("loads every parser and compiles every query", async () => {
    const failures = [];
    for (const grammar of grammars) {
      // Rejects outright if the wasm's ABI is outside the runtime's window.
      await grammar.getLanguage();

      for (const key of Object.keys(grammar.queryPaths ?? {})) {
        if (!key.endsWith("Query")) continue;
        try {
          await grammar.getQuery(key);
        } catch (error) {
          const descriptor = error.queryDescriptor ?? grammar.describeQueryError(error, key);
          failures.push(grammar.constructor.formatQueryErrorDescriptor(descriptor));
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("resolves the bare-PHP dialect from a template language's injection string", () => {
    // Blade, and any other template grammar, reaches this parser by returning
    // "php_only" from an injection point. `text.html.php` carries an unanchored
    // `php|PHP` that already matches that string at length 3, and the longest
    // match wins — so this asserts the anchored regex actually takes it.
    for (const languageString of ["php_only", "php-only"]) {
      const grammar = lumine.grammars.treeSitterGrammarForLanguageString(languageString);
      expect(grammar?.scopeName).toBe("source.php.only");
    }

    // And that widening it did not steal either sibling's string.
    expect(lumine.grammars.treeSitterGrammarForLanguageString("internal-php")?.scopeName).toBe(
      "source.php",
    );
    expect(lumine.grammars.treeSitterGrammarForLanguageString("phpdoc")?.scopeName).toBe(
      "comment.block.documentation.phpdoc.php",
    );
  });
});
