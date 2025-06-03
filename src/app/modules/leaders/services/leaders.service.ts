import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Leader, LeaderwPerson } from '../interfaces/leader.interface';
import { Observable } from 'rxjs';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';

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

  createLeader(createLeaderRequest: LeaderwPerson): Observable<SuccessResponse<Leader>> {
    return this._httpClient.post<SuccessResponse<Leader>>(`${this.urlBase}/api/leader/create`, createLeaderRequest);
  }

}
