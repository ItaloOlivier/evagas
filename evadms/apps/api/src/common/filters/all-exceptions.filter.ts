import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Log the full error details
    console.error('='.repeat(60));
    console.error('[AllExceptionsFilter] Unhandled Exception');
    console.error('='.repeat(60));
    console.error('Path:', request.url);
    console.error('Method:', request.method);
    console.error('Status:', status);
    console.error('Headers:', JSON.stringify(request.headers, null, 2));
    console.error('Exception type:', exception?.constructor?.name);
    console.error('Exception:', exception);
    if (exception instanceof Error) {
      console.error('Stack:', exception.stack);
    }
    console.error('='.repeat(60));

    response.status(status).json({
      statusCode: status,
      message: typeof message === 'string' ? message : (message as any).message || 'Internal server error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
