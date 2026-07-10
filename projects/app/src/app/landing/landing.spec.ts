import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Landing } from './landing';
import { LANDING_STRINGS } from './landing.strings';
import { PortalContentApi } from './portal-content-api';

function configureWith(heroBody: string | null): void {
  const fakeApi: Pick<PortalContentApi, 'read'> = { read: () => of(heroBody) };
  TestBed.configureTestingModule({
    imports: [Landing],
    providers: [{ provide: PortalContentApi, useValue: fakeApi }],
  });
}

describe('Landing', () => {
  it('should create', async () => {
    configureWith(null);
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(Landing);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the CMS hero body when the block is published', async () => {
    configureWith('Welcome to Nobilis');
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(Landing);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(LANDING_STRINGS.title);
    expect(compiled.textContent).toContain('Welcome to Nobilis');
    expect(compiled.textContent).not.toContain(LANDING_STRINGS.placeholderNotice);
  });

  it('falls back to the static placeholder when the hero block is not published', async () => {
    configureWith(null);
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(Landing);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(LANDING_STRINGS.title);
    expect(compiled.textContent).toContain(LANDING_STRINGS.placeholderNotice);
  });
});
