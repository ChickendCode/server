"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const cookieParser = require("cookie-parser");
const websocket_adapter_1 = require("./gateway/websocket.adapter");
async function bootstrap() {
    let app;
    try {
        app = await core_1.NestFactory.create(app_module_1.AppModule, {
            abortOnError: false,
        });
        app.enableCors({
            origin: ['http://localhost:3001'],
            credentials: true,
        });
        app.use(cookieParser());
        app.useWebSocketAdapter(new websocket_adapter_1.SocketAdapter(app));
        await app.listen(3000);
    }
    catch (error) {
        console.log('here');
        console.log(error);
        process.exit();
    }
}
bootstrap();
//# sourceMappingURL=main.js.map