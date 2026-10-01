; Annotation candidates are filtered by the target grammar.
([
  (description)
  (text)
  (uri)
] @injection.owner @injection.content
  (#set! injection.language "hyperlink")
  (#set! injection.language-scope "none"))

([
  (description)
  (text)
] @injection.owner @injection.content
  (#set! injection.language "todo")
  (#set! injection.language-scope "none"))
