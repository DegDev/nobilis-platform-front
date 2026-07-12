import { describe, expect, it } from 'vitest';
import ro from '../public/i18n/ro.json';
import ru from '../public/i18n/ru.json';

describe('app i18n overlay integrity', () => {
  it('ru.json and ro.json declare the same set of ids', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(ro).sort());
  });
});
