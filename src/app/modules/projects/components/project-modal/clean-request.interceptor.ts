import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CleanRequestInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Solo aplica a solicitudes POST hacia la API de proyectos
    if (req.method === 'POST' && req.url.includes('/api/Project/')) {
      const cleanBody = this.removeIdFromObject(req.body);
      const cleanRequest = req.clone({ body: cleanBody });
      return next.handle(cleanRequest);
    }
    return next.handle(req);
  }

  private removeIdFromObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;

    const { id, ...rest } = obj;
    return rest;
  }
}
