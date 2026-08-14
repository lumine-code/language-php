# language-php

PHP language support.

## Features

- **Grammars**: provides Tree-sitter grammars built from [tree-sitter-php](https://github.com/tree-sitter/tree-sitter-php) and [tree-sitter-phpdoc](https://github.com/claytonrcarter/tree-sitter-phpdoc) and TextMate grammars derived from [atom/language-php](https://github.com/atom/language-php).
- **Syntax highlighting**: full grammar coverage for PHP files, including embedded HTML and PHPDoc.
- **Snippets**: shortcuts for common PHP constructs.

## Installation

To install `language-php` search for it in the Install pane of the Lumine settings, or run the command `lumine --install lumine-code/language-php`.

## Services

- `hyperlink.injection`: consumed to highlight URLs inside PHP files as clickable links.
- `todo.injection`: consumed to highlight `TODO`-style markers inside comments.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
