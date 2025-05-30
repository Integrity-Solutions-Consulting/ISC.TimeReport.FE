import { Component } from '@angular/core';
import { Leader } from '../../interfaces/leader.interface';
import { LeaderListComponent } from '../../components/leader-list/leader-list.component';

@Component({
  selector: 'list-leaders',
  standalone: true,
  imports: [
    LeaderListComponent
  ],
  templateUrl: './list-leaders.page.html',
  styleUrl: './list-leaders.page.scss'
})
export class ListLeadersPage{

}
