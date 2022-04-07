import {
  Component, EventEmitter,
  Input,
  OnChanges,
  OnInit, Output,
  SimpleChanges, ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { ModalService } from '../../../../core';
import { ModalDirective } from 'ngx-bootstrap';
import { CheckTables } from '../../../models/CheckTables';

@Component({
  selector: 'add-auth-registration-row',
  templateUrl: 'add-auth-for-table.component.html',
  styleUrls: ['add-auth-for-table.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class addAuthForTableComponent implements OnInit, OnChanges {

  @ViewChild('templateModalAddRow') public templateModalAddRow: ModalDirective;

  @Input() row: CheckTables;
  @Input() allRows: Array<CheckTables>;
  @Input() isNewRecord: boolean;
  @Output() emitRow = new EventEmitter<CheckTables>();

  editRow: CheckTables = new CheckTables();

  constructor(
    public modalApi: ModalService, 
  ) {
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  objectSave() {
    if (this.validate() ) {
      this.editRow.npp = this.getNexNppNumber(this.allRows);
      if (this.isNewRecord) {
        this.allRows.push(this.editRow);
        this.editRow = new CheckTables();
      } else {
        this.emitRow.emit(this.editRow);
      }
      this.modalApi.closeModal();
    } 
  }

  validate() {
    let alertText = '';
    if (!this.editRow.normDoc) {
      alertText += 'Не указан нормативный документ\n'
    }
    if (alertText != '') {
      alert(alertText);
      return false;
    } else {
      return true;

    }
  }

  saveWoChanges() {
    this.modalApi.closeModal();
  }

  addModal() {
    if (!this.isNewRecord) {
      this.editRow = JSON.parse(JSON.stringify(this.row));
    } else {
      this.editRow = new CheckTables();
    }
    this.modalApi.openModal(this.templateModalAddRow);
  }

  //проверка четбоксов
  checkboxOnOff(event: any) {
    if (event.target.value == "on") {
        return true;
    }
    return false;
  }

  getNexNppNumber( array: any ) {
    if (array.length == 0) {
      return 1;
    } else {
      let maxNpp: number = 0;
      array.forEach(row => {
        if (row.npp > maxNpp) {
          maxNpp = row.npp
        }
      });
      return maxNpp+1;
    }
  }

}
