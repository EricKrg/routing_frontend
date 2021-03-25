import { Component, OnInit, EventEmitter } from '@angular/core';
import {
  latLng, Leaflet, tileLayer, map, Map, locationfound, geoJSON, polygon, circle, Path, DomEvent, DomUtil, control, InteractiveLayerOptions,
  CRS, Layer, GeoJSON, layerGroup, FeatureGroup, LayerGroup, LeafletMouseEvent, popup, circleMarker, TileLayer, latLngBounds,
  LatLng, GeoJSONOptions, SVG, Tooltip
} from 'leaflet';
import { LocatorService } from '../locator.service';
import { DataFetcherService } from '../data-fetcher.service';
import { ElwisMapService } from '../elwis-map.service';

declare var L: Leaflet;

function getColor(type: String): String {
  switch (type) {
    case 'INFORMATION': return "#2EC4B6";
    case 'OBSTRUCTION': return "#FF9F1C";
    case 'WARNING': return "#E55934";
    case 'LOCKING': return "#E71D36";
    default: return "#f75f00"
  }
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  private map: Map;
  private pos: number[];
  private geojsonLayers: LayerGroup = layerGroup();
  private routeLayers: LayerGroup = layerGroup();
  private trafficLayers: LayerGroup = layerGroup();
  private activeTrafficLayer: LayerGroup = layerGroup();
  private toolTipLayer: LayerGroup = layerGroup();
  private tracker: LayerGroup = layerGroup();
  private destinations: LayerGroup = layerGroup();
  private route;
  private trafficInfo;

  

  // layerstyles
  layerStyle: object = {
    style: function (feature) {
      return {
        color: getColor(feature.properties.messageType),
        weight: 3, opacity: 0.8, smoothFactor: 1
      };
    }
  };
  outline: object = {
    style: function () {
      return { color: "#fff", weight: 6 };

    }
  };

  hoverStyle: object = { weight: 16, radius: 14 };


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

  hydda: TileLayer = tileLayer('https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  // atlas: TileLayer = tileLayer.wms('https://sgx.geodatenzentrum.de/wms_webatlasde.light', {
  //   maxZoom: 18,
  //   layers: 'webatlasde.light',
  //   attribution: '',
  //   //opacity: 0.5,
  //   transparent: "true"
  // });

  sentinel: TileLayer = tileLayer.wms('https://sgx.geodatenzentrum.de/wms_sentinel2_de', {
    layers: 'sentinel2-de:rgb', format: "image/png", 
  });

  eu: TileLayer = tileLayer.wms('https://sgx.geodatenzentrum.de/wms_topplus_open', {
    layers: 'web_grau', format: "image/png", transparent: "true"
  })

  warterWays: TileLayer = tileLayer.wms('https://atlas.wsv.bund.de/bwastr/wms?', {
    layers: 'Gewaessernetz', format: "image/png", transparent: "true"
  });

  baseMaps: any = {
    //'atlas': this.atlas,
    'light': this.cartoDB_Voyager,
    'dark': this.cartoDB_DarkMatter,
    'water': this.hydda
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
    private elwisService: ElwisMapService
  ) {

  }

  ngOnInit(): void {
    // inital map creation
    this.map = map('map', {
      center: [52.5, 13.4],
      zoom: 14,
      preferCanvas: true,
      maxZoom: 14,
      minZoom: 6,
      layers: [this.eu, 
        //this.sentinel,
       //  this.atlas,
         this.warterWays,
      this.activeTrafficLayer, this.geojsonLayers, this.routeLayers, this.tracker, this.toolTipLayer, this.destinations]
    });
    control.layers(this.baseMaps).addTo(this.map);

    this.map.locate({ setView: true, maxZoom: 10 });

    this.map.on('locationfound', (e) => {
      let radius = e.accuracy / 2;
      circle(e.latlng, { color: 'red', fillOpacity: 0.5, radius: radius }).addTo(this.map);
    });

    this.datafetcher.removeEmitter.subscribe(() => {
      console.log("remove map")
      this.geojsonLayers.clearLayers();
      this.tracker.clearLayers();
      this.routeLayers.clearLayers();
      console.log(this.routeLayers)
    });

    // everything which manipulates the map is done in the specific service 
    // but not in the map-comp.
    this.elwisService.subTrafficData(this.map,this.trafficLayers, this.activeTrafficLayer);
    this.elwisService.subRoutingResponse(this.map, this.routeLayers,this.toolTipLayer);
    this.elwisService.removeRoute(this.map, this.routeLayers);
    this.elwisService.setDestinationPoints(this.map, this.destinations)
    this.elwisService.getActiveTrafficInfo(this.map, this.activeTrafficLayer);
    this.elwisService.clickListner(this.map, undefined, this.datafetcher.mapClick)
  }
}

