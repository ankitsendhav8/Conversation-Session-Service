import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again later.';

interface MongooseValidationError extends Error {
    name: 'ValidationError';
    errors: Record<
        string,
        { message?: string; kind?: string; path?: string }
    >;
}

function formatMongooseValidationMessage(err: MongooseValidationError): string {
    const messages = Object.entries(err.errors || {}).map(
        ([field, details]) => {
            const msg = details?.message || '';
            // Convert "Path `field` is required." -> "Field 'field' is required"
            if (details?.kind === 'required' || msg.includes('is required')) {
                return `Field '${field}' is required.`;
            }
            if (msg.includes('is missing')) {
                return `Field '${field}' is missing.`;
            }
            return msg.replace(/^Path `(\w+)`\.?\s*/i, `Field '$1': `);
        },
    );
    return messages.join(' ');
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status: number;
        let message: string;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            message =
                typeof exceptionResponse === 'string'
                    ? exceptionResponse
                    : (exceptionResponse as { message?: string | string[] })
                          ?.message
                    ? Array.isArray(
                          (exceptionResponse as { message: string[] }).message,
                      )
                        ? (exceptionResponse as { message: string[] })
                              .message[0]
                        : (exceptionResponse as { message: string }).message
                    : exception.message;
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = GENERIC_ERROR_MESSAGE;
            this.logger.error(
                `Unhandled exception: ${exception instanceof Error ? exception.message : String(exception)}`,
                exception instanceof Error ? exception.stack : undefined,
            );
        }

        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
        });
    }
}
