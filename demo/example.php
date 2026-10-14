<?php

/**
 * A PHP sample, kept idiomatic so it is worth opening in the editor.
 *
 * @package Sample
 */

declare(strict_types=1);

namespace App\Sample;

use InvalidArgumentException;
use App\Contracts\Formatter as FormatterContract;

const MAX_RETRIES = 3;

interface Formatter
{
    public function format(string $value): string;
}

abstract class Shape implements Formatter
{
    protected const SIDES = 0;

    public function __construct(
        protected readonly string $name,
        private float $scale = 1.0,
    ) {
    }

    abstract public function area(): float;

    public function format(string $value): string
    {
        return sprintf('%s: %s', $this->name, $value);
    }
}

final class Rectangle extends Shape
{
    protected const SIDES = 4;

    public function __construct(
        string $name,
        private float $width,
        private float $height,
    ) {
        parent::__construct($name);

        if ($width <= 0 || $height <= 0) {
            throw new InvalidArgumentException('sides must be positive');
        }
    }

    public function area(): float
    {
        return $this->width * $this->height;
    }
}

enum Suit: string
{
    case Hearts = 'H';
    case Spades = 'S';
}

function describe(Shape ...$shapes): array
{
    $out = [];

    foreach ($shapes as $i => $shape) {
        $out[] = match (true) {
            $shape->area() > 100 => 'large',
            $shape->area() > 10  => 'medium',
            default              => 'small',
        };
    }

    return $out;
}

$rectangle = new Rectangle('floor', 4.5, 2.0);
$label     = "Area is {$rectangle->area()} m²";
$literal   = 'No $interpolation here';

$heredoc = <<<TEXT
    Interpolated: {$label}
    TEXT;

$nowdoc = <<<'TEXT'
    Not interpolated: $label
    TEXT;

$squares = array_map(static fn (int $n): int => $n ** 2, range(1, 5));

try {
    echo $rectangle->format($label), PHP_EOL;
} catch (\Throwable $e) {
    error_log($e->getMessage());
} finally {
    unset($rectangle);
}

?>

<ul>
  <?php foreach ($squares as $square): ?>
    <li><?= htmlspecialchars((string) $square) ?></li>
  <?php endforeach; ?>
</ul>
