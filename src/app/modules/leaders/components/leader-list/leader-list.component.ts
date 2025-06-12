import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { LeadersService } from './../../services/leaders.service';
import { Component, inject, Injectable, OnInit, ViewChild } from '@angular/core';
import { Leader, LeaderwPerson } from '../../interfaces/leader.interface';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { LeaderEditModalComponent } from '../leader-edit-modal/leader-edit-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { Subject } from 'rxjs';

@Injectable()
export class LeaderPaginatorIntl implements MatPaginatorIntl {
  changes = new Subject<void>();

  firstPageLabel = `Primera Página`;
  itemsPerPageLabel = `Registros por Página:`;
  lastPageLabel = `Última Página`;

  nextPageLabel = 'Página Siguiente ';
  previousPageLabel = 'Página Anterior';

  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0) {
      return `Página 1 of 1`;
    }
    const amountPages = Math.ceil(length / pageSize);
    return `Página ${page + 1} de ${amountPages}`;
  }
}

@Component({
  selector: 'leader-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatPaginatorModule
  ],
  providers: [
    {provide: MatPaginatorIntl, useClass: LeaderPaginatorIntl}
  ],
  templateUrl: './leader-list.component.html',
  styleUrl: './leader-list.component.scss'
})
export class LeaderListComponent implements OnInit{

  private leaderService = inject(LeadersService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog)

  leaders: Leader[] = [];

  dataSource: MatTableDataSource<Leader> = new MatTableDataSource<Leader>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['select', 'idtype', 'idnumber', 'leadertype', 'names', 'surnames', 'options'];

  selection = new SelectionModel<any>(true, []);

  ngOnInit(): void {
    this.loadLeaders();
  }

  readonly identificationTypesMap: {[key: string]: string} = {
    '1': 'Cédula',
    '2': 'RUC',
    '3': 'Pasaporte',
  };

  readonly leaderTypesMap: {[key: string]: string} = {
    '1': 'Integrity',
    '2': 'Externo',
  };

  loadLeaders(): void {
    this.leaderService.getLeaders().subscribe({
      next: (response: Leader[]) => {
        this.leaders = response;
        this.dataSource.data = this.leaders;
      },
      error: (err) => {
        console.error('Error al cargar líderes:', err);
      }
    });
  }

  ngAfterViewInit(){
    if (this.paginator || this.sort){
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    }
  }

  openEditModal(leader: any): void {
      if (!leader.id) {
        console.error('El líder no tiene ID:', leader);
        this.snackBar.open('Error: El cliente no tiene ID válido', 'Cerrar', { duration: 5000 });
        return;
      }
      const dialogRef = this.dialog.open(LeaderEditModalComponent, {
        width: '600px',
        data: {
          leader: { id: leader.id,
          identificationType: leader.identificationType,
          identificationNumber: leader.identificationNumber,
          names: leader.names,
          surnames: leader.surnames,
          gender: leader.gender,
          cellPhoneNumber: leader.cellPhoneNumber,
          position: leader.position,
          pemail: leader.personalEmail,
          cemail: leader.corporateEmail,
          homeAddress: leader.homeAddress,
          leaderType: leader.leaderType,
          projectCode: leader.projectCode,
          customerCode: leader.customerCode
          },
          identificationTypes: [
            { value: '1', name: 'Cédula' },
            { value: '2', name: 'RUC' },
            { value: '3', name: 'Pasaporte' }
          ],
          leaderTypes: [
            { value: '1', name: 'Integrity' },
            { value: '2', name: 'Externo' },
          ],
          genders: [
            { value: 'M', name: 'Masculino' },
            { value: 'F', name: 'Femenino' }
          ]
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.leaderService.updateLeader(result.id, result).subscribe(
            () => {
              this.loadLeaders();
            },
            (error) => {
              console.error('Error updating customer:', error);
            }
          );
        }
      });
    }

  getIdentificationTypeName(idtype: string): string {
    return this.identificationTypesMap[idtype] || 'Desconocido';
  }

  getLeaderTypeName(leadertype: string): string {
    return this.leaderTypesMap[leadertype] || 'Desconocido';
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.leaders.length;
    return numSelected === numRows;
  }

  toggleAll() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.leaders);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

}
