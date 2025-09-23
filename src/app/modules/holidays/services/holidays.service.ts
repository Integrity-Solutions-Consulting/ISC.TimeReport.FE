import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { BehaviorSubject, Observable } from "rxjs";
import { HolidayResponse } from "../interfaces/holiday.interface";

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

    getHolidayById(id: string): Observable<HolidayResponse> {
      return this.http.get<HolidayResponse>(`${this.urlBase}/api/Holiday/get-holiday-by-id?id=${id}`);
    }

    createHoliday(holidayData: any): Observable<any> {
      return this.http.post<any>(`${this.urlBase}/api/Holiday/create-holiday`, holidayData);
    }

    updateHoliday(id: string, holidayData: any): Observable<any> {
      return this.http.put<any>(`${this.urlBase}/api/Holiday/update-holiday/${id}`, holidayData);
    }

    activateHoliday(id: string): Observable<HolidayResponse> {
      return this.http.delete<HolidayResponse>(`${this.urlBase}/api/Holiday/activate-holiday/${id}`);
    }

    inactivateHoliday(id: string): Observable<HolidayResponse> {
      return this.http.delete<HolidayResponse>(`${this.urlBase}/api/Holiday/inactivate-holiday/${id}`);
    }

}
