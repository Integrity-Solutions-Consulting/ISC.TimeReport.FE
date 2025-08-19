import { Component } from '@angular/core';
import { PersonFormComponent } from '../../components/person-form/person-form.component';

@Component({
  selector: 'manage-person',
  standalone: true,
  imports: [
    PersonFormComponent
  ],
  templateUrl: './manage-person.page.html',
  styleUrl: './manage-person.page.scss'
})
export class ManagePersonPage {

}
