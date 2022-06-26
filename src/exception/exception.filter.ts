import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
// import 'source-map-support/register';

/**
 * Filter all exception type
 */
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let errors: string | object;
    let message: string;

    console.log(exception);

    // response with exception statusCode if HttpException, otherwise return 500
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errors = exception.getResponse();
      message = exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }

    return response.status(status).json({
      status,
      message,
      // errors,
    });
  }
}
