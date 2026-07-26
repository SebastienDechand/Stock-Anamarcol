import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi } from 'vitest';
import { MemberCard } from './member-card';
import { Role } from '../../../../shared/constants/roles/roles.constants';
import type { User } from '../../../../shared/models/user/user.model';

const makeUser = (overrides: Partial<User> = {}): User => ({
  _id: '1',
  username: 'alice',
  email: 'alice@example.com',
  ...overrides,
});

function buildComponent(user: User): MemberCard {
  TestBed.overrideComponent(MemberCard, { set: { template: '', imports: [] } });
  TestBed.configureTestingModule({ imports: [MemberCard] });
  const fixture = TestBed.createComponent(MemberCard);
  fixture.componentRef.setInput('user', user);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('MemberCard', () => {
  describe('initials', () => {
    it('returns the uppercased first letter of the username', () => {
      expect(buildComponent(makeUser({ username: 'bob' })).initials).toBe('B');
    });

    it('returns "?" when the username is empty', () => {
      expect(buildComponent(makeUser({ username: '' })).initials).toBe('?');
    });
  });

  describe('avatarUrl', () => {
    it('returns an empty string when there is no picture', () => {
      expect(buildComponent(makeUser()).avatarUrl).toBe('');
    });

    it('returns the picture as-is when it is an absolute URL', () => {
      const url = 'https://example.com/pic.jpg';
      expect(buildComponent(makeUser({ picture: url })).avatarUrl).toBe(url);
    });

    it('prepends a leading slash to a bare relative path', () => {
      expect(buildComponent(makeUser({ picture: 'pic.jpg' })).avatarUrl).toBe('/pic.jpg');
    });
  });

  describe('badges', () => {
    it('returns an empty list when the user has no roles', () => {
      expect(buildComponent(makeUser({ roles: [] })).badges).toEqual([]);
    });

    it('returns badges for each role the user has, in display order', () => {
      const component = buildComponent(
        makeUser({ roles: [Role.SUPERADMIN, Role.USER, Role.HOTLINE] }),
      );
      expect(component.badges.map((b) => b.role)).toEqual([
        Role.USER,
        Role.HOTLINE,
        Role.SUPERADMIN,
      ]);
    });
  });

  describe('onClick()', () => {
    it('emits selected when clickable is true', () => {
      TestBed.overrideComponent(MemberCard, { set: { template: '', imports: [] } });
      TestBed.configureTestingModule({ imports: [MemberCard] });
      const fixture = TestBed.createComponent(MemberCard);
      const user = makeUser();
      fixture.componentRef.setInput('user', user);
      fixture.componentRef.setInput('clickable', true);
      fixture.detectChanges();

      const spy = vi.fn();
      fixture.componentInstance.selected.subscribe(spy);
      fixture.componentInstance.onClick();

      expect(spy).toHaveBeenCalledWith(user);
    });

    it('does not emit when clickable is false', () => {
      const component = buildComponent(makeUser());
      const spy = vi.fn();
      component.selected.subscribe(spy);
      component.onClick();
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
