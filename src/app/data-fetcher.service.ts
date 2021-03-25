import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { LocatorService } from './locator.service';
import { DatePipe } from '@angular/common';
import { RequestObj } from './content_comps/control/control.component';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class DataFetcherService {

  removeEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  allPortsResponse: EventEmitter<any> = new EventEmitter<any>();

  allInResponse: EventEmitter<any> = new EventEmitter<any>();
  allOutResponse: EventEmitter<any> = new EventEmitter<any>();
  connectionResponse: EventEmitter<any> = new EventEmitter<any>();
  removeRouteEmitter: EventEmitter<any> = new EventEmitter<any>();

  longestCon: EventEmitter<any> = new EventEmitter<any>();
  shortestCon: EventEmitter<any> = new EventEmitter<any>();

  activeTrafficInfo: EventEmitter<any> = new EventEmitter<any>();
  hoverPos: EventEmitter<any> = new EventEmitter<any>();
  route: EventEmitter<any> = new EventEmitter<any>();
  trackerResponse: EventEmitter<any> = new EventEmitter<any>();
  trafficClick: EventEmitter<any> = new EventEmitter<any>();
  
  mapClick: EventEmitter<any> = new EventEmitter<any>();

  destinationEmitter: EventEmitter<RequestObj[]> = new EventEmitter<RequestObj[]>();

  constructor(private http: HttpClient,
    private datePipe: DatePipe, private locService: LocatorService) { }


  getTraffic(): Observable<any> {
    let startDate: Date = new Date();
    let endDate: Date = new Date(startDate.setMonth(startDate.getMonth() + 1));
    let dateString: String = '/dateFrom/' + this.datePipe.transform(new Date(), 'yyyy-MM-dd').toString() +
      '/dateTo/' + this.datePipe.transform(endDate, 'yyyy-MM-dd').toString();
    console.log(environment.trafficUrl + dateString)
    return this.http.get(environment.trafficUrl + dateString).pipe(
      map(res => res as JSON)
    );
  }

  getRoute(body: object, params: String): Observable<any> {
    return this.requester(environment.apiUrl + '/find-route' + params, "post", 
                         { 'Content-Type': 'application/json' }, JSON.stringify(body),
                         this.connectionResponse);
  }

  removeRoute() {
    this.removeEmitter.emit(true);
  }

  getKmFromLocator(coords: number[]): Observable<RequestObj> {
    return this.requester(environment.apiUrl  + '/coords-to-km', "post", 
                         { 'Content-Type': 'application/json' }, JSON.stringify(coords),
                         undefined);
  } 

  requester(url: string, method: string, inHeaders: object = {},
    body: string = "{}", emitter: EventEmitter<any>): Observable<any> {
    return this.http[method](url, body, { headers: inHeaders }).
      pipe(
        map((res) => {
          if (emitter) {
            emitter.emit(res);
          }
          return res;
        }),
        catchError(err => {
          console.log(err)
          const errorMsg = err.error.msg ? err.error.msg : "no details provided!"
          alert("An error occured, try again later :(" +
                "\nHttp-Status: " + err.status + " " + err.statusText +
                "\nMessage: " + errorMsg)
          return of();
        })
      );
  }
}
