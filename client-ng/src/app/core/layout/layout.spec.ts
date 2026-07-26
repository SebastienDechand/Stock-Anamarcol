import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Layout } from './layout';
import { UiFacade } from '../../store/ui/facade/ui.facade';

function setInnerWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
}

describe('Layout', () => {
  let uiFacade: { setSidebarOpen: ReturnType<typeof vi.fn> };
  const originalInnerWidth = window.innerWidth;

  beforeEach(async () => {
    TestBed.overrideComponent(Layout, { set: { template: '', imports: [] } });

    uiFacade = { setSidebarOpen: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Layout],
      providers: [{ provide: UiFacade, useValue: uiFacade }],
    }).compileComponents();
  });

  afterEach(() => {
    setInnerWidth(originalInnerWidth);
  });

  it('opens the sidebar by default on a desktop-sized viewport', () => {
    setInnerWidth(1280);
    const fixture = TestBed.createComponent(Layout);
    fixture.detectChanges();
    expect(uiFacade.setSidebarOpen).toHaveBeenCalledWith(true);
  });

  it('closes the sidebar by default on a mobile-sized viewport', () => {
    setInnerWidth(480);
    const fixture = TestBed.createComponent(Layout);
    fixture.detectChanges();
    expect(uiFacade.setSidebarOpen).toHaveBeenCalledWith(false);
  });
});
