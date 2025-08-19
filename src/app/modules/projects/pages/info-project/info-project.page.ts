import { Component } from '@angular/core';
import { ProjectInfoComponent } from "../../components/project-info/project-info.component";

@Component({
  selector: 'app-info-project',
  standalone: true,
  imports: [ProjectInfoComponent],
  templateUrl: './info-project.page.html',
  styleUrl: './info-project.page.scss'
})
export class InfoProjectPage {

}
