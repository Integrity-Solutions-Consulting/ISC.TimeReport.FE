import { Component, effect, inject } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { InterceptorService } from './shared/services/interceptor.service';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    NgbModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Time Report';

  private _interceptorService = inject(InterceptorService);

  constructor(private router: Router) {
    effect(() => {
      const payload = this._interceptorService.payload();

      if(payload.message == 'logout'){
        this.router.navigate(['/auth/login'])
      }
    });
  }
}
