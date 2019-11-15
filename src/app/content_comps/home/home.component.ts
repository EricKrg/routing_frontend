import { Component, OnInit } from '@angular/core';
import { DataFetcherService } from 'src/app/data-fetcher.service';
import { DatePipe } from '@angular/common';
import { FormGroup, FormBuilder } from '@angular/forms';

interface requestObj {
  id: string;
  km: number;
}

interface requestBody {
  bwastrIdFrom: string;
  bwastrKmFrom: number;
  bwastrIdTo: string;
  bwastrKmTo: number;
}


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  reqArray: requestObj[] = [
    { id: "3101", km: 100 },
    { id: "0701", km: 650 },
  ];
  selectedMoment: Date;
  vType: String = "FSF";

  constructor(
    private dataFetcher: DataFetcherService,
    private datePipe: DatePipe,
  ) {
   }

  ngOnInit() {
    console.log(this.reqArray)
  }

  addStop(): void {
    this.reqArray.push({ id: "to", km: 0 })
  }

  removeStop(i:number): void {
    this.reqArray.splice(i, 1);
  }

  buildRequest(): object {
    let body: requestBody = {
      bwastrIdFrom: "",
      bwastrKmFrom: 0,
      bwastrIdTo: "",
      bwastrKmTo: 0
    };
    let bodyArr: requestBody[] = [];
    let pointsArr: requestObj[] = [];

    let j: number = 0;
    let i: number = 0;
    for (const obj of this.reqArray) {
      pointsArr.push(obj);
      if (j > 0 && j < this.reqArray.length-1) {
        pointsArr.push(obj);
      }
      j = j + 1;
    }
    for (const obj of pointsArr) {
      if (i % 2 === 0) {
        body.bwastrIdFrom = obj.id;
        body.bwastrKmFrom = obj.km;
      } else {
        body.bwastrIdTo = obj.id;
        body.bwastrKmTo = obj.km;

        bodyArr.push(body);
        body = {
          bwastrIdFrom: "",
          bwastrKmFrom: 0,
          bwastrIdTo: "",
          bwastrKmTo: 0
        };
      }
      i = i + 1;
    }
    return bodyArr;
  }

  findRoute(): void {
    let params: string = "?";
    console.log(this.vType)
    if (this.selectedMoment !== undefined) {
      let time =  this.datePipe.transform(this.selectedMoment, 'yyyy-MM-dd-HH-mm').toString()
      console.log(time)
      params += "time="+time
    }
    console.log(params)
    this.dataFetcher.getRoute(this.buildRequest(), params);
  }


}
