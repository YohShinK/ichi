export interface Fraction {
  readonly numerator: bigint;
  readonly denominator: bigint;
}

const absolute = (value: bigint): bigint => (value < 0n ? -value : value);

const greatestCommonDivisor = (left: bigint, right: bigint): bigint => {
  let a = absolute(left);
  let b = absolute(right);
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
};

export const fraction = (numerator: bigint, denominator = 1n): Fraction => {
  if (denominator === 0n)
    throw new RangeError("Fraction denominator must not be zero.");
  if (numerator === 0n) return { numerator: 0n, denominator: 1n };
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = greatestCommonDivisor(numerator, denominator);
  return {
    numerator: (numerator / divisor) * sign,
    denominator: absolute(denominator / divisor),
  };
};

export const addFractions = (left: Fraction, right: Fraction): Fraction =>
  fraction(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );

export const subtractFractions = (left: Fraction, right: Fraction): Fraction =>
  fraction(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );

export const multiplyFractions = (left: Fraction, right: Fraction): Fraction =>
  fraction(
    left.numerator * right.numerator,
    left.denominator * right.denominator,
  );

export const divideFractions = (left: Fraction, right: Fraction): Fraction => {
  if (right.numerator === 0n)
    throw new RangeError("Cannot divide by a zero fraction.");
  return fraction(
    left.numerator * right.denominator,
    left.denominator * right.numerator,
  );
};

export const compareFractions = (
  left: Fraction,
  right: Fraction,
): -1 | 0 | 1 => {
  const difference =
    left.numerator * right.denominator - right.numerator * left.denominator;
  return difference === 0n ? 0 : difference < 0n ? -1 : 1;
};

export const fractionToString = (value: Fraction): string =>
  `${value.numerator}/${value.denominator}`;

export const fractionToNumber = (value: Fraction): number =>
  Number(value.numerator) / Number(value.denominator);
