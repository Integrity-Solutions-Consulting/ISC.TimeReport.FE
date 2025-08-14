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
  public isCollaboratorOnly = false;
  public hasSettingsAccess = false;
  public hasUsersAccess = false;

  ngOnInit(): void {
    const rawMenus = localStorage.getItem('modules');
    const rawRoles = localStorage.getItem('roles');

    // Verificar roles
    if (rawRoles) {
      const roles = JSON.parse(rawRoles);
      this.isAdmin = roles.some((role: any) => role.roleName === 'Administrador');
      this.isCollaboratorOnly = roles.length === 1 &&
                              roles.some((role: any) => role.roleName === 'Colaborador');
    }

    // Si es SOLO Colaborador (sin otros roles), mostrar solo Actividades
    if (this.isCollaboratorOnly) {
      const parsedMenus = rawMenus ? JSON.parse(rawMenus) : [];
      const activitiesModule = parsedMenus.find((item: any) => item.modulePath === '/activities');

      this.menuItems = [{
        type: 'item',
        moduleName: activitiesModule?.moduleName || 'Actividades',
        modulePath: activitiesModule?.modulePath ? `/menu/${activitiesModule.modulePath.replace(/^\/+/, '')}` : '/menu/activities',
        icon: activitiesModule?.icon || 'work'
      }];
      return;
    }

    // Para otros casos
    const parsedMenus = rawMenus ? JSON.parse(rawMenus) : [];

    // Ordenar los módulos según displayOrder
    parsedMenus.sort((a: any, b: any) => a.displayOrder - b.displayOrder);

    // Construir la estructura del menú basada en los módulos asignados
    this.menuItems = parsedMenus
      .filter((item: any) => item.modulePath)
      .map((item: any) => {
        const ruta = item.modulePath.startsWith('/menu/')
          ? item.modulePath
          : `/menu/${item.modulePath.replace(/^\/+/, '')}`;

        // Para módulos normales (excepto los que van en expansion panels)
        if (item.modulePath !== '/activities' &&
            item.modulePath !== '/activities/tracking' &&
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

    // Verificar si tiene módulos de Actividades/Seguimiento para crear el expansion panel
    const hasActivities = parsedMenus.some((item: any) => item.modulePath === '/activities');
    const hasTracking = parsedMenus.some((item: any) => item.modulePath === '/activities/tracking');

    if (hasActivities || hasTracking) {
      const activitiesModule = parsedMenus.find((item: any) => item.modulePath === '/activities');
      const trackingModule = parsedMenus.find((item: any) => item.modulePath === '/activities/tracking');

      const activitiesPanel: MenuItem = {
        type: 'expansion',
        moduleName: 'Time Report',
        icon: 'alarm',
        expanded: false,
        options: [
          ...(hasActivities ? [{
            moduleName: activitiesModule?.moduleName || 'Actividades',
            modulePath: activitiesModule?.modulePath ? `/menu/${activitiesModule.modulePath.replace(/^\/+/, '')}` : '/menu/activities',
            icon: activitiesModule?.icon || 'work'
          }] : []),
          ...(hasTracking ? [{
            moduleName: trackingModule?.moduleName || 'Seguimiento',
            modulePath: trackingModule?.modulePath ? `/menu/${trackingModule.modulePath.replace(/^\/+/, '')}` : '/menu/activities/tracking',
            icon: trackingModule?.icon || 'construction'
          }] : [])
        ]
      };

      // Insertar después de Proyectos (índice 1) o al inicio si no hay Proyectos
      const insertPosition = this.menuItems.length > 1 ? 1 : 0;
      this.menuItems.splice(insertPosition, 0, activitiesPanel);
    }

    // Verificar si tiene módulos de Configuración/Usuarios para crear el expansion panel
    const hasSettings = parsedMenus.some((item: any) => item.modulePath === '/settings');
    const hasUsers = parsedMenus.some((item: any) => item.modulePath === '/users');

    if (hasSettings || hasUsers) {
      const settingsModule = parsedMenus.find((item: any) => item.modulePath === '/settings');
      const usersModule = parsedMenus.find((item: any) => item.modulePath === '/users');

      const settingsPanel: MenuItem = {
        type: 'expansion',
        moduleName: 'Configuración',
        icon: 'settings',
        expanded: false,
        options: [
          ...(hasSettings ? [{
            moduleName: settingsModule?.moduleName || 'Configuración',
            modulePath: settingsModule?.modulePath ? `/menu/${settingsModule.modulePath.replace(/^\/+/, '')}` : '/menu/settings',
            icon: settingsModule?.icon || 'settings'
          }] : []),
          ...(hasUsers ? [{
            moduleName: usersModule?.moduleName || 'Usuarios',
            modulePath: usersModule?.modulePath ? `/menu/${usersModule.modulePath.replace(/^\/+/, '')}` : '/menu/users',
            icon: usersModule?.icon || 'person'
          }] : [])
        ]
      };

      this.menuItems.push(settingsPanel);
    }
  }
}
