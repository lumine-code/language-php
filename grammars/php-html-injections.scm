; All text fragments belong to one HTML document across embedded PHP blocks.
((text) @injection.owner @injection.content
  (#set! injection.language "html")
  (#set! injection.combined)
  (#set! injection.language-scope "none"))

((heredoc
  identifier: (heredoc_start) @injection.language
  value: (heredoc_body (string_content) @injection.content)) @injection.owner)

((nowdoc
  identifier: (heredoc_start) @injection.language
  value: (nowdoc_body (nowdoc_string) @injection.content)) @injection.owner)

((comment) @injection.owner @injection.content
  (#match? @injection.content "^/\\*\\*")
  (#not-match? @injection.content "^/\\*\\*\\*")
  (#set! injection.language "phpdoc"))
