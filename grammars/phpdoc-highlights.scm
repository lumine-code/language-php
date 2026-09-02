
((document) @punctuation.definition.begin.comment.phpdoc.php
  (#set! adjust.startAndEndAroundFirstMatchOf "^/\\*\\*"))

((document) @punctuation.definition.end.comment.phpdoc.php
  (#set! adjust.startAndEndAroundFirstMatchOf "(?:\\*)?\\*/$"))

(tag_name) @keyword.other.tag.phpdoc.php
(primitive_type) @storage.type.primitive.phpdoc.php
(named_type) @storage.type.instance.phpdoc.php
(variable_name) @variable.other.phpdoc.php
(uri) @markup.underline.link.phpdoc.php

(inline_tag "{" @punctuation.definition.tag.begin.bracket.curly.phpdoc.php)
(inline_tag "}" @punctuation.definition.tag.end.bracket.curly.phpdoc.php)

(array_type "<" @punctuation.definition.generic.begin.bracket.angle.phpdoc.php)
(array_type ">" @punctuation.definition.generic.end.bracket.angle.phpdoc.php)
(array_type "," @punctuation.separator.generic.comma.phpdoc.php)
