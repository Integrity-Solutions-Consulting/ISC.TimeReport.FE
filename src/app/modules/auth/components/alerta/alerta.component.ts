import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core"
import { CommonModule } from "@angular/common"

@Component({
  selector: "app-alerta",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./alerta.component.html",
  styleUrl: "./alerta.component.scss",
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AlertaComponent {
  @Input() mensaje: string = ""
  @Input() visible = false
  @Input() tipo: "error" | "success" | "warning" = "error"
  @Output() visibleChange = new EventEmitter<boolean>()

  cerrar(): void {
    this.visible = false
    this.visibleChange.emit(false)
  }
}
