import { Component } from '@angular/core';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { OSM, XYZ } from 'ol/source';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent {
  map!: Map;
  defaultLayer!: TileLayer<OSM>;
  satelliteLayer!: TileLayer<XYZ>;
  isSatellite: boolean = false;
  showFilters: boolean = false;

  // Dummy data for filters (replace with actual data if available)
  districts: string[] = ['District 1', 'District 2', 'District 3'];
  blocks: string[] = ['Block A', 'Block B', 'Block C'];
  lessees: string[] = ['Lessee X', 'Lessee Y', 'Lessee Z'];

  selectedDistrict: string = '';
  selectedBlock: string = '';
  selectedLessee: string = '';

  ngAfterViewInit(): void {
    // Default OSM layer
    this.defaultLayer = new TileLayer({
      source: new OSM(),
    });

    // Satellite Layer (using Bing Maps)
    this.satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', // Google Satellite
      }),
      visible: false, // Initially hidden
    });

    this.map = new Map({
      target: 'map',
      layers: [this.defaultLayer, this.satelliteLayer],
      view: new View({
        center: [0, 0], // Default center, change as needed
        zoom: 2,
      }),
    });
  }

  toggleMapType(): void {
    this.isSatellite = !this.isSatellite;
    this.defaultLayer.setVisible(!this.isSatellite);
    this.satelliteLayer.setVisible(this.isSatellite);
  }

  toggleFilterPanel(): void {
    this.showFilters = !this.showFilters;
  }

  applyFilters(): void {
    console.log('Filters applied:', {
      district: this.selectedDistrict,
      block: this.selectedBlock,
      lessee: this.selectedLessee
    });
    // Implement filtering logic here
  }
}
