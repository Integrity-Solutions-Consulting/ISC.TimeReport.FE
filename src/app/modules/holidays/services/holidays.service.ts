import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})

export class HolidaysService {

    private http = inject(HttpClient);
    urlBase: string = environment.URL_BASE;

    // Subject para controlar el estado de carga
    private loadingSubject = new BehaviorSubject<boolean>(false);
    loadingState$ = this.loadingSubject.asObservable();

    // Método para mostrar el spinner
    showLoading() {
      this.loadingSubject.next(true);
    }

    // Método para ocultar el spinner
    hideLoading() {
      this.loadingSubject.next(false);
    }

    getAllHolidays(): Observable<any> {
      return this.http.get<any>(`${this.urlBase}/api/Holiday/get-all-holiday`);
    }
}
