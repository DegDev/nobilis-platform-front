import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { PagedModel } from 'common';
import { of } from 'rxjs';
import { ContentBlock } from './content-block';
import { ContentBlocksApi } from './content-blocks-api';
import { ContentBlocksPage } from './content-blocks-page';
import { CONTENT_BLOCKS_STRINGS } from './content-blocks.strings';

const page: PagedModel<ContentBlock> = {
  content: [
    { key: 'home.hero', status: 'PUBLISHED', translations: { ru: 'Привет', ro: 'Salut' } },
    { key: 'home.footer', status: 'DRAFT', translations: {} },
  ],
  page: { size: 10, number: 0, totalElements: 2, totalPages: 1 },
};

// The table pages lazily; a fake API returns one page synchronously so the status/translation-
// coverage cell rendering (the real point of this test) can be asserted without a backend.
const fakeApi: Pick<ContentBlocksApi, 'list'> = { list: () => of(page) };

describe('ContentBlocksPage status and translation-coverage cells', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentBlocksPage],
      providers: [provideRouter([]), { provide: ContentBlocksApi, useValue: fakeApi }],
    }).compileComponents();
  });

  it('shows both keys, their status, and which locales have a translation', async () => {
    const fixture = TestBed.createComponent(ContentBlocksPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('home.hero');
    expect(text).toContain('home.footer');
    expect(text).toContain('PUBLISHED');
    expect(text).toContain('DRAFT');
    // Both locale tags render for every row regardless of coverage; severity differs, not presence.
    const localeTags = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.content-blocks__locale-tag',
    );
    expect(localeTags.length).toBe(4);
  });

  it('opens the create dialog on "New content block"', async () => {
    const fixture = TestBed.createComponent(ContentBlocksPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    expect(button?.textContent).toContain(CONTENT_BLOCKS_STRINGS.newBlock);
  });
});
