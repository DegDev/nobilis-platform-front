import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PagedModel } from 'common';
import { of } from 'rxjs';
import { AccountModel } from './account';
import { AccountsApi } from './accounts-api';
import { AccountsPage } from './accounts-page';
import { ACCOUNTS_STRINGS } from './accounts.strings';

// A fresh database has no accounts (the config admin has no account row), so the list is empty —
// the real point of this test is that the empty-state renders rather than a blank screen.
const emptyPage: PagedModel<AccountModel> = {
  content: [],
  page: { size: 10, number: 0, totalElements: 0, totalPages: 0 },
};
const fakeApi: Pick<AccountsApi, 'list'> = { list: () => of(emptyPage) };

describe('AccountsPage empty state', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountsPage],
      providers: [provideRouter([]), { provide: AccountsApi, useValue: fakeApi }],
    }).compileComponents();
  });

  it('renders the empty-state when there are no accounts', async () => {
    const fixture = TestBed.createComponent(AccountsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(ACCOUNTS_STRINGS.emptyTitle);
  });
});
