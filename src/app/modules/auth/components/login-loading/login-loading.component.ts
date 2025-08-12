import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  templateUrl: './login-loading.component.html',
  styleUrls: ['./login-loading.component.scss']
})
export class LoadingComponent {
  @Input() title: string = 'Procesando solicitud'; // Valor por defecto
  @Input() subtitle: string = 'Por favor espera un momento...'; // Valor por defecto
}
