import { Component, OnInit } from '@angular/core';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Geolocation } from '@capacitor/geolocation';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit{
  locations: { position: number, time: string, latitude: number, longitude: number }[] = [];
  duplicateLocationAlert: boolean = false;

  //B
  isSupported = false;
  barcodes: Barcode[] = [];

  constructor(private alertController: AlertController) {

    this.loadSavedLocations();

  }

  ngOnInit() {
    BarcodeScanner.isSupported().then((result) => {
      this.isSupported = result.supported;
    });
  }

  async getCurrentLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      const newLocation = {
        position: this.locations.length + 1,
        time: new Date().toLocaleString(),
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude
      };
      
      // Verificar si la nueva ubicación es diferente de las anteriores
      const isNewLocation = !this.locations.some(location =>
        location.latitude === newLocation.latitude && location.longitude === newLocation.longitude
      );

      
      if (isNewLocation) {
        console.log(newLocation)
        console.log("aceptada")

        this.locations.push(newLocation);
        this.newLocationAlert(newLocation);
        this.saveLocations();

        this.scan(newLocation);

        // Mostrar la alerta si la ubicación es duplicada
        if (!isNewLocation && this.locations.length > 1) {
          this.showDuplicateLocationAlert(newLocation);
        }
      }else{

        console.log(newLocation)
        console.log("rechazada")
        this.showDuplicateLocationAlert(newLocation);

      }
    } catch (error) {
      console.error('Error al obtener la ubicación:', error);
    }
  }

  saveLocations() {
    localStorage.setItem('savedLocations', JSON.stringify(this.locations));
  }

  loadSavedLocations() {
    const savedLocationsString = localStorage.getItem('savedLocations');
    if (savedLocationsString) {
      this.locations = JSON.parse(savedLocationsString);
    }
  }

  clearLocalStorage() {
    localStorage.removeItem('savedLocations');
    this.locations = [];
  }

  async showDuplicateLocationAlert(location: any) {
    const alert = await this.alertController.create({
      header: 'Ubicación Duplicada',
      message: 'La ubicación actual ya se ha registrado anteriormente. '+location.latitude + " " + location.longitude,
      buttons: ['Aceptar']
    });

    await alert.present();
  }

  async newLocationAlert(location: any) {
    const alert = await this.alertController.create({
      header: 'Ubicación Nueva',
      message: 'La ubicación actual se ha registrado correctamente. '+location.latitude + " " + location.longitude,
      buttons: ['Aceptar']
    });

    await alert.present();
  }

  generateRoute() {

    if (this.locations.length < 4) {
      return; // Salir de la función si no hay suficientes ubicaciones
    }

    // Generar la URL de la ruta en Google Maps
    const origin = `${this.locations[0].latitude},${this.locations[0].longitude}`;
    const waypoints = this.locations.slice(1, -1).map(location => `${location.latitude},${location.longitude}`);
    const destination = `${this.locations[this.locations.length - 1].latitude},${this.locations[this.locations.length - 1].longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints.join('|')}`;

    // Mostrar el mapa en el navegador
    window.open(url, '_blank');
  }


  //B

  async scan(Locat: any): Promise<void> {

    const granted = await this.requestPermissions();
    if (!granted) {
      this.presentAlert();
      return;
    }
    const { barcodes } = await BarcodeScanner.scan();
    this.barcodes.push(...barcodes);
    //this.locations.push(Locat);
    //this.newLocationAlert(Locat);
    //this.saveLocations();

  }

  async requestPermissions(): Promise<boolean> {
    const { camera } = await BarcodeScanner.requestPermissions();
    //this.presentAlert();
    return camera === 'granted' || camera === 'limited';
  }

  async presentAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission denied',
      message: 'Please grant camera permission to use the barcode scanner.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  redirectToUrl() {
    const url = "https://www.youtube.com/watch?v=uHgt8giw1LY"; // Aquí debes poner la URL a la que deseas redirigir
    window.open(url, '_blank'); // Abrir la URL en una nueva pestaña del navegador
  }

}
