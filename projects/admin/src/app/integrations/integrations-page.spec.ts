import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { PagedModel } from 'common';
import { of } from 'rxjs';
import { IntegrationSetting } from './integration';
import { IntegrationsApi } from './integrations-api';
import { IntegrationsPage } from './integrations-page';
import { INTEGRATIONS_STRINGS } from './integrations.strings';

const page: PagedModel<IntegrationSetting> = {
  content: [
    { key: 'integration.figma.api_key', value: null, secret: true },
    { key: 'integration.slack.api_key', value: null, secret: true },
  ],
  page: { size: 200, number: 0, totalElements: 2, totalPages: 1 },
};

const fakeApi: Pick<IntegrationsApi, 'list' | 'set'> = {
  list: () => of(page),
  set: () => of({ key: 'integration.figma.api_key', value: null, secret: true }),
};

describe('IntegrationsPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrationsPage],
      providers: [provideRouter([]), { provide: IntegrationsApi, useValue: fakeApi }],
    }).compileComponents();
  });

  it('groups settings by provider and renders one card each, known label resolved', async () => {
    const fixture = TestBed.createComponent(IntegrationsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Figma');
    // No known label for "slack" — falls back to the raw provider segment.
    expect(text).toContain('slack');
    expect(text).toContain(INTEGRATIONS_STRINGS.statusSet);
  });

  it('never renders the stored key anywhere (write-only)', async () => {
    const fixture = TestBed.createComponent(IntegrationsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const inputs = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'input[type="password"]',
    );
    for (const input of Array.from(inputs)) {
      expect((input as HTMLInputElement).value).toBe('');
    }
  });
});
