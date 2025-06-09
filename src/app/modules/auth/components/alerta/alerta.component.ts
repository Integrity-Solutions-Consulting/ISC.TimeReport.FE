import { Component, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"

@Component({
  selector: "app-alerta",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./alerta.component.html",
  styleUrl: "./alerta.component.scss",
})
export class AlertaComponent {
  @Input() mensaje = ""
  @Input() visible = false
  @Input() tipo: "error" | "success" | "warning" = "error"
  @Output() visibleChange = new EventEmitter<boolean>()

  cerrar(): void {
    this.visible = false
    this.visibleChange.emit(false)
  }
}
