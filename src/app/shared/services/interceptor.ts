import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, finalize, map, throwError } from "rxjs";
import { Observable } from "rxjs/internal/Observable";
import { InterceptorService } from "./interceptor.service";

@Injectable({
    providedIn: 'root',
  })
  export class Interceptor implements HttpInterceptor {
    private _interceptorService = inject(InterceptorService);
  
    intercept(
      req: HttpRequest<any>,
      next: HttpHandler
    ): Observable<HttpEvent<any>> {
      const token = localStorage.getItem("token");
  
      if (token) {
        if (!req.headers.has('service')) {
          req = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`),
          });
        }
      }
      return next.handle(req).pipe(
        finalize(() => {
        }),
        map((event: HttpEvent<any>) => {
          return event;
        }),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 401) {
            this._interceptorService.emitPayload({
              code:401,
              message:'logout'
            });
          }
          return throwError(() => err);
        })
      );
    }
  }
  