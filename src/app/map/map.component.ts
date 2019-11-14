import { Component, OnInit, EventEmitter } from '@angular/core';
import {
  latLng, Leaflet, tileLayer, map, Map, locationfound, geoJSON, polygon, circle, Path, DomEvent, DomUtil, control, InteractiveLayerOptions,
  CRS, Layer, GeoJSON, layerGroup, FeatureGroup, LayerGroup, LeafletMouseEvent, popup, circleMarker, TileLayer, latLngBounds,
  LatLng, GeoJSONOptions, SVG
} from 'leaflet';

import 'leaflet-routing-machine';
import { LocatorService } from '../locator.service';
import { DataFetcherService } from '../data-fetcher.service';
import { ActivatedRoute, Router } from '@angular/router';

declare var L: Leaflet;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  private map: Map;
  private pos: number[];
  private geojsonLayers: LayerGroup = layerGroup();
  private tracker: LayerGroup = layerGroup();
  private route;
  private trafficInfo;


  // base maps
  cartoDB_DarkMatter: TileLayer = tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
  });
  cartoDB_Voyager: TileLayer = tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
  });

  baseMaps: any = {
    'light': this.cartoDB_Voyager,
    'dark': this.cartoDB_DarkMatter,

  };

  overlayMaps: any = {
  };

  locateCircle(e): void {
    this.pos = e.latLng;
    let radius = e.accuracy / 2;
    circle(e.latlng, radius).addTo(this.map);
  }

  constructor(
    private datafetcher: DataFetcherService,
  ) {

  }

  ngOnInit(): void {
    // inital map creation
    this.map = this.map = map('map', {
      center: [52.5, 13.4],
      zoom: 14,
      maxZoom: 14,
      minZoom: 6,
      renderer: L.canvas({ padding: 0.5 }),
      /*new SVG({
        padding: 1
      }),*/
      layers: [this.cartoDB_Voyager, this.geojsonLayers, this.tracker]
    });
    control.layers(this.baseMaps).addTo(this.map);

    this.map.locate({ setView: true, maxZoom: 10});

    this.map.on('locationfound', (e) => {
      let radius = e.accuracy / 2;
      circle(e.latlng, { color: 'red', fillOpacity: 0.5, radius: radius }).addTo(this.map);
    });

    this.datafetcher.removeEmitter.subscribe((res) => {
      this.geojsonLayers.clearLayers();
      this.tracker.clearLayers();
    });


    this.datafetcher.hoverPos.subscribe((res: any) => {
      this.map.setView([res.lat, res.lon], 12);
    });

    this.datafetcher.getTraffic().subscribe((res: any) =>  {
      this.trafficInfo = res["ntsMessages"]["FTM"]
      const layerStyle: object =  {
        style: function(feature) {
            switch (feature.properties.messageType) {
                case 'INFORMATION': return {color:"#2EC4B6", weight: 5 };
                case 'OBSTRUCTION':   return {color: "#FF9F1C", weight: 4};
                case 'WARNING':   return {color: "#E55934", weight: 3};
                case 'LOCKING':   return {color: "#E71D36", weight: 2};
            }
        }
      }
      L.geoJSON(this.trafficInfo, layerStyle).addTo(this.map);
    });

    this.datafetcher.connectionResponse.subscribe((res: any) =>  {
      this.route = res["route"]
      console.log(this.route)
      const layerStyle: object =  {
        style: function(feature) {
            switch (feature.properties.messageType) {
                case 'INFORMATION': return {color:"#2EC4B6", weight: 5 };
                case 'OBSTRUCTION':   return {color: "#FF9F1C", weight: 4};
                case 'WARNING':   return {color: "#E55934", weight: 3};
                case 'LOCKING':   return {color: "#E71D36", weight: 2};
            }
        }
      }
      L.geoJSON(this.trafficInfo, layerStyle).addTo(this.map);
    });


    this.map.on('click', (e) => { console.log(e.latlng); });

 

  }

}
