export class AppError extends Error {
    statusCode: number;
  
    constructor(message: string, statusCode = 500) {
      super(message);
      this.name = this.constructor.name;
      this.statusCode = statusCode;
  
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }

  export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
      super(message, 404);
    }
  }