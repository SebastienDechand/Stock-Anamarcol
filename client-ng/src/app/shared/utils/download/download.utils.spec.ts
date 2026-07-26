import { describe, it, expect, vi, afterEach } from 'vitest';
import { downloadBlob } from './download.utils';

describe('downloadBlob', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates an object URL, triggers a click on a temporary anchor, then revokes the URL', () => {
    const blob = new Blob(['data'], { type: 'text/csv' });
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.fn();
    const anchor = { href: '', download: '', click: clickSpy } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    downloadBlob(blob, 'export.csv');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(anchor.href).toBe('blob:fake-url');
    expect(anchor.download).toBe('export.csv');
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
  });
});
