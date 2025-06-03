import { Component } from '@angular/core';
import { LeaderFormComponent } from '../../components/leader-form/leader-form.component';

@Component({
  selector: 'app-manage-leaders',
  standalone: true,
  imports: [
    LeaderFormComponent
  ],
  templateUrl: './manage-leaders.page.html',
  styleUrl: './manage-leaders.page.scss'
})
export class ManageLeadersPage {

}
