import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { of } from 'rxjs';
import { AccountModel, AccountUpdateRequest, RoleRef } from './account';
import { AccountFormDialog } from './account-form-dialog';
import { AccountsApi } from './accounts-api';

// The roles catalog (`GET /admin/api/roles`), stubbed as the roles multiselect's options.
const ROLE_OPTIONS: RoleRef[] = [
  { id: 1, code: 'ADMIN', name: 'Administrator' },
  { id: 2, code: 'EDITOR', name: 'Editor' },
];
const ACCOUNT: AccountModel = {
  id: 7,
  status: 'ACTIVE',
  realms: ['ADMIN'],
  roles: [{ id: 1, code: 'ADMIN', name: 'Administrator' }],
  identities: [{ provider: 'EMAIL', externalId: 'reader@example.org' }],
};

describe('AccountFormDialog status select + realm/role multiselects', () => {
  let updated: { id: number; request: AccountUpdateRequest } | undefined;
  let closedWith: AccountModel | undefined;

  // A fake API: hands the dialog the role options and captures what update() receives, so the
  // three escape-hatch controls (select + two multiselects → signals → request) can be asserted.
  const fakeApi: Pick<AccountsApi, 'getRolesForOptions' | 'update'> = {
    getRolesForOptions: () => of([...ROLE_OPTIONS]),
    update: (id, request) => {
      updated = { id, request };
      return of({
        ...ACCOUNT,
        status: request.status,
        realms: request.realms as AccountModel['realms'],
        roles: ROLE_OPTIONS.filter((role) => request.roleIds.includes(role.id)),
      });
    },
  };
  const ref = { close: (result?: AccountModel) => (closedWith = result) } as DynamicDialogRef;

  beforeEach(async () => {
    updated = undefined;
    closedWith = undefined;
    await TestBed.configureTestingModule({
      imports: [AccountFormDialog],
      providers: [
        { provide: AccountsApi, useValue: fakeApi },
        { provide: DynamicDialogRef, useValue: ref },
        { provide: DynamicDialogConfig, useValue: { data: { account: ACCOUNT } } },
      ],
    }).compileComponents();
  });

  it('renders status + realm + role options and submits the edited status/realms/roleIds', async () => {
    const fixture = TestBed.createComponent(AccountFormDialog);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // The status select carries the three lifecycle values.
    const select = fixture.debugElement.query(By.directive(Select)).componentInstance as Select;
    expect(select.options).toEqual(['ACTIVE', 'BLOCKED', 'PENDING']);

    // Two multiselects: realms (static enum) then roles (fetched catalog), in template order.
    const multiselects = fixture.debugElement
      .queryAll(By.directive(MultiSelect))
      .map((debugEl) => debugEl.componentInstance as MultiSelect);
    expect(multiselects.length).toBe(2);
    expect(multiselects[0].options).toEqual(['ADMIN', 'CLIENT']);
    expect(multiselects[1].options).toEqual(ROLE_OPTIONS);

    // Edit through the escape-hatch signals, then submit — the values must reach the PUT body
    // (roles by id, realms by name, status the selected value).
    const component = fixture.componentInstance as unknown as {
      status: { set: (v: string) => void };
      realms: { set: (v: string[]) => void };
      roleIds: { set: (v: number[]) => void };
      onSave: () => void;
    };
    component.status.set('BLOCKED');
    component.realms.set(['ADMIN', 'CLIENT']);
    component.roleIds.set([2]);
    component.onSave();

    expect(updated).toEqual({
      id: 7,
      request: { status: 'BLOCKED', realms: ['ADMIN', 'CLIENT'], roleIds: [2] },
    });
    expect(closedWith?.status).toBe('BLOCKED');
  });
});
