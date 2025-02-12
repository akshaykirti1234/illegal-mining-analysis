import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  private apiUrl = "http://localhost:8000/"

  constructor(private http: HttpClient) { }

  public getJodaBoundary(): Observable<any> {
    return this.http.get(`${this.apiUrl}getJodaGeoJSON`);
  }

}
