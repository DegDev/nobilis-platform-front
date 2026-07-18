// Runtime polyfill for `$localize` tagged templates (e.g. ShellFooter, ShellTopbar,
// ShellConfigurator) — vitest doesn't get this from Angular's build-time polyfills list the way
// `ng build`/the admin & app dev servers do, so component specs that instantiate a component using
// `$localize` need it loaded explicitly. See angular.json's `common` test target (`setupFiles`).
import '@angular/localize/init';
