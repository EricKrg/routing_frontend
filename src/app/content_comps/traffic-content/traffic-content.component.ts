import { Component, OnInit } from '@angular/core';
import { DataFetcherService } from 'src/app/data-fetcher.service';

@Component({
  selector: 'app-traffic-content',
  templateUrl: './traffic-content.component.html',
  styleUrls: ['./traffic-content.component.css']
})
export class TrafficContentComponent implements OnInit {

  constructor(private dataFetcher: DataFetcherService) { }

  private content: object;
  private contentGeom: object;
  private style: any = {
    "background-color": "primary",
    "color": "white",
  }


  ngOnInit(): void {
    this.dataFetcher.trafficClick.subscribe((res) => {
      this.content = res.layer.feature.properties;
      this.contentGeom = res.layer.feature.geometry
      this.style = this.setInfoStyle();
    })
  }

  show(): boolean {
    return this.content !== undefined;
  }
  setInfoStyle(): void {
    if(this.content !== undefined) {
      console.log(this.content["messageType"])
      if (this.content["messageType"]==='INFORMATION') {
        this.style["background-color"] = "#2EC4B6";
      }
      if(this.content["messageType"]==='OBSTRUCTION'){
        this.style["background-color"] = "#FF9F1C";
      } 
      if(this.content["messageType"]==='WARNING'){
        this.style["background-color"] = "#E55934";
      } 
      if(this.content["messageType"]==='LOCKING'){
        this.style["background-color"] = "#E71D36";
      } 
    }
    return this.style;
  }

  showDate(): string {
    return new Date(this.content["validityPeriodStart"]).toDateString() + " - " +
           new Date(this.content["validityPeriodEnd"]).toDateString()
  }

  toFeature(): void  {
    this.dataFetcher.activeTrafficInfo.emit(this.contentGeom)
  }
  onClose(): void {
    this.content = undefined;
    this.dataFetcher.activeTrafficInfo.emit(undefined)
  }
}
