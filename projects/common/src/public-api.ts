/*
 * Public API Surface of common — the shared engine UI library (nobilis-platform).
 * Everything a consumer (admin/app or a domain product) may import is re-exported here.
 */

// http/pageable — Spring Pageable request + PagedModel response contract
export * from './lib/http/pageable/paged-model';
export * from './lib/http/pageable/pageable';

// http/problem — RFC 9457 problem+json consumption
export * from './lib/http/problem/problem-detail';
export * from './lib/http/problem/problem-detail-interceptor';

// crud/table — generic table (columns as data) + custom-cell escape hatch
export * from './lib/crud/table/table-column';
export * from './lib/crud/table/column-cell.directive';
export * from './lib/crud/table/generic-table';

// crud/form — generic Signal Forms form (field-config array) + custom-field escape hatch
export * from './lib/crud/form/form-field';
export * from './lib/crud/form/field-template.directive';
export * from './lib/crud/form/generic-form';

// crud/dialog — DynamicDialog opener
export * from './lib/crud/dialog/crud-dialog';

// locale — active UI locale (signal-backed store) + `?locale=` request interceptor
export * from './lib/locale/locale';
export * from './lib/locale/locale-store';
export * from './lib/locale/locale-interceptor';
export * from './lib/locale/i18n-init';

// layout — opt-in sakai-ng-derived admin/app shell (topbar/sidebar/menu/footer/configurator +
// LayoutService). admin mounts this by default; app stays bare unless it imports it. SCSS lives
// alongside these components at lib/layout/styles/shell.scss — a consumer @use's it from its
// global styles.scss.
export * from './lib/layout/layout-service';
export * from './lib/layout/shell';
export * from './lib/layout/shell-topbar';
export * from './lib/layout/shell-sidebar';
export * from './lib/layout/shell-menu';
export * from './lib/layout/shell-menuitem';
export * from './lib/layout/shell-footer';
export * from './lib/layout/shell-configurator';
