import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ReplaySubject } from 'rxjs';
import { SurveillancePage } from './surveillance-page';

describe('SurveillancePage', () => {
  let component: SurveillancePage;
  let queryParamMap$: ReplaySubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    TestBed.overrideComponent(SurveillancePage, { set: { template: '', imports: [] } });

    queryParamMap$ = new ReplaySubject(1);
    queryParamMap$.next(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [SurveillancePage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: queryParamMap$ },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SurveillancePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose cameras config', () => {
    expect(component.cameras).toBeDefined();
    expect(Array.isArray(component.cameras)).toBe(true);
  });

  it('should expose video icon', () => {
    expect(component.video).toBeDefined();
  });

  describe('flux mode (?flux=camera_id)', () => {
    it('leaves fluxCamera undefined when there is no flux query param', () => {
      expect(component.fluxCamera()).toBeUndefined();
    });

    it('sets fluxCamera to the matching camera when the flux param is valid', () => {
      const validId = component.cameras[0].id;
      queryParamMap$.next(convertToParamMap({ flux: validId }));

      expect(component.fluxCamera()).toEqual(component.cameras[0]);
    });

    it('sets fluxCamera to null when the flux param does not match any camera', () => {
      queryParamMap$.next(convertToParamMap({ flux: 'does-not-exist' }));

      expect(component.fluxCamera()).toBeNull();
    });

    it('resets fluxCamera to undefined when the flux param is removed', () => {
      queryParamMap$.next(convertToParamMap({ flux: component.cameras[0].id }));
      expect(component.fluxCamera()).toEqual(component.cameras[0]);

      queryParamMap$.next(convertToParamMap({}));
      expect(component.fluxCamera()).toBeUndefined();
    });
  });
});
