; Existing literal and comment contents are user data, including whitespace.
([(string) (encapsed_string) (heredoc) (nowdoc) (comment)] @preserve
  (#is? indent.reindent true)
  (#is-not? indent.matchesCurrentRow startPosition)
  (#set! indent.force true))



["{" "(" "["] @indent
["}" ")" "]"] @dedent

; if ($foo):
(colon_block ":" @indent)

["endif" "endfor" "endforeach" "enddeclare" "endswitch"] @dedent
