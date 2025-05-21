import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { InterceptorService } from './shared/services/interceptor.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
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
