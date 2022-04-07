import {
  Component,
  Input,
  Output,
  OnInit,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ModalService, AppConfig } from '../../../core/';
import { ModalDirective } from 'ngx-bootstrap';
import { waterUseCondition } from '../../models/waterUseCondition';
import { waterUseConditions } from '../../models/waterUseConditions'

@Component({
  selector: 'add-volume-finance-activity',
  templateUrl: 'add-volume-finance-activity.component.html',
  providers: []
})

export class AddVolumeFinanceActivity implements OnInit {

  @ViewChild('WaterObjectModal') public WaterObjectModal: ModalDirective;

  //Фильтр водного объекта
  planes: Array<PlanModel>;
  size: number = 6;

  filterClass: Filter_class;
  miniModel: miniModel = new miniModel();

  @Input() waterUseConditions: waterUseConditions;
  @Input() disabledBtn: boolean = false;
  @Input() planName: string;
  @Output() PlanId = new EventEmitter();

  constructor(
    private api: ApiService,
    public modalApi: ModalService,
    private path: AppConfig
  ) {
  }

  ngOnInit() {

  }

  /* Functions */
  applyFilters() {
    this.planes = new Array<PlanModel>();
    this.planes.push({uid: null, date: null, number: 'Загрузка', docNumber: "", userName: "", comment: ""});
    var params = [];
    //Контекстный фильтр
    if (typeof this.miniModel.term !== 'undefined' && this.miniModel.term != null) {
      params.push(`term=${this.miniModel.term}`);
    };
    var query: Observable<any>;
    let finalPath = `/water-usage/getFinanceVolumePlan`;
    query = this.api.query(finalPath, params);
    query.subscribe(
      (data: any) => {
        this.filterClass = new Filter_class();
        data.data.forEach(
          (row) => {
            this.filterClass.addPlanes(row);
          }
        );
      },
      err => console.log(err),
      () => {
        this.planes = new Array<PlanModel>();
        this.planes = this.filterClass.getAllPlanes();
      }
    );
  }

  //Добавление водных объектов
  selectPlan() {
    if (typeof this.miniModel.selectedPlan !== 'undefined' && this.miniModel.selectedPlan != null) {
      var query: Observable<any>;
      let params = [];
      let finalPath = `/data/asvActivitiesPlans/${this.miniModel.selectedPlan}`;
      query = this.api.query(finalPath, params);
      query.subscribe(
        (data: any) => {
          this.miniModel.filer_name = 'Объем финансирования по мероприятиям (план) ' + data.number + ' от ' + data.date;
          this.planName = 'Объем финансирования по мероприятиям (план) ' + data.number + ' от ' + data.date;
          this.waterUseConditions.plan_name = this.miniModel.filer_name;
          this.waterUseConditions.plan_id = this.miniModel.selectedPlan;
          this.waterUseConditions.plan_link = this.path.apiEndpoint+'/data/asvActivitiesPlans/'+this.waterUseConditions.plan_id;
          // вывожу данные в вложенную модель
        },
        err => console.log(err),
        () => {
          this.loadPlanVolumesTable(this.miniModel.selectedPlan);
          // подгружаем таблицу в переменную
        }
      );

      this.modalApi.closeModal()
    } else {
      alert('Выберите план!');
    }
  }

  // таблица подгрузки данных
  loadPlanVolumesTable($id) {
    let params = [];
    this.waterUseConditions.tables = new Array<waterUseCondition>();
    let tables = new Array<waterUseCondition>();
    var query: Observable<any>;
    // Номер плана
    let plan = this.path.apiEndpoint + '/data/asvActivitiesPlans/' + $id;
    params.push(`planId=${plan}`);

    let finalPath = `/data/asvActivitiesPlanVolumeses/search/findByAsvActivitiesPlan`;
    query = this.api.query(finalPath, params);
    query.subscribe(
      (data: any) => {
        data._embedded['asvActivitiesPlanVolumeses'].forEach(row => {
          
          tables.push({
            npp: null,
            year: row.year,
            activityId: null,
            activityName: null,
            activityLink: row['_links']['asvActivity'].href,
            description: row.description,
            kv1: row.kv1,
            kv2: row.kv2,
            kv3: row.kv3,
            kv4: row.kv4,
            itog: row.total,
            uid: null
          })
        });
        tables.sort((a,b)=>{return a.year-b.year});
        // вывожу данные в вложенную модель
      },
      err => console.log(err),
      () => {
        this.waterUseConditions.tables = tables;
        // подгружаем мероприятия
        this.loadActivity();
      }
    );
  }

  loadActivity() {
    this.waterUseConditions.tables.forEach( (row, index) => {
      let params = [];
      let query: Observable<any>;
      let finalPath = row.activityLink.split('v2');
      query = this.api.query(finalPath[1], params);
      query.subscribe(
        (data: any) => {
          this.waterUseConditions.tables[index].activityName = data.description;
          this.PlanId.next();
        },
        err => console.log(err),
        () => {
        }
      );
    })
  }

}

type PlanModel = {
  uid: number;
  date: string;
  number: string;
  docNumber: string;
  userName: string;
  comment: string;
}

type PlanVolumesModel = {
  uid: number;
  date: string;
  number: string;
  docNumber: string;
  userName: string;
  comment: string;
}

class Filter_class {
  private dataPlanes: Array<PlanModel> = new Array<PlanModel>();

  addPlanes(row: any) {
    this.dataPlanes.push({
      uid: row.uid, 
      date: (row.date!=null?new Date(row.date).toLocaleDateString():row.date), 
      number: row.number, 
      docNumber: row.docNumber, 
      userName: row.userName, 
      comment: row.comment
    });
  }

  getAllPlanes() {
    return this.dataPlanes;
  }
}

class miniModel {
  constructor(
    public term?: string,
    public filer_name?: string,
    public selectedPlan?: number,
    public selected_last?: string,
    public selected_wo_name?: string,
    public selected_hep?: string[],
    public selected_sub?: string[],
    public selected_rb?: string[],
    public selected?: string[],
    public input_water_info?: string,
    public inputs_found_wo?: string,
  ) {
  }
}

