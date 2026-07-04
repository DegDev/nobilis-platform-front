import { Injectable, Type, inject } from '@angular/core';
import { DialogService, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { EMPTY, Observable } from 'rxjs';

/**
 * A thin convenience over PrimeNG's {@link DialogService} for hosting a component (typically a
 * {@link GenericForm}) in a dialog — a create/edit host without repeating DialogService boilerplate.
 * Deliberately NOT a framework: `open` forwards the component + config and returns the dialog's close
 * result as an Observable.
 *
 * <p>Not `providedIn: 'root'`: PrimeNG's `DialogService` is itself not root-provided, so a consumer
 * provides the pair together (`providers: [DialogService, CrudDialog]`) at the host or app level.
 */
@Injectable()
export class CrudDialog {
  private readonly dialogService = inject(DialogService);

  /**
   * Opens `component` in a dynamic dialog and returns its close result. Pass the edited row / seed
   * data via `config.data`; the returned Observable emits whatever `DynamicDialogRef.close(result)`
   * was called with (or `undefined` if dismissed).
   *
   * @param component the component to host in the dialog
   * @param config PrimeNG dialog config (header, width, data, …)
   * @returns the dialog's close result
   */
  open<R = unknown>(component: Type<unknown>, config: DynamicDialogConfig): Observable<R> {
    const ref = this.dialogService.open(component, config);
    return (ref ? ref.onClose : EMPTY) as Observable<R>;
  }
}
