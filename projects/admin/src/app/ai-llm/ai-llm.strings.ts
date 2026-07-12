/**
 * User-visible strings for the AI-LLM screen, isolated in one place (same i18n seam rationale as
 * the other admin screens' strings).
 */
export const AI_LLM_STRINGS = {
  title: $localize`:@@AiLlmTitle:AI / LLM`,
  back: $localize`:@@BackToDashboard:Back to dashboard`,

  purposeLabel: $localize`:@@AiPurposeLabel:Purpose`,
  providerLabel: $localize`:@@AiProviderLabel:Provider`,

  infraHeading: $localize`:@@AiInfraHeading:Fixed settings`,

  save: $localize`:@@Save:Save`,
  cancel: $localize`:@@Cancel:Cancel`,
  saved: $localize`:@@Saved:Saved`,

  secretConfigured: $localize`:@@AiSecretConfigured:configured`,
  secretNotConfigured: $localize`:@@AiSecretNotConfigured:not configured`,

  healthCheck: $localize`:@@AiHealthCheck:Health check`,
  healthCheckOk: $localize`:@@AiHealthCheckOk:Reachable`,
  healthCheckFailed: $localize`:@@AiHealthCheckFailed:Unreachable`,
} as const;
