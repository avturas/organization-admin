import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementBoardComponent } from './management-board.component';

describe('ManagementBoardComponent', () => {
  let component: ManagementBoardComponent;
  let fixture: ComponentFixture<ManagementBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementBoardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManagementBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
