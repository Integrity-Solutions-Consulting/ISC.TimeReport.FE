import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { MatSelectModule } from '@angular/material/select';
import { Project } from '../interfaces/dashboard.interface';
import { CommonModule } from '@angular/common';
import { Color, ScaleType, NgxChartsModule, LegendPosition } from '@swimlane/ngx-charts';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He'},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li'},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
  {position: 5, name: 'Boron', weight: 10.811, symbol: 'B'},
  {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C'},
  {position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N'},
  {position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O'},
  {position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F'},
  {position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne'},
];

@Component({
  selector: 'dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatGridListModule,
    MatToolbarModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSortModule,
    MatMenuModule,
    NgxChartsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})

export class DashboardComponent implements OnInit{

  displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  dataSource = new MatTableDataSource(ELEMENT_DATA);

  data = [
    { name: '2021', value: 150 },
    { name: '2022', value: 200 },
    { name: '2023', value: 180 },
    { name: '2024', value: 220 },
    { name: '2025', value: 240 }
  ];

  data2 = [
  {
    "name": "Banco Guayaquil",
    "value": 52.1
  },
  {
    "name": "Banco Pacífico",
    "value": 22.8
  },
  {
    "name": "Banco Bolivariano",
    "value": 13.9
  },
  {
    "name": "Conecel",
    "value": 11.2
  }
]

  colorScheme: Color = {
    name: 'customColors', // A unique name for your scheme
    selectable: true,     // Whether the colors are selectable (usually true)
    group: ScaleType.Ordinal, // Or ScaleType.Linear, depending on your chart type and data
    domain: ['var(--itg-primary)', 'var(--itg-primary-dark)', 'var(--itg-primary-bg)', 'var(--itg-secondary)', 'var(--itg-secondary-dark)', 'var(--itg-secondary-bg)', 'var(--itg-text-muted)'] // Your array of hex color strings
  };

  gradient: boolean = true;
  showLegend: boolean = true;
  showLabels: boolean = true;
  isDoughnut: boolean = true;
  legendPosition: LegendPosition = LegendPosition.Right;

  view: number[] = [700, 400];

  data3 = [
    {
      "name": "Germany",
      "value": 8940000
    },
    {
      "name": "USA",
      "value": 5000000
    },
    {
      "name": "France",
      "value": 7200000
    },
    {
      "name": "UK",
      "value": 5200000
    },
    {
      "name": "Italy",
      "value": 7700000
    },
    {
      "name": "Spain",
      "value": 4300000
    },
    {
      "name": "Ecuador",
      "value": 4300000
    },
    {
      "name": "Brazil",
      "value": 4300000
    },
    {
      "name": "Japan",
      "value": 4300000
    },
    {
      "name": "Argentina",
      "value": 4300000
    }
  ];

  cardColor: string = "var(--itg-bg)";

  constructor() {}

  ngOnInit(): void {
    // You might fetch data here
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

}
