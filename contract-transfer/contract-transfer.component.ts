import { Component, ViewEncapsulation, OnInit, ViewChild } from '@angular/core';
import { ContractTransfer } from '../../models/ContractTransfer/ContractTransfer';
import { ApiService, AppConfig } from '../../../core';
import { ActivatedRoute, Router } from '@angular/router';
import { Filtered } from '../../models/Filtered';
import { ContractTransferMainComponent } from '../contract-transfer-main/contract-transfer-main.component';

@Component({
  selector: 'app-contract-transfer-component',
  templateUrl: 'contract-transfer.component.html',
  styleUrls: ['contract-transfer.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class ContractTransferComponent implements OnInit {
  contractTransfer: ContractTransfer = new ContractTransfer();
  // дитё
  @ViewChild(ContractTransferMainComponent)
  private transferMain: ContractTransferMainComponent;
  // Пути
  statusPath: string = '/data/asvStatuses/';
  statusArray: Array<Filtered> = new Array<Filtered>();
  executorLink: string;

  constructor(
    private apiService: ApiService, 
    private activateRoute: ActivatedRoute,
    private path: AppConfig,
    private router: Router
    ) {
    this.contractTransfer.contractId = activateRoute.snapshot.params['id'];
    this.contractTransfer.documentTypeName = 'Договор о передачи прав';
    this.contractTransfer.documentTypeUid = 3;
    this.loadMainContract(this.contractTransfer.contractId);
  }

  ngOnInit() {
    // получаем список статусов
    let statuses = this.apiService.query(this.statusPath, [
      'projection=filter',
    ]);
    statuses.subscribe((data: any) => {
      let targets = data._embedded.asvStatuses;
      targets.forEach((item: any) => {
        if (item.uid == 7 || item.uid == 10) {
          this.statusArray.push(new Filtered(item.uid, item.name, null));
        }
      });
    }, err => {
      console.log(err);
    },
    () => { 
      this.contractTransfer.statusId = 7;
    });
  }

  loadMainContract(id: number) {
    // подгружаем основной договор договор
    let mainContract = this.apiService.query(`/water-usage/getMainContractInfo`, [`id=${id}`],);
    mainContract.subscribe((data: any) => {
      data.data.forEach((row: any)=> {
        this.contractTransfer.contractRegNumber = row.regNumber;
        this.contractTransfer.contractHepId = row.hepUid;
        this.contractTransfer.contractTargetId = row.targetUid;
        this.contractTransfer.contractKindId = row.kindUid;
        this.contractTransfer.contractMethodId = row.methodUid;
        this.contractTransfer.contractInfluenceId = row.influenceUid;
        this.contractTransfer.docUid = row.documentUid;
        // получаем старого водопользователя
        this.contractTransfer.executorId = row.waterUserUid
        let temp = row.waterUserFio.split(' ');
        this.contractTransfer.executorPerson.surname = temp[0];
        this.contractTransfer.executorPerson.firstname = temp[1];
        this.contractTransfer.executorPerson.lastname = temp[2];
        this.contractTransfer.executorPerson.post = temp[3];
        this.contractTransfer.executorReason = row.waterUserBasis;
        this.executorLink = this.path.apiEndpoint + '/data/asvImportLegalSubjects/' + this.contractTransfer.executorId;
        this.transferMain.waterUserLinkFrom = this.executorLink;
        this.transferMain.getWaterUserFromRemote(this.executorLink);
      })
    }, err => {
      console.log(err);
    },
    () => { 
      let array = this.contractTransfer.contractRegNumber.split('-');
      let numbers = array[6].split('/');
      this.contractTransfer.contractNumberOrder = numbers[0];
      this.contractTransfer.newRegNumber = array[0]+'-'+array[1]+'-'+array[2]+'-'+array[3]+'-'+array[4]+'-????-?????/00';
    }
    );
  }

  submitForm() {
    this.contractTransfer.selfValidation();
    if (this.contractTransfer.validForm) {
      let payment = 0;
      if (this.contractTransfer.sum != null) payment = this.contractTransfer.sum;
      let body = {};
        body = {
          'uid': null,
          'docUid': Number(this.contractTransfer.docUid),
          'statusId': this.contractTransfer.statusId == null ? 7: this.contractTransfer.statusId,
          'contract': this.contractTransfer.contractId,
          'rfs': this.contractTransfer.rfSubjectId,
          'placeConclusion': this.contractTransfer.placeConclusion,
          'signDate': this.contractTransfer.signDate,
          'regNumber': this.contractTransfer.newRegNumber,
          'wuEndDate': this.contractTransfer.endDate,
          'stopDate': this.contractTransfer.stopDate,
          // держатель
          'executor': this.contractTransfer.executorId,
          'eaSurname': this.contractTransfer.executorPerson.surname,
          'eaFirstname': this.contractTransfer.executorPerson.firstname,
          'eaLastname': this.contractTransfer.executorPerson.lastname,
          'eaPost': this.contractTransfer.executorPerson.post,
          'eaReason': this.contractTransfer.executorReason,
          // приемник
          'waterUser': this.contractTransfer.legalSubjectId,
          'waterUserSurname': this.contractTransfer.legalSubjectPerson.surname,
          'waterUserFirstName': this.contractTransfer.legalSubjectPerson.firstname,
          'waterUserLastname': this.contractTransfer.legalSubjectPerson.lastname,
          'waterUserPost': this.contractTransfer.legalSubjectPerson.post,
          'waterUserReason': this.contractTransfer.legalSubjectReason,
          
          'payment': payment,
          'organ': this.contractTransfer.organId,
          'notes': this.contractTransfer.additionalDescription,
          // ссылки для общей таблицы
          'hepUid': this.contractTransfer.contractHepId,
          // hep_id
          'targetUid': this.contractTransfer.contractTargetId,
          //aim цель
          'kindUid': this.contractTransfer.contractKindId,
          //wu_kind
          'methodUid': this.contractTransfer.contractMethodId,
          //medhod
          'influenceUid': this.contractTransfer.contractInfluenceId,
          //influence_id
          // reg_date старая
          'incomingNumber': this.contractTransfer.incomingNumber

        };
        this.apiService.post('/water-usage/saveContractTransfer', [], body)
        .subscribe((data: any) => {
          this.contractTransfer.selfUid = data.data;
        },err => console.log(err),
        () => {
          alert('Договор передачи прав собственности создан');
        });
    } else {
      var alertText = '';
      this.contractTransfer.validateArray.forEach((row)=>{
        alertText += row.message + ': ' + row.fieldName + '\n';
      })
      alert(alertText);
    }
  }
}
