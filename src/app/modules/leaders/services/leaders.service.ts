import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Leader, LeaderWithPerson, LeaderWithPersonID, ApiResponse } from '../interfaces/leader.interface';
import { Observable } from 'rxjs';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';

@Injectable({
    providedIn: 'root'
})
export class LeadersService {

  private http = inject(HttpClient);
  urlBase: string = environment.URL_TEST;

  getLeaders():Observable<ApiResponse>{
    console.log(`${this.urlBase}api/Leader/GetAllLeaders`)
      return this.http.get<ApiResponse>(`${this.urlBase}api/Leader/GetAllLeaders`);
  }

  getLeaderByID(id: number): Observable<Leader> {
    return this.http.get<Leader>(`${this.urlBase}api/Leader/GetLeaderByID/${id}`);
  }

  createLeaderWithPerson(leaderWithPersonRequest: LeaderWithPerson): Observable<SuccessResponse<Leader>> {
    console.log(leaderWithPersonRequest)
    return this.http.post<SuccessResponse<Leader>>(`${this.urlBase}api/Leader/CreateLeaderWithPerson`, leaderWithPersonRequest);
  }

  createLeaderWithPersonID(leaderWithPersonIDRequest: LeaderWithPersonID): Observable<SuccessResponse<Leader>> {
    return this.http.post<SuccessResponse<Leader>>(`${this.urlBase}api/Leader/CreateLeaderWithPersonID`, leaderWithPersonIDRequest);
  }

  updateLeaderWithPerson(id: number, updateWithPersonRequest: LeaderWithPerson): Observable<SuccessResponse<Leader>> {
    return this.http.put<SuccessResponse<Leader>>(`${this.urlBase}api/Leader/UpdateLeaderWithPerson/${id}`, updateWithPersonRequest);
  }

}
