import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChildren,
  input,
  model,
  output,
} from '@angular/core';
import { FieldTree, FormField, applyEach, applyWhen, form, required } from '@angular/forms/signals';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { FieldTemplateDirective } from './field-template.directive';
import { FormFieldState } from './form-field';

/**
 * A generic form built on Signal Forms, driven by a FIELD-CONFIG ARRAY (the two-way `fields` model,
 * each entry carrying config + value). One static schema fits any field list: `applyEach` binds
 * per-item validation and `applyWhen` reads each item's own `required` flag, so the component never
 * needs the config at construction time. Server-side RFC 9457 field errors wire per field via
 * `serverErrors`; custom fields are plain Angular via the `nbFieldTemplate` escape hatch.
 *
 * <p>Only native form elements (`input`/`textarea`/`select`) carry `[formField]` (the `pInputText`-
 * styled path proven in milestone 01), not PrimeNG form controls, whose control-value-accessor
 * interop with Signal Forms is unverified.
 * Ships no strings — labels/messages come from config. Zoneless/OnPush.
 */
@Component({
  selector: 'nb-generic-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    FormField,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: './generic-form.html',
})
export class GenericForm {
  /** The fields: config + current value per entry. Two-way — the caller reads edited values back. */
  readonly fields = model<FormFieldState[]>([]);
  /** Server-side field errors keyed by field key (e.g. from a parsed ProblemDetail). */
  readonly serverErrors = input<Record<string, string>>({});
  readonly submitLabel = input('Save');
  readonly cancelLabel = input('Cancel');
  readonly pending = input(false);

  /** Emits the current field states on a valid submit. */
  readonly save = output<FormFieldState[]>();
  /** Emits when the user cancels (named `cancelled`, not `cancel`, which is a native DOM event). */
  readonly cancelled = output<void>();

  protected readonly formTree = form(this.fields, (path) => {
    applyEach(path, (fieldPath) => {
      applyWhen(
        fieldPath,
        ({ valueOf }) => valueOf(fieldPath.required) === true,
        (whenRequired) => {
          required(whenRequired.value);
        },
      );
    });
  });

  private readonly customTemplates = contentChildren(FieldTemplateDirective);
  private readonly customByKey = computed(() => {
    const byKey = new Map<string, TemplateRef<unknown>>();
    for (const template of this.customTemplates()) {
      byKey.set(template.nbFieldTemplate(), template.template);
    }
    return byKey;
  });

  protected customField(key: string): TemplateRef<unknown> | null {
    return this.customByKey().get(key) ?? null;
  }

  /** Choices for a `'select'` field, read straight off its config (not part of the value tree). */
  protected options(index: number) {
    return this.fields()[index].options ?? [];
  }

  // The model value is a heterogeneous union, but `[formField]` on a native input is typed by the
  // control (text→string, number→number|null, checkbox→boolean). These accessors present the same
  // underlying field at the type the input expects; the field is dynamically typed at runtime, so
  // the cast is type-only. `fieldState` is for validity/touched, which are value-type-agnostic.
  protected stringField(index: number): FieldTree<string> {
    return this.formTree[index].value as unknown as FieldTree<string>;
  }

  protected numberField(index: number): FieldTree<number | null> {
    return this.formTree[index].value as unknown as FieldTree<number | null>;
  }

  protected booleanField(index: number): FieldTree<boolean> {
    return this.formTree[index].value as unknown as FieldTree<boolean>;
  }

  protected fieldState(index: number) {
    return this.formTree[index].value;
  }

  protected serverError(key: string): string | null {
    return this.serverErrors()[key] ?? null;
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.formTree().invalid() || this.pending()) {
      return;
    }
    this.save.emit(this.fields());
  }
}
