import { Injectable, signal } from "@angular/core";
import { InterceptorPayload } from "../interfaces/interceptor-payload.interface";

@Injectable({
    providedIn: 'root'
})
export class InterceptorService{
    private _payload = signal<InterceptorPayload>({code:0, message:''});

    get payload(){
        return this._payload.asReadonly();
    }

    emitPayload(payload:InterceptorPayload){
        this._payload.set(payload);
    }

}