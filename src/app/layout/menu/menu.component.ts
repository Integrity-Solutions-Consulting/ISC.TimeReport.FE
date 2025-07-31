import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';

interface MenuItem {
  type: 'item' | 'expansion';
  moduleName?: string;
  modulePath?: string;
  icon?: string;
  expanded?: boolean;
  options?: any[];
  visible?: boolean;
}

@Component({
  selector: 'menu-timereport',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit {
  public menuItems: MenuItem[] = [];
  public isAdmin = false;

  ngOnInit(): void {
    const rawMenus = localStorage.getItem('modules');
    const rawRoles = localStorage.getItem('roles');

    // Verificar si es administrador
    if (rawRoles) {
      const roles = JSON.parse(rawRoles);
      this.isAdmin = roles.some((role: any) => role.roleName === 'Administrador');
    }

    const parsedMenus = rawMenus ? JSON.parse(rawMenus) : [];

    // Ordenar los módulos según displayOrder
    parsedMenus.sort((a: any, b: any) => a.displayOrder - b.displayOrder);

    // Construir la estructura del menú en el orden deseado
    this.menuItems = parsedMenus
      .filter((item: any) => item.modulePath)
      .map((item: any) => {
        const ruta = item.modulePath.startsWith('/menu/')
          ? item.modulePath
          : `/menu/${item.modulePath.replace(/^\/+/, '')}`;

        // Para módulos normales
        if (item.modulePath !== '/activities' &&
            item.modulePath !== '/activities/collaborators' &&
            item.modulePath !== '/settings' &&
            item.modulePath !== '/users') {
          return {
            type: 'item',
            moduleName: item.moduleName,
            modulePath: ruta,
            icon: item.icon
          };
        }

        return null;
      })
      .filter((item: MenuItem | null) => item !== null);

    // Insertar el panel de Actividades después de Proyectos (posición 1)
    if (this.isAdmin) {
      const activitiesModule = parsedMenus.find((item: any) => item.modulePath === '/activities');
      const collaboratorsModule = parsedMenus.find((item: any) => item.modulePath === '/activities/collaborators');

      const activitiesPanel: MenuItem = {
        type: 'expansion',
        moduleName: 'Actividades',
        icon: 'work',
        expanded: false,
        options: [
          {
            moduleName: activitiesModule?.moduleName || 'Actividades',
            modulePath: activitiesModule?.modulePath ? `/menu/${activitiesModule.modulePath.replace(/^\/+/, '')}` : '/menu/activities',
            icon: activitiesModule?.icon || 'work'
          },
          {
            moduleName: collaboratorsModule?.moduleName || 'Colaboradores',
            modulePath: collaboratorsModule?.modulePath ? `/menu/${collaboratorsModule.modulePath.replace(/^\/+/, '')}` : '/menu/activities/collaborators',
            icon: collaboratorsModule?.icon || 'construction'
          }
        ]
      };

      this.menuItems.splice(2, 0, activitiesPanel); // Insertar después de Proyectos (índice 1)
    }

    // Insertar el panel de Configuración al final
    const settingsModule = parsedMenus.find((item: any) => item.modulePath === '/settings');
    const usersModule = parsedMenus.find((item: any) => item.modulePath === '/users');

    const settingsPanel: MenuItem = {
      type: 'expansion',
      moduleName: 'Configuración',
      icon: 'settings',
      expanded: false,
      options: [
        {
          moduleName: settingsModule?.moduleName || 'Configuración',
          modulePath: settingsModule?.modulePath ? `/menu/${settingsModule.modulePath.replace(/^\/+/, '')}` : '/menu/settings',
          icon: settingsModule?.icon || 'settings'
        },
        {
          moduleName: usersModule?.moduleName || 'Usuarios',
          modulePath: usersModule?.modulePath ? `/menu/${usersModule.modulePath.replace(/^\/+/, '')}` : '/menu/users',
          icon: usersModule?.icon || 'person'
        }
      ]
    };

    this.menuItems.push(settingsPanel);
  }
}
