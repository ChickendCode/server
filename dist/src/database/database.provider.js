"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseProviders = void 0;
const mongoose = require("mongoose");
exports.databaseProviders = [
    {
        provide: 'DATABASE_CONNECTION',
        useFactory: async () => {
            try {
                const connection = await mongoose.connect('mongodb://localhost:27017/caro-play');
                return connection.connection;
            }
            catch (error) {
                throw error;
            }
        },
    },
];
//# sourceMappingURL=database.provider.js.map