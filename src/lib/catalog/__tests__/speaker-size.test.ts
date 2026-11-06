import { describe, expect, it } from "vitest";
import { speakerSize } from "../speaker-size";

describe("speakerSize", () => {
  it.each([
    ['Riderzpro Signature 6.5" Component Set', "6.5"],
    ["6.5-Inch 2-Way Coaxial Speakers", "6.5"],
    ["6x9-Inch 4-Way Coaxial Speakers", "6x9"],
    ["6×9 Oval Coaxial", "6x9"],
    ["5.25-Inch 2-Way Component Speakers", "5.25"],
    ['Level-3 Series 5.25" Component Speaker', "5.25"],
    ["4-Inch 2-Way Coaxial Speakers", "4"],
  ])("reads %s as %s", (title, size) => {
    expect(speakerSize(title)).toBe(size);
  });

  it.each([
    "2-Way Coaxial Speaker",
    "28 mm Silk Dome Tweeter Pair",
    'Recoil Echo Series 2.75" Midrange Speakers, Pair',
    "4-Way Component Speaker",
    '10" Subwoofer',
  ])("does not guess a size for %s", (title) => {
    expect(speakerSize(title)).toBeNull();
  });
});
