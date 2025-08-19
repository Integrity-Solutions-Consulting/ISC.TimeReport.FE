import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { OrderByPipe } from '../menu/order-by-pipe'

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatListModule, MatIconModule, RouterModule, OrderByPipe],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  menuItems: any[] = [];
  userRoles: string[] = [];
  isAdmin: boolean = false;
  isManager: boolean = false;
  isLeader: boolean = false;
  isCollaborator: boolean = false;

  ngOnInit(): void {
    this.loadUserData();
    this.generateMenu();
  }

  private loadUserData(): void {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    this.userRoles = roles.map((role: any) => role.roleName);

    this.isAdmin = this.userRoles.includes('Administrador');
    this.isManager = this.userRoles.includes('Gerente');
    this.isLeader = this.userRoles.includes('Lider');
    this.isCollaborator = this.userRoles.includes('Colaborador');
  }

  private generateMenu(): void {
    const modules = JSON.parse(localStorage.getItem('modules') || '[]');
    const filteredModules = this.filterModules(modules);

    // Ordenar módulos por displayOrder
    filteredModules.sort((a: any, b: any) => a.displayOrder - b.displayOrder);

    // Caso especial para Colaborador que no es también Líder, Gerente o Admin
    if (this.isCollaborator && !this.isLeader && !this.isManager && !this.isAdmin) {
      this.menuItems = this.createCollaboratorMenu(filteredModules);
      return;
    }

    this.menuItems = this.createStandardMenu(filteredModules);
  }

  private filterModules(modules: any[]): any[] {
    if (this.isAdmin) {
      return modules; // Admin ve todo
    }

    const allowedModules: number[] = [];

    // Módulos base para todos los roles excepto Colaborador puro
    if (this.isManager || this.isLeader || this.isCollaborator) {
      allowedModules.push(2, 3, 4); // Proyectos, Actividades, Seguimiento
    }

    if (this.isManager) {
      allowedModules.push(6, 7); // Clientes, Líderes
    }

    if (this.isAdmin) {
      allowedModules.push(1, 5, 8, 9); // Dashboard, Colaboradores, Roles, Users
    }

    return modules.filter((module: any) => allowedModules.includes(module.id));
  }

  /**
   * Genera el menú para el rol de 'Colaborador' puro.
   * La principal diferencia es que también se asegura de añadir el prefijo '/menu/'.
   * @param modules Lista de módulos filtrados.
   * @returns Un arreglo con los items del menú.
   */
  private createCollaboratorMenu(modules: any[]): any[] {
    const actividades = modules.find((m: any) => m.id === 3); // Actividades
    if (!actividades) return [];

    // Aplicamos el prefijo /menu/ al path del módulo antes de retornarlo
    const processedModule = {
      ...actividades,
      modulePath: `/menu/${actividades.modulePath.startsWith('/') ? actividades.modulePath.substring(1) : actividades.modulePath}`
    };

    return [{
      type: 'item',
      ...processedModule
    }];
  }

  private createStandardMenu(modules: any[]): any[] {
    const menuItems: any[] = [];

    // Procesamos todos los módulos para agregar el prefijo /menu/ solo una vez
    const processedModules = modules.map(module => ({
      ...module,
      modulePath: `/menu/${module.modulePath.startsWith('/') ? module.modulePath.substring(1) : module.modulePath}`
    }));

    // Ítems antes del Time Report
    const preTimeReportModules = processedModules.filter(m =>
      m.moduleName === 'Dashboard' ||
      m.moduleName === 'Proyectos'
    );

    preTimeReportModules.forEach(module => {
      menuItems.push({
        type: 'item',
        ...module
      });
    });

    // Panel Time Report - Usamos los módulos ya procesados SIN volver a agregar /menu/
    const timeReportModules = processedModules.filter(m =>
      m.moduleName === 'Actividades' ||
      m.moduleName === 'Seguimiento'
    );

    if (timeReportModules.length > 0) {
      menuItems.push({
        type: 'expansion',
        moduleName: 'Time Report',
        icon: 'alarm',
        expanded: false,
        options: timeReportModules, // <-- Usamos los módulos ya procesados
        displayOrder: 3
      });
    }

    // Ítems después del Time Report
    const postTimeReportModules = processedModules.filter(m =>
      m.moduleName === 'Colaboradores' ||
      m.moduleName === 'Clientes' ||
      m.moduleName === 'Líderes'
    );

    postTimeReportModules.forEach(module => {
      menuItems.push({
        type: 'item',
        ...module
      });
    });

    // Panel Configuración - Usamos los módulos ya procesados SIN volver a agregar /menu/
    const configModules = processedModules.filter(m =>
      m.moduleName === 'Roles' ||
      m.moduleName === 'Users'
    );

    if (configModules.length > 0) {
      menuItems.push({
        type: 'expansion',
        moduleName: 'Configuración',
        icon: 'settings',
        expanded: false,
        options: configModules, // <-- Usamos los módulos ya procesados
        displayOrder: 8
      });
    }

    return menuItems.sort((a, b) => a.displayOrder - b.displayOrder);
  }
}
