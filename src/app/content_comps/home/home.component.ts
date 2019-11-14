import { Component, OnInit } from '@angular/core';
import { DataFetcherService } from 'src/app/data-fetcher.service';

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
    { id: "from", km: 0 },
    { id: "to", km: 0 },
  ];
  constructor(
    private dataFetcher: DataFetcherService
  ) { }

  ngOnInit() {
    console.log(this.reqArray)
  }

  addStop(): void {
    this.reqArray.push({ id: "to", km: 0 })
  }


  buildRequest(): object {
    let body: requestBody = {
                bwastrIdFrom: "",
                bwastrKmFrom: 0,
                bwastrIdTo: "",
                bwastrKmTo: 0 };
    let bodyArr: requestBody[] = [];
    let i: number = 0;
    console.log(this.reqArray)
    for (const obj of this.reqArray) {
      if (i % 2 === 0) {
        body.bwastrIdFrom = obj.id;
        body.bwastrKmFrom = obj.km;
      } else {
        body.bwastrIdTo = obj.id;
        body.bwastrKmTo = obj.km;

        bodyArr.push(body);
      }
      i = i +1;
    }
    return bodyArr;
  }

  findRoute(): void {
    this.dataFetcher.getRoute(this.buildRequest());
  }


}
