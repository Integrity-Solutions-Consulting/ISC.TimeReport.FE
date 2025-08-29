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
    allowedModules.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
    this.menuItems = this.createMenuStructure(allowedModules);
  }

  private createMenuStructure(modules: any[]): any[] {
    const menuItems: any[] = [];

    // Procesar todos los módulos para agregar el prefijo /menu/
    const processedModules = modules.map(module => ({
      ...module,
      modulePath: `/menu/${module.modulePath.startsWith('/') ? module.modulePath.substring(1) : module.modulePath}`
    }));

    // Agrupar módulos en categorías lógicas
    const dashboardModule = processedModules.find(m => m.moduleName === 'Dashboard');
    const proyectosModule = processedModules.find(m => m.moduleName === 'Proyectos');
    const timeReportModules = processedModules.filter(m =>
      m.moduleName === 'Actividades' || m.moduleName === 'Seguimiento'
    );
    const managementModules = processedModules.filter(m =>
      ['Colaboradores', 'Clientes', 'Líderes'].includes(m.moduleName)
    );
    const configModules = processedModules.filter(m =>
      ['Roles', 'Usuarios'].includes(m.moduleName)
    );

    // Agregar Dashboard si existe
    if (dashboardModule) {
      menuItems.push({
        type: 'item',
        ...dashboardModule,
        displayOrder: dashboardModule.displayOrder || 1
      });
    }

    // Agregar Proyectos si existe
    if (proyectosModule) {
      menuItems.push({
        type: 'item',
        ...proyectosModule,
        displayOrder: proyectosModule.displayOrder || 2
      });
    }

    // Agregar Time Report como panel expandible si hay módulos relacionados
    if (timeReportModules.length > 0) {
      menuItems.push({
        type: 'expansion',
        moduleName: 'Time Report',
        icon: 'alarm',
        expanded: false,
        options: timeReportModules,
        displayOrder: 3
      });
    }

    // Agregar módulos de gestión individualmente
    managementModules.forEach(module => {
      menuItems.push({
        type: 'item',
        ...module,
        displayOrder: module.displayOrder
      });
    });

    // Agregar Configuración como panel expandible si hay módulos relacionados
    if (configModules.length > 0) {
      menuItems.push({
        type: 'expansion',
        moduleName: 'Configuración',
        icon: 'settings',
        expanded: false,
        options: configModules,
        displayOrder: 8
      });
    }

    return menuItems.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
  }
}
