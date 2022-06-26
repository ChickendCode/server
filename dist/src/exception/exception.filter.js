"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let AppExceptionFilter = class AppExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status;
        let errors;
        let message;
        console.log(exception);
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            errors = exception.getResponse();
            message = exception.message;
        }
        else {
            status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
        }
        return response.status(status).json({
            status,
            message,
        });
    }
};
AppExceptionFilter = __decorate([
    (0, common_1.Catch)()
], AppExceptionFilter);
exports.AppExceptionFilter = AppExceptionFilter;
//# sourceMappingURL=exception.filter.js.map