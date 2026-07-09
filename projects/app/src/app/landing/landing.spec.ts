import { TestBed } from '@angular/core/testing';
import { Landing } from './landing';
import { LANDING_STRINGS } from './landing.strings';

describe('Landing', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landing],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Landing);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the placeholder content from the strings file', async () => {
    const fixture = TestBed.createComponent(Landing);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(LANDING_STRINGS.title);
    expect(compiled.textContent).toContain(LANDING_STRINGS.tagline);
  });
});
