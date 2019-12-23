import { Component, OnInit } from '@angular/core';
import { DataFetcherService } from 'src/app/data-fetcher.service';

@Component({
  selector: 'app-route-info',
  templateUrl: './route-info.component.html',
  styleUrls: ['./route-info.component.css']
})
export class RouteInfoComponent implements OnInit {

  delay: number;
  travelTime: number;
  distance: number;
  arrival: string;
  closeCall: boolean;
  impassable: boolean;
  partial: boolean;
  isRoute: boolean = false;
  hasAdditionalInfo: boolean = false;

  constructor(
    private datafetcher: DataFetcherService
  ) { }

  ngOnInit(): void {
    this.datafetcher.connectionResponse.subscribe((res: any) => {
      console.log(res);
      this.partial = res["partial"];
      this.closeCall = res["closeCalls"];
      this.impassable = res["impassable"];
      this.arrival = new Date(res["arrival"]).toLocaleTimeString();
      this.distance = Math.round(res["distance"] * 10) / 10;
      this.delay = Math.round(res["absDelay"] * 10) / 10;
      this.travelTime = Math.round(res["travelTime"] * 10 ) / 10;
      this.isRoute = true;
      // check for additional infos
      this.hasAdditionalInfo = this.impassable || this.closeCall || this.partial
    });
  }

  show(): boolean {
    return true
  }

}
