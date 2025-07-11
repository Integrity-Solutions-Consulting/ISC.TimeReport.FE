import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LeadersService } from '../../services/leaders.service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-leader-details',
  standalone: true,
  templateUrl: './leader-details.component.html',
  styleUrls: ['./leader-details.component.scss'],
  providers: [DatePipe],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule
  ]
})
export class LeaderDetailsComponent implements OnInit {
  leader: any;
  isLoading = true;
  error: string | null = null;


  private leaderService = inject(LeadersService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private datePipe: DatePipe,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('ID del líder:', id);

    if (id && !isNaN(+id)) {
      this.loadLeaderDetails(+id);
    } else {
      this.showError('ID de líder inválido');
    }
  }

  loadLeaderDetails(id: number): void {
    this.isLoading = true;
    this.error = null;

    this.leaderService.getLeaderId(id).subscribe({
      next: (response) => {
        console.log('Datos recibidos:', response);

        if (response && (response.id || response.person)) {
          this.leader = response;
        } else {
          console.error('Estructura inesperada:', response);
          this.showError('Formato de datos incorrecto');
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar líder:', err);
        this.showError('Error al cargar datos del líder');
        this.isLoading = false;
      }
    });
  }

  getLeadershipType(type: boolean): string {
    return type ? 'Líder Principal' : 'Líder Secundario';
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  getRoute(): ActivatedRoute {
    return this.route;
  }

  showError(message: string): void {
    this.error = message;
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  getIdentificationType(id: number): string {
    const types: {[key: number]: string} = {
      1: 'Cédula',
      2: 'Pasaporte',
      3: 'RUC'
    };
    return types[id] || `Tipo ${id}`;
  }

  getGender(id: number): string {
    const genders: Record<number, string> = {
      1: 'Masculino',
      2: 'Femenino',
      3: 'Otro'
    };
    return genders[id] || `Género ${id}`;
  }

  getNationality(id: number): string {
    const nationalities: {[key: number]: string} = {
      1: 'Ecuatoriana',
      2: 'Colombiana',
      3: 'Peruana',
      4: 'Chilena',
      5: 'Venezolana'
    };
    return nationalities[id] || `Nacionalidad ${id}`;
  }

  editClient(): void {
    this.router.navigate(['edit'], { relativeTo: this.route });
  }
}
