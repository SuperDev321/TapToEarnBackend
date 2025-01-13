import * as crypto from "crypto";

/**
 * Generates a random hex string.
 * @param {number} length - Length of the hex string.
 * @returns {Promise<string>} - Random hex string.
 */
export function generateRandomHex(length) {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(length / 2, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer.toString("hex"));
      }
    });
  });
}
