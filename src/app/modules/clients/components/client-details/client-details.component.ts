import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../services/client.service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'client-details',
  standalone: true,
  templateUrl: './client-details.component.html',
  styleUrls: ['./client-details.component.scss'],
  providers: [DatePipe],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatCardModule
  ]
})
export class ClientDetailsComponent implements OnInit {
  client: any;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService,
    private datePipe: DatePipe,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && !isNaN(+id)) {
      this.loadClientDetails(+id);
    } else {
      this.showError('ID de cliente inválido');
    }
  }

  loadClientDetails(id: number): void {
    this.isLoading = true;
    this.error = null;

    this.clientService.getClientId(id).subscribe({
      next: (response) => {
        console.log('Respuesta del servicio:', response); // Debug

        // Verifica si la respuesta es la esperada
        if (response && (response.id || response.person)) {
          this.client = response;
          console.log('Datos del cliente asignados:', this.client); // Debug
        } else {
          console.error('Estructura de respuesta inesperada:', response);
          this.showError('Estructura de datos incorrecta');
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error en la suscripción:', err);
        this.showError('Error al cargar los datos del cliente');
        this.isLoading = false;
      }
    });
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
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
    const genders: {[key: number]: string} = {
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
