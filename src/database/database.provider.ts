import * as mongoose from 'mongoose';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async (): Promise<mongoose.Connection> => {
      try {
        const connection = await mongoose.connect(
          'mongodb://localhost:27017/caro-play',
        );
        return connection.connection;
      } catch (error) {
        throw error;
      }
    },
  },
];
