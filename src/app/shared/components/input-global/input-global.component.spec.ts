import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputGlobalComponent } from './input-global.component';

describe('InputGlobalComponent', () => {
  let component: InputGlobalComponent;
  let fixture: ComponentFixture<InputGlobalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputGlobalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputGlobalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
