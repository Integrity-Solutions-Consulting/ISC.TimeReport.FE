import { Component } from '@angular/core';
import { ClientDetailsComponent } from "../../components/client-details/client-details.component";

@Component({
  selector: 'app-client-info',
  standalone: true,
  imports: [ClientDetailsComponent],
  templateUrl: './client-info.page.html',
  styleUrl: './client-info.page.scss'
})
export class ClientInfoPage{

}
