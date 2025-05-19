export interface SuccessResponse<T>{
    traceId:string;
    data: T;
}