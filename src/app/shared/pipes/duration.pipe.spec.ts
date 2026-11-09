import { DurationPipe } from './duration.pipe';

describe('DurationPipe', () => {
  const pipe = new DurationPipe();

  it('formats minutes and seconds', () => {
    expect(pipe.transform(125)).toBe('2:05');
    expect(pipe.transform(600)).toBe('10:00');
    expect(pipe.transform(59)).toBe('0:59');
  });

  it('handles null, negative, and NaN', () => {
    expect(pipe.transform(null)).toBe('0:00');
    expect(pipe.transform(-5)).toBe('0:00');
    expect(pipe.transform(NaN)).toBe('0:00');
  });
});
