import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from "./app.component";

import {WebSocketService} from './websocket.service';

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule],
    providers: [WebSocketService],
    bootstrap: [AppComponent]
})
export class AppModule {

}