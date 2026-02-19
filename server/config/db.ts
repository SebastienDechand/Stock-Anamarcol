import mongoose from "mongoose";
import { promises as dnsPromises } from "node:dns";
import https from "node:https";

const SRV_HOST = "anamarcol.fa6bdkr.mongodb.net";
const DB_NAME = "Anamarcol";
const RETRY_DELAY_MS = 5_000;

// Prevent unhandled rejection crashes (Node 22 default behaviour)
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection (suppressed):", reason);
});

// ── DNS-over-HTTPS resolver (port 443, never blocked by VPNs) ──

interface DoHAnswer {
  data: string;
}

function dohQuery(name: string, type: string): Promise<DoHAnswer[]> {
  return new Promise((resolve, reject) => {
    const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => (data += chunk.toString()));
        res.on("end", () => {
          try {
            const json = JSON.parse(data) as { Answer?: DoHAnswer[] };
            resolve(json.Answer ?? []);
          } catch {
            reject(new Error(`DoH parse error for ${type} ${name}`));
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * Resolve mongodb+srv:// SRV records via Google DNS-over-HTTPS,
 * then build a standard mongodb:// connection string.
 */
async function resolveSrvViaDoH(): Promise<string> {
  const srvAnswers = await dohQuery(`_mongodb._tcp.${SRV_HOST}`, "SRV");
  if (srvAnswers.length === 0) throw new Error("No SRV records found via DoH");

  // SRV data format: "priority weight port target"
  const hosts = srvAnswers.map((a) => {
    const parts = a.data.split(" ");
    const port = parts[2];
    const target = parts[3].replace(/\.$/, "");
    return `${target}:${port}`;
  });

  // TXT records contain connection options (e.g. retryWrites=true&w=majority)
  let txtOptions = "";
  try {
    const txtAnswers = await dohQuery(SRV_HOST, "TXT");
    if (txtAnswers.length > 0) {
      txtOptions = "&" + txtAnswers[0].data.replace(/"/g, "");
    }
  } catch {
    // TXT is optional
  }

  // Encode credentials for safe use in a standard mongodb:// URI
  const [user, ...passParts] = (process.env.DB_USER_PASS ?? "").split(":");
  const pass = passParts.join(":"); // handle passwords containing ':'
  const encodedCreds = `${encodeURIComponent(user)}:${encodeURIComponent(pass)}`;

  return `mongodb://${encodedCreds}@${hosts.join(",")}/${DB_NAME}?tls=true${txtOptions}`;
}

// ── Connection strategy ──

/**
 * 1. Try standard SRV resolution (works on normal networks)
 * 2. If blocked → resolve via DNS-over-HTTPS (works behind VPNs)
 * 3. If a MONGO_URI env var is set, use it directly (manual override)
 */
async function resolveMongoURI(): Promise<string> {
  if (process.env.MONGO_URI) {
    console.log("Using MONGO_URI from environment");
    return process.env.MONGO_URI;
  }

  try {
    await dnsPromises.resolveSrv(`_mongodb._tcp.${SRV_HOST}`);
    console.log("DNS SRV resolution OK — using mongodb+srv://");
    return `mongodb+srv://${process.env.DB_USER_PASS}@${SRV_HOST}/${DB_NAME}`;
  } catch {
    console.warn(
      "DNS SRV resolution failed (VPN/tethering?) — resolving via DNS-over-HTTPS...",
    );
    const uri = await resolveSrvViaDoH();
    console.log("Resolved MongoDB hosts via DoH successfully");
    return uri;
  }
}

function connectWithRetry(attempt = 1): Promise<void> {
  return resolveMongoURI()
    .then((uri) =>
      mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
        family: 4,
      }),
    )
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`MongoDB connection attempt ${attempt} failed: ${message}`);
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      return new Promise<void>((resolve) =>
        setTimeout(
          () => resolve(connectWithRetry(attempt + 1)),
          RETRY_DELAY_MS,
        ),
      );
    });
}

// Log connection events (informational, never throws)
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected — will reconnect automatically");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

export const connectDB = connectWithRetry;
