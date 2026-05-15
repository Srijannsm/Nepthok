import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Prisma } from "@nepthok/database";
import { Request, Response } from "express";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.mapError(exception);

    response.status(status).json({
      success: false,
      error: {
        code: status,
        message,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private mapError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (exception.code) {
      case "P2002":
        return {
          status: HttpStatus.CONFLICT,
          message: "A record with this value already exists.",
        };
      case "P2025":
        return {
          status: HttpStatus.NOT_FOUND,
          message: "The requested record was not found.",
        };
      case "P2003":
        return {
          status: HttpStatus.BAD_REQUEST,
          message: "Related record not found.",
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "An unexpected database error occurred.",
        };
    }
  }
}
