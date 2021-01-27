import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DataFetcherService } from 'src/app/data-fetcher.service';
import { Subscription } from 'rxjs';
export interface RequestObj {
    BwastrID: string;
    km: number;
    coords: number[];
}

interface requestBody {
    bwastrIdFrom: string;
    bwastrKmFrom: number;
    bwastrIdTo: string;
    bwastrKmTo: number;
}

@Component({
    selector: 'app-control',
    templateUrl: './control.component.html',
    styleUrls: ['./control.component.css']
})

export class ControlComponent implements OnInit {
    reqArray: RequestObj[] = [];
    isExpand: boolean = true;
    selectedMoment: Date;
    vType: string = "BSF";
    style: number = 0;
    speed: number = 15;
    opt: boolean = false;
    oneWay: boolean = false;
    isAnalyze: boolean = false;
    isLoading: boolean = false;

    ignoreMessage: boolean = false;
    ignoreSluice: boolean = false;

    acitveDestination: number; 

    locatorLoading: boolean = false;

    constructor(
        private dataFetcher: DataFetcherService,
        private datePipe: DatePipe
    ) {
    }

    ngOnInit() {
        this.dataFetcher.mapClick.subscribe(async res =>  {
            if (isNaN(this.acitveDestination)) {
                // no destination set bail out
                return
            }
            const locatorRes: RequestObj = await this.getKm(res.latlng);
            this.reqArray[this.acitveDestination] = {BwastrID: locatorRes.BwastrID, km: locatorRes.km, coords: locatorRes.coords};
            // filter empty entries
            this.reqArray = this.reqArray.filter(i => i.coords.length === 2)
            this.dataFetcher.destinationEmitter.emit(this.reqArray);
            this.acitveDestination = undefined;
        });
    }

    addStop(): void {
        this.reqArray.push({ BwastrID: "to", km: 0, coords:[]})
    }

    waitForMapClick(index: number) {
        this.acitveDestination = index;
    }

    async getKm(coords: {lat:number, lng:number}): Promise<RequestObj> {
        console.log("get km")
        this.locatorLoading = true;
        const res = await this.dataFetcher.getKmFromLocator([coords.lng,coords.lat]).toPromise();
        this.locatorLoading = false;
        return res; 
    }

    removeStop(i: number): void {
        this.reqArray.splice(i, 1);
        this.dataFetcher.destinationEmitter.emit(this.reqArray);
    }

    // build requestbody 
    buildRequest(): object {
        let body: requestBody = {
            bwastrIdFrom: "",
            bwastrKmFrom: 0,
            bwastrIdTo: "",
            bwastrKmTo: 0
        };
        let bodyArr: requestBody[] = [];
        let pointsArr: RequestObj[] = [];

        let j: number = 0;
        let i: number = 0;

        this.reqArray = this.reqArray.filter(i => i.coords.length === 2)

        for (const obj of this.reqArray) {
            pointsArr.push(obj);
            if (j > 0 && j < this.reqArray.length - 1) {
                pointsArr.push(obj);
            }
            j = j + 1;
        }
        for (const obj of pointsArr) {
            if (i % 2 === 0) {
                body.bwastrIdFrom = obj.BwastrID;
                body.bwastrKmFrom = obj.km;
            } else {
                body.bwastrIdTo = obj.BwastrID;
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

    // building request, set params and call api
    async findRoute() {
        this.isLoading = true;
        let params: string = "?type=" + this.vType + "&style=" +
            this.style + "&speed=" + this.speed;
        if (this.reqArray.length > 2) {
            params += "&optimize=" + this.opt;
            params += "&oneway=" + this.oneWay;
        }
        if (this.selectedMoment !== undefined) {
            let time = this.datePipe.transform(this.selectedMoment, 'yyyy-MM-dd-HH-mm').toString();
            console.log(time)
            params += "&time=" + time;
        }
        params += "&elwisformat=false";
        params += "&analyze=" + this.isAnalyze;

        params += "&ignoreMessages="+this.ignoreMessage;
        params += "&ignoreSluice="+this.ignoreSluice;
        
        
        this.dataFetcher.getRoute(this.buildRequest(), params).subscribe(
            (res) => {
                this.isLoading = false;
                },
            ).add(() => this.isLoading = false);
    }

    typeChange(e: string): void {
        this.vType = e;
        if ("BSF".match(e)) {
            this.style = 0;
        }
    }

    styleChange(s: number): void {
        this.style = s;
    }

    expandCard(): void {
        this.isExpand = this.isExpand ? false : true;
    }
    getBtn(): String {
        if (this.isAnalyze) {
            return "warn"
        }
        return "disabled"
    }
    setAnalyze(): void {
        this.isAnalyze = this.isAnalyze ? false : true;
    }
}
