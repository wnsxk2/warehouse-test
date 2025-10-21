import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2002':
        // Unique constraint violation
        status = HttpStatus.CONFLICT;
        message = `Duplicate entry for ${(exception.meta?.target as string[])?.join(', ') || 'field'}`;
        break;

      case 'P2003':
        // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Foreign key constraint violation';
        break;

      case 'P2025':
        // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;

      case 'P2014':
        // Invalid ID
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid ID provided';
        break;

      case 'P2000':
        // Value too long
        status = HttpStatus.BAD_REQUEST;
        message = 'Value is too long for the field';
        break;

      case 'P2001':
        // Record does not exist
        status = HttpStatus.NOT_FOUND;
        message = 'Record does not exist';
        break;

      case 'P2011':
        // Null constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Null constraint violation';
        break;

      case 'P2012':
        // Missing required value
        status = HttpStatus.BAD_REQUEST;
        message = 'Missing required value';
        break;

      case 'P2015':
        // Related record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Related record not found';
        break;

      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Database error occurred';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.code,
      timestamp: new Date().toISOString(),
    });
  }
}
