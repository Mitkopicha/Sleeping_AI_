import { validateSleepLog } from '../validation.js';

describe('validateSleepLog()', () => {
  test('valid input passes', () => {
    expect(validateSleepLog({ hours: 7, mood: 'happy' })).toBe(true);
  });

  test('invalid hours fails', () => {
    expect(validateSleepLog({ hours: -1, mood: 'sad' })).toBe(false);
  });

  test('empty mood fails', () => {
    expect(validateSleepLog({ hours: 8, mood: '' })).toBe(false);
  });
});