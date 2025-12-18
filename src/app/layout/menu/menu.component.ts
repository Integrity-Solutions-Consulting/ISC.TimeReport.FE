import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { OrderByPipe } from '../menu/order-by-pipe';
import { AuthService } from '../../modules/auth/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatListModule,
    MatIconModule,
    RouterModule,
    OrderByPipe,
  ],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit {
  menuItems: any[] = [];

  constructor(private authService: AuthService, private router: Router) {}

  onPanelClick(item: any, event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (target.closest('.submenu-expansion')) {
      event.stopPropagation();
      return;
    }

    // Alternar expansión
    item.expanded = !item.expanded;

    // Si cierre PROYECTOS → cerrar también Reportes
    if (!item.expanded && item.moduleName === 'Proyectos') {
      item.options?.forEach((opt: any) => {
        if (opt.type === 'expansion') {
          opt.expanded = false;
        }
      });
    }
  }

  ngOnInit(): void {
    this.generateMenu();
  }

  private generateMenu(): void {
    const allowed = this.authService.getAllowedModules();
    this.menuItems = this.createMenuStructure(allowed);
  }
  private createMenuStructure(modules: any[]): any[] {
    const processed = modules.map((m) => ({
      ...m,
      modulePath: `/menu${
        m.modulePath.startsWith('/') ? m.modulePath : '/' + m.modulePath
      }`,
    }));

    const sorted = [...processed].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );

    const menuItems: any[] = [];
    const added = new Set<number>();

    const mainModules = [
      'Dashboard',
      'Proyectos',
      'Colaboradores',
      'Clientes',
      'Líderes',
      'Proyecciones',

    ];

    // Ítems principales
    sorted.forEach((m) => {
      if (!added.has(m.id) && mainModules.includes(m.moduleName)) {
        menuItems.push({ type: 'item', ...m });
        added.add(m.id);
      }
    });

    // PROYECTOS
    const projectItem = menuItems.find((m) => m.moduleName === 'Proyectos');

    if (projectItem) {
      projectItem.type = 'item';
    }

    // Procesar módulos que van en el panel de Time Report
    const timeModules = sorted.filter(
      (m) =>
        ['Actividades', 'Seguimiento'].includes(m.moduleName) &&
        !added.has(m.id)
    );

    if (timeModules.length > 0) {
      menuItems.push({
        type: 'expansion',
        moduleName: 'Time Report',
        icon: 'alarm',
        displayOrder: Math.min(...timeModules.map((m) => m.displayOrder)),
        options: timeModules.map((m) => ({
          type: 'item',
          ...m,
        })),
      });

      timeModules.forEach((m) => added.add(m.id));
    }

    // Procesar módulos que van en el panel de Configuración
    const configModules = sorted.filter(
      (m) =>
        ['Roles', 'Usuarios', 'Días Festivos'].includes(m.moduleName) &&
        !added.has(m.id)
    );

    if (configModules.length > 0) {
      menuItems.push({
        type: 'expansion',
        moduleName: 'Configuración',
        icon: 'settings',
        displayOrder: Math.min(...configModules.map((m) => m.displayOrder)),
        options: configModules.map((m) => ({
          type: 'item',
          ...m,
        })),
      });

      configModules.forEach((m) => added.add(m.id));
    }
    const reportModules = sorted.filter(
      (m) =>
        ['Proyecto por horas', 'Proyecto por fechas'].includes(m.moduleName) &&
        !added.has(m.id)
    );

    if (reportModules.length > 0) {
      menuItems.push({
        type: 'expansion', // Reportes se despliega
        moduleName: 'Reportes',
        icon: 'summarize',
        displayOrder: Math.min(...reportModules.map((m) => m.displayOrder)),
        options: reportModules.map((m) => ({
          type: 'item',
          ...m,
        })),
      });

      // Marcar los reportes como ya agregados al menú
      reportModules.forEach((m) => added.add(m.id));
    }

    return menuItems;
  }
}
