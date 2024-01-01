const integer_type = choice('u8', 'i8', 'u16', 'i16', 'u32', 'i32', 'u64', 'i64', 'isize', 'usize')

// define the grammar
module.exports = grammar ({
  name: 'rustfyp',

  rules: {
    source_file: $ => seq(
      optional($.shebang),
      repeat($._statement_list),
    ),

    _statement_list: $ => prec.left(sepTrailing(
      choice('\n', ';'), $._statement_list, $._statement
    )),

    // simple statement rule (variable declaration)
    _statement: $ => choice(
      $.let_declaration,
      $.empty_statement
    ),

    // simple expression rule
    _expression: $ => choice(
      $.identifier,
      $.literal,
      $.method_call,
      $.macro_invocation,
      $.reference_expression
    ),

    _pattern: $ => choice(
      $.identifier,
      $.mut_pattern,
    ),

    // identifier rule
    identifier: $ => /[a-zA-Z_]\w*/,

    _integer_literal: $ => token(seq(
      choice(
        // decimal
        /[0-9][0-9_]*/,
        // hex
        /0x[0-9a-fA-F_]+/,
        // oct
        /0o[0-7_]+/,
        // binary
        /0b[01_]+/,
      ),
      optional(integer_type),
    )),

    // literal rule (only integers for now)
    literal: $ => choice(
      $._integer_literal, // integer literals
      /"[^"]*"/, // string literals
    ),

    shebang: _ => /#![\s]*[^\[\s]+/,

    mutable_specifier: $ => 'mut',

    // variable declaration rule
    let_declaration: $ => seq(
      'let',
      optional($.mutable_specifier),
      $._pattern,
      optional(seq(
        ':',
        $.type_expression,
      )),
      optional(seq(
        '=',
        $._expression,
      )),
      ';',
    ),

    function_declaration: $ => seq(
      'fn',
      $.identifier,
      $.parameters,
      optional(seq(
        '->',
        $.type_expression),
      ),
      '!',
      $.block
    ),

    mut_pattern: $ => prec(-1, seq(
      $.mutable_specifier,
      $._pattern,
    )),

    type_expression: $ => choice(
      integer_type,
      $.identifier
    ),

    parameters: $ => seq(
      '(',
      commaSep(seq($.identifier, ':', $.type_expression)),
      ')'
    ),

    block: $ => seq(
      '{',
      choice(
        optional($._statement_list),
        optional($._expression)
      ),
      '}'
    ),

    empty_statement: $ => ';',

    method_call: $ => seq(
      $.identifier,
      '.',
      $.identifier,
      '(',
      optional($.expression_list),
      ')'
    ),

    macro_invocation: $ => seq(
      $.identifier,
      '!',
      $.macro_arguments
    ),

    macro_arguments: $ => seq(
      '(',
      optional($.expression_list),
      ')'
    ),

    expression_list: $ => commaSep1($._expression),

    reference_expression: $ => seq(
      '&',
      optional($.mutable_specifier),
      $._expression
    ),
  }
});

// from Rust grammar
function sepTrailing (separator, recurSymbol, rule) {
  return choice(rule, seq(rule, separator, optional(recurSymbol)))
}

function commaSep1 (rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep (rule) {
  return optional(commaSep1(rule));
}
