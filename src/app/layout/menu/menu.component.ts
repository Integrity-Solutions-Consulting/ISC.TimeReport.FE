import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { OrderByPipe } from '../menu/order-by-pipe';
import { AuthService } from '../../modules/auth/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatListModule, MatIconModule, RouterModule, OrderByPipe],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  menuItems: any[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.generateMenu();
  }

  private generateMenu(): void {
    const allowedModules = this.authService.getAllowedModules();
    this.menuItems = this.createMenuStructure(allowedModules);
  }

  private createMenuStructure(modules: any[]): any[] {
    // Procesar todos los módulos para agregar el prefijo /menu/
    const processedModules = modules.map(module => ({
      ...module,
      modulePath: `/menu${module.modulePath.startsWith('/') ? module.modulePath : '/' + module.modulePath}`
    }));

    // Ordenar módulos por displayOrder
    const sortedModules = [...processedModules].sort((a, b) => a.displayOrder - b.displayOrder);

    const menuItems: any[] = [];
    const addedModuleIds = new Set<number>();

    // Primero identificar todos los módulos que van como ítems individuales
    const individualModules = ['Dashboard', 'Proyectos', 'Colaboradores', 'Clientes', 'Líderes', 'Proyecciones'];

    // Procesar módulos individuales
    sortedModules.forEach(module => {
      if (addedModuleIds.has(module.id)) return;

      if (individualModules.includes(module.moduleName)) {
        menuItems.push({
          type: 'item',
          ...module
        });
        addedModuleIds.add(module.id);
      }
    });

    // Procesar módulos que van en el panel de Time Report
    const timeReportModules = sortedModules.filter(module =>
      ['Actividades', 'Seguimiento'].includes(module.moduleName) &&
      !addedModuleIds.has(module.id)
    );

    if (timeReportModules.length > 0) {
      const timeReportPanel = {
        type: 'expansion',
        moduleName: 'Time Report',
        icon: 'alarm',
        expanded: false,
        options: timeReportModules,
        displayOrder: Math.min(...timeReportModules.map(m => m.displayOrder))
      };
      menuItems.push(timeReportPanel);
      timeReportModules.forEach(module => addedModuleIds.add(module.id));
    }

    // Procesar módulos que van en el panel de Configuración
    const configModules = sortedModules.filter(module =>
      ['Roles', 'Usuarios', 'Días Festivos'].includes(module.moduleName) &&
      !addedModuleIds.has(module.id)
    );

    if (configModules.length > 0) {
      const configPanel = {
        type: 'expansion',
        moduleName: 'Configuración',
        icon: 'settings',
        expanded: false,
        options: configModules,
        displayOrder: Math.min(...configModules.map(m => m.displayOrder))
      };
      menuItems.push(configPanel);
      configModules.forEach(module => addedModuleIds.add(module.id));
    }

    // DEBUG: Agregar cualquier módulo restante que no haya sido procesado
    const remainingModules = sortedModules.filter(module => !addedModuleIds.has(module.id));
    if (remainingModules.length > 0) {
      console.log('Módulos no procesados:', remainingModules);
      remainingModules.forEach(module => {
        menuItems.push({
          type: 'item',
          ...module
        });
        addedModuleIds.add(module.id);
      });
    }

    // Ordenar final por displayOrder
    return menuItems.sort((a, b) => a.displayOrder - b.displayOrder);
  }
}
