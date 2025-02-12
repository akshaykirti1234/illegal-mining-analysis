import { Component, AfterViewInit } from '@angular/core';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { OSM, XYZ } from 'ol/source';
import { MapService } from 'src/app/services/map.service';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Fill, Stroke } from 'ol/style';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {
  map!: Map;
  defaultLayer!: TileLayer<OSM>;
  satelliteLayer!: TileLayer<XYZ>;
  isSatellite: boolean = false;

  constructor(private mapService: MapService) { }

  ngAfterViewInit(): void {
    this.initMap();
    this.getJodaBoundary();
  }

  // Initialize the map
  initMap(): void {
    this.defaultLayer = new TileLayer({
      source: new OSM(),
    });

    this.satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', // Google Satellite
      }),
      visible: false,
    });

    this.map = new Map({
      target: 'map',
      layers: [this.defaultLayer, this.satelliteLayer],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });
  }

  // Toggle between Satellite and Default map
  toggleMapType(): void {
    this.isSatellite = !this.isSatellite;
    this.defaultLayer.setVisible(!this.isSatellite);
    this.satelliteLayer.setVisible(this.isSatellite);
  }

  // Fetch Joda boundary from API, add to the map, and zoom to it
  public getJodaBoundary(): void {
    this.mapService.getJodaBoundary().subscribe({
      next: (data: any) => {

        const geoJsonData = {
          type: "Feature",
          geometry: {
            type: "MultiPolygon",
            coordinates: data.geometry.coordinates
          },
          properties: {}  // Optional; can be empty
        };

        const vectorSource = new VectorSource({
          features: new GeoJSON().readFeatures(geoJsonData, {
            featureProjection: 'EPSG:3857'
          })
        });

        const vectorLayer = new VectorLayer({
          source: vectorSource,
          style: new Style({
            fill: new Fill({
              color: 'rgba(0, 0, 255, 0.1)',
            }),
            stroke: new Stroke({
              color: '#0000FF',
              width: 2,
            }),
          }),
        });

        this.map.addLayer(vectorLayer);

        // Get the extent of the vector source
        const extent = vectorSource.getExtent();
        const view = this.map.getView();

        // Animate zoom and fit
        view.fit(extent, {
          duration: 2000,
          padding: [50, 50, 50, 50],
        });
      }
    });
  }
}