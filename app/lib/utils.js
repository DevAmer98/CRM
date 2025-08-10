import mongoose from 'mongoose';

export const connectToDB = async () => {
console.log("✅ Loaded MONGO URI:", process.env.MONGO?.slice(0, 25) + '...');

  if (mongoose.connection.readyState === 1) {
    console.log("Already connected to the database");
    return mongoose.connection.asPromise();
  } else if (mongoose.connection.readyState === 0) {
    // Connection is disconnected, try to connect
    return await mongoose.connect(process.env.MONGO);
  } else {
    // Connection is either connecting or disconnecting, wait for it to finish
    return new Promise((resolve, reject) => {
      mongoose.connection.once("open", () => {
        // Connection is open, resolve the promise
        console.log("Connected to the database");
        resolve(mongoose.connection.asPromise());
      });
      mongoose.connection.once("close", () => {
        // Connection is closed, try to connect again
        console.log("Disconnected from the database, trying to reconnect");
        mongoose.connect(process.env.MONGO)
          .then((connection) => {
            // Connection is successful, resolve the promise
            console.log("Connected to the database");
            resolve(connection.asPromise());
          })
          .catch((error) => {
            // Connection failed, reject the promise
            console.error("Failed to connect to the database", error);
            reject(error);
          });
      });
    });
  }
}