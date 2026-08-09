// `install` and `profile` are Drupal's — a `.install` holds update hooks, a
// `.profile` an install profile — and language-shellscript claims both as well,
// for Arch install scripts and for `~/.profile`.
//
// Both grammars have a first-line rule, but those only fire for a file opening
// with `<?php` or a shebang. A `.profile` is sourced rather than executed, so it
// usually has neither, and the two grammars then scored identically: the winner
// came down to package activation order, which is not stable. A `contentRegex`
// is scored either way, +0.05 when it matches and -0.05 when it does not, so it
// separates the pair in both directions.
//
// These assertions stay inside this package. Which grammar actually *wins* a
// `.profile` depends on language-shellscript, whose grammars reach the
// integration job from whichever Lumine build it checks out rather than from
// this repository — asserting that here would fail whenever the two are out of
// step. What this package owns is its own score moving in the right direction.

const CONTESTED = ["/tmp/x.install", "/tmp/x.profile"];
const DRUPAL = "<?php\n\nfunction mymodule_update_9001() {}\n";
const SHELL = 'export PATH="$HOME/bin:$PATH"\numask 022\n';

describe("PHP grammar file types", () => {
  let grammar;

  beforeEach(async () => {
    await lumine.packages.activatePackage("language-php");
    grammar = lumine.grammars.grammarForScopeName("text.html.php");
  });

  it("still claims the Drupal types", () => {
    for (const fileType of ["install", "module", "profile", "inc"]) {
      expect(grammar.fileTypes).toContain(fileType);
    }
  });

  it("scores a contested file higher with PHP contents than without", () => {
    for (const filePath of CONTESTED) {
      const withPhp = lumine.grammars.getGrammarScore(grammar, filePath, DRUPAL);
      const withShell = lumine.grammars.getGrammarScore(grammar, filePath, SHELL);
      expect(withPhp).toBeGreaterThan(withShell);
    }
  });

  it("swings the score by the full 0.1 between matching and not", () => {
    // 0.05 either way is what breaks the tie, so pin the size of it, not just
    // the direction. Both samples are one line and neither opens with `<?php`,
    // which keeps the +0.5 first-line bonus out of the comparison and leaves
    // the contentRegex as the only difference. Absolute scores are no use here:
    // they also carry +0.1 for Tree-sitter and +0.01 for a grammar the spec
    // host does not consider bundled.
    for (const filePath of CONTESTED) {
      const matching = lumine.grammars.getGrammarScore(grammar, filePath, "; <?php echo 1;");
      const missing = lumine.grammars.getGrammarScore(grammar, filePath, "umask 022");
      expect(matching - missing).toBeCloseTo(0.1, 5);
    }
  });

  it("keeps winning a .php file that happens to hold no PHP tag", () => {
    // The penalty applies to every file this grammar scores, not just the
    // contested ones, so a pure-HTML `.php` template takes it too. Nothing else
    // claims `php`, so it must still come out ahead of the null grammar.
    expect(lumine.grammars.selectGrammar("/tmp/x.php", "<h1>no php here</h1>\n").scopeName).toBe(
      "text.html.php",
    );
  });
});
