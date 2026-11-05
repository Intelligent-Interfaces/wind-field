import { describe, it, expect } from "vitest";
import { complex, complexAdd, complexMul, complexMagnitudeSq } from "./complex";

describe("complex", () => {
  it("creates a complex number", () => {
    const c = complex(3, 4);
    expect(c).toEqual({ re: 3, im: 4 });
  });

  it("creates zero", () => {
    const c = complex(0, 0);
    expect(c).toEqual({ re: 0, im: 0 });
  });
});

describe("complexAdd", () => {
  it("adds two complex numbers", () => {
    const result = complexAdd(complex(1, 2), complex(3, 4));
    expect(result).toEqual({ re: 4, im: 6 });
  });

  it("adds with zero", () => {
    const a = complex(5, -3);
    expect(complexAdd(a, complex(0, 0))).toEqual(a);
  });

  it("handles negative components", () => {
    const result = complexAdd(complex(-1, -2), complex(1, 2));
    expect(result).toEqual({ re: 0, im: 0 });
  });
});

describe("complexMul", () => {
  it("multiplies two complex numbers", () => {
    // (1+2i)(3+4i) = 3+4i+6i+8i² = 3+10i-8 = -5+10i
    const result = complexMul(complex(1, 2), complex(3, 4));
    expect(result).toEqual({ re: -5, im: 10 });
  });

  it("multiplies by one", () => {
    const a = complex(7, -3);
    const result = complexMul(a, complex(1, 0));
    expect(result).toEqual(a);
  });

  it("multiplies by i", () => {
    // (3+4i)(0+1i) = 3i+4i² = -4+3i
    const result = complexMul(complex(3, 4), complex(0, 1));
    expect(result).toEqual({ re: -4, im: 3 });
  });

  it("multiplies by zero", () => {
    const result = complexMul(complex(5, 6), complex(0, 0));
    expect(result).toEqual({ re: 0, im: 0 });
  });
});

describe("complexMagnitudeSq", () => {
  it("computes squared magnitude", () => {
    // |3+4i|² = 9+16 = 25
    expect(complexMagnitudeSq(complex(3, 4))).toBe(25);
  });

  it("returns 0 for zero", () => {
    expect(complexMagnitudeSq(complex(0, 0))).toBe(0);
  });

  it("works for purely real numbers", () => {
    expect(complexMagnitudeSq(complex(5, 0))).toBe(25);
  });

  it("works for purely imaginary numbers", () => {
    expect(complexMagnitudeSq(complex(0, 3))).toBe(9);
  });
});
