import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AiLlmPage } from './ai-llm-page';
import { AiProfileApi } from './ai-profile-api';
import { AiFieldDescriptor, AiProfile, AiProfileSaveRequest } from './ai-profile.model';

const DESCRIPTOR: AiFieldDescriptor[] = [
  {
    fieldKey: 'base-url',
    category: 'INFRA',
    type: 'STRING',
    editable: false,
    defaultValue: 'http://localhost:11434',
    minValue: null,
    maxValue: null,
    options: [],
  },
  {
    fieldKey: 'model',
    category: 'OPERATIONAL',
    type: 'STRING',
    editable: true,
    defaultValue: 'llama3',
    minValue: null,
    maxValue: null,
    options: [],
  },
  {
    fieldKey: 'temperature',
    category: 'OPERATIONAL',
    type: 'NUMBER',
    editable: true,
    defaultValue: '0.7',
    minValue: 0,
    maxValue: 1,
    options: [],
  },
  {
    fieldKey: 'no-think',
    category: 'OPERATIONAL',
    type: 'BOOLEAN',
    editable: true,
    defaultValue: 'true',
    minValue: null,
    maxValue: null,
    options: [],
  },
];

const PROFILE: AiProfile = {
  purpose: 'default',
  providerCode: 'ollama',
  params: { model: 'llama3', temperature: '0.7', 'no-think': 'true' },
  secretsSet: {},
};

describe('AiLlmPage', () => {
  let saved: AiProfileSaveRequest | undefined;

  const fakeApi: Pick<
    AiProfileApi,
    'purposes' | 'providers' | 'descriptor' | 'profile' | 'save' | 'healthCheck'
  > = {
    purposes: () => of(['default']),
    providers: () => of([{ code: 'ollama', label: 'Ollama', hint: null, requiresLocal: true }]),
    descriptor: () => of(DESCRIPTOR),
    profile: () => of(PROFILE),
    save: (request) => {
      saved = request;
      return of(PROFILE);
    },
    healthCheck: () => of({ ok: true, message: 'llama3 is installed' }),
  };

  beforeEach(async () => {
    saved = undefined;
    await TestBed.configureTestingModule({
      imports: [AiLlmPage],
      providers: [provideRouter([]), { provide: AiProfileApi, useValue: fakeApi }],
    }).compileComponents();
  });

  it('renders the form entirely from the descriptor: editable fields as inputs, INFRA as read-only text', async () => {
    const fixture = TestBed.createComponent(AiLlmPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#model')).toBeTruthy();
    expect(el.querySelector('#temperature')).toBeTruthy();
    expect(el.querySelector<HTMLInputElement>('#no-think')?.type).toBe('checkbox');
    // base-url is editable=false — never an input, only shown as text.
    expect(el.querySelector('#base-url')).toBeNull();
    expect(el.textContent).toContain('http://localhost:11434');
  });

  it('save sends the descriptor-driven fields as string params, coerced by type', async () => {
    const fixture = TestBed.createComponent(AiLlmPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      onSave: (fields: { key: string; value: unknown }[]) => void;
      selectedPurpose: () => string;
      selectedProvider: () => string;
    };
    component.onSave([
      { key: 'model', value: 'qwen3:8b' },
      { key: 'temperature', value: 0.5 },
      { key: 'no-think', value: true },
    ]);

    expect(saved).toEqual({
      purpose: 'default',
      provider: 'ollama',
      params: { model: 'qwen3:8b', temperature: '0.5', 'no-think': 'true' },
      secrets: {},
    });
  });

  it('health check shows the ok result', async () => {
    const fixture = TestBed.createComponent(AiLlmPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.ai-llm__health button') as HTMLElement;
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('llama3 is installed');
  });
});
