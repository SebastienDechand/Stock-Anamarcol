import { TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { describe, it, expect, vi } from 'vitest';
import { CameraCard } from './camera-card';
import { environment } from '../../../../../environments/environment';
import type { CameraConfig } from '../../../../shared/constants/cameras/cameras.constants';

const makeCamera = (overrides: Partial<CameraConfig> = {}): CameraConfig => ({
  id: 'camera_1',
  name: 'SURVEILLANCE.CAMERA_DEPOT',
  port: 50002,
  cameraId: '413',
  ...overrides,
});

function buildComponent(camera: CameraConfig = makeCamera()) {
  TestBed.overrideComponent(CameraCard, { set: { template: '', imports: [] } });
  TestBed.configureTestingModule({ imports: [CameraCard] });
  const fixture = TestBed.createComponent(CameraCard);
  fixture.componentRef.setInput('camera', camera);
  fixture.detectChanges();
  return { component: fixture.componentInstance };
}

function makeMouseEvent(clientX: number, clientY: number, target: Partial<HTMLElement> = {}) {
  return { clientX, clientY, currentTarget: target } as unknown as MouseEvent;
}

function makeTouch(clientX: number, clientY: number) {
  return { clientX, clientY };
}

describe('CameraCard', () => {
  describe('ngOnInit()', () => {
    it('builds the stream URL from the camera id', () => {
      const { component } = buildComponent(makeCamera({ id: 'camera_2' }));
      expect(component.streamUrl()).toBe(`${environment.apiUrl}api/cameras/stream/camera_2`);
    });
  });

  describe('ngAfterViewInit() / wheel handling', () => {
    it('registers a passive:false wheel handler that zooms in/out and clamps between 1 and 4', () => {
      const { component } = buildComponent();
      const el = document.createElement('div');
      const addSpy = vi.spyOn(el, 'addEventListener');
      component.wrapperEl = { nativeElement: el } as ElementRef<HTMLDivElement>;
      component.ngAfterViewInit();

      expect(addSpy).toHaveBeenCalledWith('wheel', expect.any(Function), { passive: false });
      const handler = addSpy.mock.calls[0][1] as (event: WheelEvent) => void;

      const zoomInEvent = { preventDefault: vi.fn(), deltaY: -500 } as unknown as WheelEvent;
      handler(zoomInEvent);
      expect(zoomInEvent.preventDefault).toHaveBeenCalled();
      expect(component.zoom()).toBe(2);
    });

    it('resets the offset once the wheel zooms back down to 1 or below', () => {
      const { component } = buildComponent();
      const el = document.createElement('div');
      const addSpy = vi.spyOn(el, 'addEventListener');
      component.wrapperEl = { nativeElement: el } as ElementRef<HTMLDivElement>;
      component.ngAfterViewInit();
      const handler = addSpy.mock.calls[0][1] as (event: WheelEvent) => void;

      handler({ preventDefault: vi.fn(), deltaY: -500 } as unknown as WheelEvent);
      component.offset.set({ x: 10, y: 10 });

      handler({ preventDefault: vi.fn(), deltaY: 1000 } as unknown as WheelEvent);

      expect(component.zoom()).toBe(1);
      expect(component.offset()).toEqual({ x: 0, y: 0 });
    });

    it('does nothing when there is no wrapper element', () => {
      const { component } = buildComponent();
      component.wrapperEl = undefined;
      expect(() => component.ngAfterViewInit()).not.toThrow();
    });
  });

  describe('ngOnDestroy()', () => {
    it('removes the registered wheel handler from the wrapper element', () => {
      const { component } = buildComponent();
      const el = document.createElement('div');
      const addSpy = vi.spyOn(el, 'addEventListener');
      const removeSpy = vi.spyOn(el, 'removeEventListener');
      component.wrapperEl = { nativeElement: el } as ElementRef<HTMLDivElement>;
      component.ngAfterViewInit();
      const handler = addSpy.mock.calls[0][1];

      component.ngOnDestroy();

      expect(removeSpy).toHaveBeenCalledWith('wheel', handler);
    });

    it('does nothing when no handler was ever registered', () => {
      const { component } = buildComponent();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('mouse drag', () => {
    it('ignores mouse down when not zoomed in', () => {
      const { component } = buildComponent();
      component.onMouseDown(makeMouseEvent(0, 0));
      expect(component.isDragging()).toBe(false);
    });

    it('starts dragging when zoomed in', () => {
      const { component } = buildComponent();
      component.zoom.set(2);
      component.onMouseDown(makeMouseEvent(50, 50));
      expect(component.isDragging()).toBe(true);
    });

    it('ignores mouse move when not dragging', () => {
      const { component } = buildComponent();
      component.zoom.set(2);
      component.onMouseMove(makeMouseEvent(50, 50, { offsetWidth: 100, offsetHeight: 100 }));
      expect(component.offset()).toEqual({ x: 0, y: 0 });
    });

    it('updates the offset relative to the wrapper size while dragging', () => {
      const { component } = buildComponent();
      component.zoom.set(2);
      component.onMouseDown(makeMouseEvent(100, 100));
      component.onMouseMove(makeMouseEvent(110, 100, { offsetWidth: 200, offsetHeight: 200 }));
      expect(component.offset()).toEqual({ x: 5, y: 0 });
    });

    it('clamps the offset so the image cannot be dragged past its edges', () => {
      const { component } = buildComponent();
      component.zoom.set(2);
      component.offset.set({ x: 20, y: 0 });
      component.onMouseDown(makeMouseEvent(0, 0));
      component.onMouseMove(makeMouseEvent(100, 0, { offsetWidth: 100, offsetHeight: 100 }));
      expect(component.offset().x).toBe(25);
    });

    it('stops dragging on mouse up', () => {
      const { component } = buildComponent();
      component.zoom.set(2);
      component.onMouseDown(makeMouseEvent(0, 0));
      component.onMouseUp();
      expect(component.isDragging()).toBe(false);

      component.onMouseMove(makeMouseEvent(100, 100, { offsetWidth: 100, offsetHeight: 100 }));
      expect(component.offset()).toEqual({ x: 0, y: 0 });
    });
  });

  describe('touch gestures', () => {
    it('pinch-zooms based on the distance change between two touches', () => {
      const { component } = buildComponent();
      component.onTouchStart({
        touches: [makeTouch(0, 0), makeTouch(100, 0)],
      } as unknown as TouchEvent);

      component.onTouchMove({
        preventDefault: vi.fn(),
        touches: [makeTouch(0, 0), makeTouch(200, 0)],
      } as unknown as TouchEvent);

      expect(component.zoom()).toBe(2);
    });

    it('clamps the pinch zoom between 1 and 4', () => {
      const { component } = buildComponent();
      component.onTouchStart({
        touches: [makeTouch(0, 0), makeTouch(100, 0)],
      } as unknown as TouchEvent);

      component.onTouchMove({
        preventDefault: vi.fn(),
        touches: [makeTouch(0, 0), makeTouch(1000, 0)],
      } as unknown as TouchEvent);

      expect(component.zoom()).toBe(4);
    });

    it('pans the offset with a single touch when zoomed in', () => {
      const { component } = buildComponent();
      component.zoom.set(2);
      component.onTouchStart({ touches: [makeTouch(100, 100)] } as unknown as TouchEvent);

      component.onTouchMove({
        preventDefault: vi.fn(),
        touches: [makeTouch(110, 100)],
        currentTarget: { offsetWidth: 200, offsetHeight: 200 },
      } as unknown as TouchEvent);

      expect(component.offset()).toEqual({ x: 5, y: 0 });
    });

    it('ignores a single-touch pan once the touch has ended', () => {
      const { component } = buildComponent();
      component.zoom.set(2);
      component.onTouchStart({ touches: [makeTouch(100, 100)] } as unknown as TouchEvent);
      component.onTouchEnd();

      component.onTouchMove({
        preventDefault: vi.fn(),
        touches: [makeTouch(110, 100)],
        currentTarget: { offsetWidth: 200, offsetHeight: 200 },
      } as unknown as TouchEvent);

      expect(component.offset()).toEqual({ x: 0, y: 0 });
    });
  });

  describe('transformStyle', () => {
    it('builds a CSS transform from the current zoom and offset', () => {
      const { component } = buildComponent();
      component.zoom.set(2);
      component.offset.set({ x: 5, y: -3 });
      expect(component.transformStyle()).toBe('scale(2) translate(5%, -3%)');
    });
  });

  describe('zoomInStep() / zoomOutStep() / resetZoom()', () => {
    it('zoomInStep increases the zoom by 0.5 up to a max of 4', () => {
      const { component } = buildComponent();
      component.zoom.set(3.8);
      component.zoomInStep();
      expect(component.zoom()).toBe(4);
    });

    it('zoomOutStep decreases the zoom by 0.5 down to a min of 1', () => {
      const { component } = buildComponent();
      component.zoom.set(1.2);
      component.zoomOutStep();
      expect(component.zoom()).toBe(1);
    });

    it('zoomOutStep resets the offset once back at zoom 1', () => {
      const { component } = buildComponent();
      component.zoom.set(1.2);
      component.offset.set({ x: 10, y: 10 });
      component.zoomOutStep();
      expect(component.offset()).toEqual({ x: 0, y: 0 });
    });

    it('resetZoom sets zoom back to 1 and clears the offset', () => {
      const { component } = buildComponent();
      component.zoom.set(3);
      component.offset.set({ x: 10, y: 10 });
      component.resetZoom();
      expect(component.zoom()).toBe(1);
      expect(component.offset()).toEqual({ x: 0, y: 0 });
    });
  });
});
