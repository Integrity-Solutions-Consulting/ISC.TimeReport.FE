import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Leader } from '../interfaces/leader.interface';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LeadersService {

  private _httpClient = inject(HttpClient);
  urlBase: string = environment.URL_BASE;

  getLeaders():Observable<Leader[]>{
      return this._httpClient.get<Leader[]>(
          `${this.urlBase}/api/leader/get`
        );
  }

}
