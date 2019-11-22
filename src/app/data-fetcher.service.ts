import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {Http, Headers} from '@angular/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LocatorService } from './locator.service';
import { DatePipe } from '@angular/common';


@Injectable({
  providedIn: 'root'
})
export class DataFetcherService {

  removeEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  allPortsResponse: EventEmitter<any> = new EventEmitter<any>();

  allInResponse: EventEmitter<any> = new EventEmitter<any>();
  allOutResponse: EventEmitter<any> = new EventEmitter<any>();
  connectionResponse: EventEmitter<any> = new EventEmitter<any>();
  
  longestCon: EventEmitter<any> = new EventEmitter<any>();
  shortestCon: EventEmitter<any> = new EventEmitter<any>();

  activeTrafficInfo: EventEmitter<any> = new EventEmitter<any>();
  hoverPos: EventEmitter<any> = new EventEmitter<any>();
  route: EventEmitter<any> = new EventEmitter<any>();
  trackerResponse: EventEmitter<any> = new EventEmitter<any>();
  trafficClick:EventEmitter<any> = new EventEmitter<any>();

  constructor(private http: HttpClient,
              private datePipe: DatePipe, private locService: LocatorService) { }


  getTraffic(): Observable<any> {
    let startDate: Date = new Date();
    let endDate: Date = new Date(startDate.setMonth(startDate.getMonth() + 1 ));
    let dateString: String = 'dateFrom/' + this.datePipe.transform(new Date(), 'yyyy-MM-dd').toString() +
                             '/dateTo/' + this.datePipe.transform(endDate, 'yyyy-MM-dd').toString();
    console.log(dateString)
    return this.http.get('/traffic/' + dateString).pipe(
      map(res => res as JSON)
    );
  }


  getRoute(body: object, params: String):void {
    this.http.post('/api'+ params,JSON.stringify(body), {
              headers: { 'Content-Type': 'application/json' }}).
    subscribe((res) => this.connectionResponse.emit(res), err => console.log(err));
  }


  requester(url: string, emitter: EventEmitter<any>) {
    return this.http.get('/api/'+url).pipe(
      map(res => res as JSON)
    ).subscribe((res) => emitter.emit(res), error1 => alert('sorry something went wrong :(') )
  }


}
