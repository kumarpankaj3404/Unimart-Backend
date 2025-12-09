class ApiResponse{
    constructor(
        statusCode,
        data,
        message = "Successful"
    ){
        this.statusCode = statusCode;
        this.data = data;
        this.success = statusCode >= 200 && statusCode < 400;
        this.message = message;
    }
}

export {ApiResponse};