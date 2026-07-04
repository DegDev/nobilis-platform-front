import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MultiSelect } from 'primeng/multiselect';
import { of } from 'rxjs';
import { RoleCreateRequest, RoleModel } from './role';
import { RoleFormDialog } from './role-form-dialog';
import { RolesApi } from './roles-api';

// The engine's assignable-permission catalog (`GET /admin/api/roles/permissions`), stubbed.
const CATALOG = ['SETTINGS_MANAGE', 'ACCOUNT_MANAGE'];

describe('RoleFormDialog permissions multiselect', () => {
  let created: RoleCreateRequest | undefined;
  let closedWith: RoleModel | undefined;

  // A fake API: hands the dialog a catalog to render as options and captures what create() receives,
  // so the escape-hatch (multiselect → signal → request) can be asserted without a backend.
  const fakeApi: Pick<RolesApi, 'getPermissionCatalog' | 'create' | 'update'> = {
    getPermissionCatalog: () => of([...CATALOG]),
    create: (request) => {
      created = request;
      return of({ id: 1, ...request });
    },
    update: (id, request) => of({ id, code: 'X', ...request }),
  };
  const ref = { close: (result?: RoleModel) => (closedWith = result) } as DynamicDialogRef;

  beforeEach(async () => {
    created = undefined;
    closedWith = undefined;
    await TestBed.configureTestingModule({
      imports: [RoleFormDialog],
      providers: [
        { provide: RolesApi, useValue: fakeApi },
        { provide: DynamicDialogRef, useValue: ref },
        { provide: DynamicDialogConfig, useValue: { data: { role: null } } },
      ],
    }).compileComponents();
  });

  it('renders the catalog as multiselect options and submits the selected permissions', async () => {
    const fixture = TestBed.createComponent(RoleFormDialog);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // The p-multiSelect options are fed from the fetched catalog (rendering options from a catalog).
    const multiselect = fixture.debugElement.query(By.directive(MultiSelect))
      .componentInstance as MultiSelect;
    expect(multiselect.options).toEqual(CATALOG);

    // Pick a permission through the escape-hatch signal, fill the required fields, then submit —
    // the selected values must reach the create request (emitting selected values).
    const component = fixture.componentInstance as unknown as {
      permissions: { set: (v: string[]) => void };
      fields: () => { key: string; value: unknown }[];
      onSave: (fields: { key: string; value: unknown }[]) => void;
    };
    component.permissions.set(['ACCOUNT_MANAGE']);
    const filled = component.fields().map((field) => {
      if (field.key === 'code') return { ...field, value: 'EDITOR' };
      if (field.key === 'name') return { ...field, value: 'Editor' };
      return field;
    });
    component.onSave(filled);

    expect(created).toEqual({ code: 'EDITOR', name: 'Editor', permissions: ['ACCOUNT_MANAGE'] });
    expect(closedWith).toEqual({
      id: 1,
      code: 'EDITOR',
      name: 'Editor',
      permissions: ['ACCOUNT_MANAGE'],
    });
  });
});
