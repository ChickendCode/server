import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare class AppValidationPipe implements PipeTransform<any> {
    transform(value: any, { metatype }: ArgumentMetadata): Promise<any>;
    private toValidate;
}
