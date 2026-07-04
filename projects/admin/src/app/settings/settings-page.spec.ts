import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { PagedModel } from 'common';
import { of } from 'rxjs';
import { Setting } from './setting';
import { SettingsApi } from './settings-api';
import { SettingsPage } from './settings-page';
import { SETTINGS_STRINGS } from './settings.strings';

const page: PagedModel<Setting> = {
  content: [
    { key: 'portal.title', value: 'Nobilis', secret: false },
    { key: 'smtp.password', value: null, secret: true },
  ],
  page: { size: 10, number: 0, totalElements: 2, totalPages: 1 },
};

// The table pages lazily; a fake API returns one page synchronously so the masked-cell rendering
// (the real point of this test) can be asserted without a backend.
const fakeApi: Pick<SettingsApi, 'list'> = { list: () => of(page) };

describe('SettingsPage masked value cell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [provideRouter([]), { provide: SettingsApi, useValue: fakeApi }],
    }).compileComponents();
  });

  it('masks a secret value and never leaks the plaintext or a "null" placeholder', async () => {
    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    // Non-secret value is shown as-is; the secret is masked with the "Hidden" tag, not its value.
    expect(text).toContain('Nobilis');
    expect(text).toContain(SETTINGS_STRINGS.secretMask);
    expect(text).toContain(SETTINGS_STRINGS.secretBadge);
    // Never render the literal string "null" for a masked secret value.
    expect(text).not.toContain('null');
    // Keys are always visible.
    expect(text).toContain('portal.title');
    expect(text).toContain('smtp.password');
  });
});
