const path = require("path");

// Compiles every query this package declares against its committed wasm.
//
// The editor's own sweep (`spec/grammar-query-validation-spec.js`) only covers
// grammars it ships, so a package living in its own repository needs this or it
// has no query gate at all — and a broken highlights query does NOT fail the
// grammar's other specs. LanguageLayer degrades to a placeholder instead, so
// everything else stays green while highlighting is silently dead.
//
// It matters more here than in a single-grammar package: `php.json` and
// `php-only.json` name the same four query files against two
// different wasms, so a node type present in one dialect and absent from the
// other breaks exactly one of them, and only this spec would say which.
//
// Bump EXPECTED_GRAMMARS when a grammar config is added or removed. Its job is
// to catch a config dropped by a JSON error or a renamed directory, which a
// count derived at runtime could never do.

// Four Tree-sitter configs: `text.html.php` (the mixed HTML+PHP root),
// `source.php` (PHP between `<?php` delimiters), `source.php.only` (bare PHP,
// for template languages) and the PHPDoc dialect.
const PACKAGE_NAME = "language-php";
const EXPECTED_GRAMMARS = 4;

describe(`${PACKAGE_NAME} Tree-sitter queries`, () => {
  let grammars;

  beforeEach(async () => {
    jasmine.useRealClock();
    const pack = await lumine.packages.activatePackage(path.resolve(__dirname, ".."));

    // Every bundled grammar is registered too; keep only this package's.
    grammars = pack.grammars
      .filter((grammar) => grammar.constructor.name === "TreeSitterGrammar")
      .filter((grammar) => grammar.packageName === PACKAGE_NAME);
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

  it("routes bare and mixed PHP injection names to the matching dialects", () => {
    // Blade reaches the bare parser through `php_only`; fenced Markdown reaches
    // it through `php`, because a fence normally omits the opening PHP tag.
    for (const languageString of ["php", "php_only", "php-only"]) {
      const grammar = lumine.grammars.treeSitterGrammarForLanguageString(languageString);
      expect(grammar?.scopeName).toBe("source.php.only");
    }

    for (const languageString of ["html+php", "php-html"]) {
      const grammar = lumine.grammars.treeSitterGrammarForLanguageString(languageString);
      expect(grammar?.scopeName).toBe("text.html.php");
    }

    expect(lumine.grammars.treeSitterGrammarForLanguageString("internal-php")?.scopeName).toBe(
      "source.php",
    );
    expect(lumine.grammars.treeSitterGrammarForLanguageString("phpdoc")?.scopeName).toBe(
      "comment.block.documentation.phpdoc.php",
    );
  });
});
