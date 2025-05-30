import { MatTableModule } from '@angular/material/table';
import { LeadersService } from './../../services/leaders.service';
import { Component, inject, OnInit } from '@angular/core';
import { Leader } from '../../interfaces/leader.interface';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'leader-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatCardModule
  ],
  templateUrl: './leader-list.component.html',
  styleUrl: './leader-list.component.scss'
})
export class LeaderListComponent implements OnInit{

  private leaderService = inject(LeadersService);

  leaders: Leader[] = [];

  displayedColumns: string[] = ['idtype', 'idnumber', 'leadertype', 'names', 'surnames', 'gender', 'phone', 'position', 'pemail', 'cemail', 'address', 'options'];

  ngOnInit(): void {
    this.loadLeaders();
  }

  readonly identificationTypesMap: {[key: string]: string} = {
    '1': 'Cédula',
    '2': 'RUC',
    '3': 'Pasaporte',
  };

  readonly leaderTypesMap: {[key: string]: string} = {
    '1': 'Integrity',
    '2': 'Externo',
  };

  readonly genderTypesMap: {[key: string]: string} = {
    'M': 'Masculino',
    'F': 'Femenino',
  };

  loadLeaders(): void {
    this.leaderService.getLeaders().subscribe({
      next: (response: Leader[]) => {
        this.leaders = response;
      },
      error: (err) => {
        console.error('Error al cargar líderes:', err);
      }
    });
  }

  getIdentificationTypeName(idtype: string): string {
    return this.identificationTypesMap[idtype] || 'Desconocido';
  }

  getLeaderTypeName(leadertype: string): string {
    return this.leaderTypesMap[leadertype] || 'Desconocido';
  }

  getGenderTypeName(gender: string): string {
    return this.genderTypesMap[gender] || 'Desconocido';
  }
}
