"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketAdapter = void 0;
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
class SocketAdapter extends platform_socket_io_1.IoAdapter {
    createIOServer(port, options) {
        const server = super.createIOServer(port, Object.assign(Object.assign({}, options), { cors: {
                origin: 'http://localhost:3001',
                methods: ['GET', 'POST'],
                credentials: true,
            } }));
        return server;
    }
}
exports.SocketAdapter = SocketAdapter;
//# sourceMappingURL=websocket.adapter.js.map