"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RefreshToken_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenSchema = exports.RefreshToken = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const class_transformer_1 = require("class-transformer");
const mongoose = require("mongoose");
const user_schema_1 = require("./user.schema");
let RefreshToken = RefreshToken_1 = class RefreshToken {
};
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value.toString()),
    __metadata("design:type", String)
], RefreshToken.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose.Schema.Types.ObjectId, ref: user_schema_1.User.name }),
    (0, class_transformer_1.Type)(() => user_schema_1.User),
    __metadata("design:type", user_schema_1.User)
], RefreshToken.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }),
    __metadata("design:type", Date)
], RefreshToken.prototype, "expires", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], RefreshToken.prototype, "createdByIp", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], RefreshToken.prototype, "userAgent", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], RefreshToken.prototype, "revokedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose.Schema.Types.ObjectId, ref: RefreshToken_1.name }),
    __metadata("design:type", Object)
], RefreshToken.prototype, "replacedByToken", void 0);
RefreshToken = RefreshToken_1 = __decorate([
    (0, mongoose_1.Schema)()
], RefreshToken);
exports.RefreshToken = RefreshToken;
const RefreshTokenSchema = mongoose_1.SchemaFactory.createForClass(RefreshToken);
exports.RefreshTokenSchema = RefreshTokenSchema;
RefreshTokenSchema.virtual('isExpired').get(function () {
    return new Date() > this.expires;
});
RefreshTokenSchema.virtual('isActive').get(function () {
    return !this.isExpired && !this.revokedAt;
});
//# sourceMappingURL=refreshToken.schema.js.map