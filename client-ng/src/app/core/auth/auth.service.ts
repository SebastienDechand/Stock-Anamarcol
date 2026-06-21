import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Role } from '../../shared/constants/roles.constants';
import { User } from '../../shared/models/user.model';
import { environment } from '../../../environments/environment';

interface JwtIdResponse {
  _id?: string;
  roles?: Role[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  checkSession(): Observable<{ uid: string; roles: Role[] }> {
    return this.http.get<JwtIdResponse>(`${this.base}jwtid`, { withCredentials: true }).pipe(
      map((res) => ({
        uid: res._id ?? (res as unknown as string),
        roles: Array.isArray(res.roles) && res.roles.length > 0 ? res.roles : [Role.USER],
      })),
    );
  }

  login(email: string, password: string): Observable<void> {
    return this.http
      .post<void>(`${this.base}api/user/login`, { email, password }, { withCredentials: true })
      .pipe(map(() => undefined));
  }

  logout(): Observable<void> {
    return this.http
      .get<void>(`${this.base}api/user/logout`, { withCredentials: true })
      .pipe(map(() => undefined));
  }

  getUserProfile(uid: string): Observable<User> {
    return this.http.get<User>(`${this.base}api/user/${uid}`, { withCredentials: true });
  }

  updateUserProfile(uid: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.base}api/user/${uid}`, data, { withCredentials: true });
  }

  uploadProfilePicture(uid: string, formData: FormData): Observable<User> {
    return this.http.post<User>(`${this.base}api/user/upload?id=${uid}`, formData, {
      withCredentials: true,
    });
  }
}
