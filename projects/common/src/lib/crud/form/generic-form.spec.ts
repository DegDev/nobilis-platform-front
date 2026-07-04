import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FieldTemplateDirective } from './field-template.directive';
import { FormFieldState } from './form-field';
import { GenericForm } from './generic-form';

const configFields = (): FormFieldState[] => [
  {
    key: 'title',
    label: 'Title',
    type: 'text',
    required: true,
    requiredMessage: 'Title is required',
    value: '',
  },
  { key: 'secret', label: 'Secret', type: 'checkbox', required: false, value: false },
  { key: 'role', label: 'Role', type: 'text', required: false, value: '' },
];

@Component({
  imports: [GenericForm, FieldTemplateDirective],
  template: `
    <nb-generic-form [fields]="fields()" [serverErrors]="serverErrors()" (save)="saved = $event">
      <ng-template nbFieldTemplate="role" let-field>
        <span class="custom-field">custom:{{ field.label }}</span>
      </ng-template>
    </nb-generic-form>
  `,
})
class FormHost {
  readonly fields = signal<FormFieldState[]>(configFields());
  readonly serverErrors = signal<Record<string, string>>({});
  saved?: FormFieldState[];
}

function setup(): { fixture: ComponentFixture<FormHost>; host: FormHost; el: HTMLElement } {
  const fixture = TestBed.createComponent(FormHost);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

describe('GenericForm', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHost] }).compileComponents();
  });

  it('builds one input per config field and renders the custom template for its key', () => {
    const { el } = setup();

    expect(el.querySelector('#title')).toBeTruthy();
    expect(el.querySelector<HTMLInputElement>('#secret')?.type).toBe('checkbox');
    // The `role` field is projected via nbFieldTemplate -> custom content, no built-in input.
    expect(el.querySelector('.custom-field')?.textContent).toContain('custom:Role');
    expect(el.querySelector('#role')).toBeNull();
  });

  it('blocks save while a required field is empty, then emits once it is filled', () => {
    const { fixture, host, el } = setup();
    const submit = () => el.querySelector('form')!.dispatchEvent(new Event('submit'));

    submit();
    expect(host.saved).toBeUndefined();

    const title = el.querySelector<HTMLInputElement>('#title')!;
    title.value = 'Nobilis';
    title.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    submit();
    expect(host.saved).toBeDefined();
    expect(host.saved?.find((f) => f.key === 'title')?.value).toBe('Nobilis');
  });

  it('shows a server-side field error mapped by key', () => {
    const { fixture, host, el } = setup();

    host.serverErrors.set({ title: 'Server rejected the title' });
    fixture.detectChanges();

    expect(el.textContent).toContain('Server rejected the title');
  });
});
