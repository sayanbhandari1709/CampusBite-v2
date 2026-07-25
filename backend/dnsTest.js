const dns = require("dns");

console.log("Node Version:", process.version);

dns.resolveSrv(
  "_mongodb._tcp.cluster0.e1i6sni.mongodb.net",
  (err, records) => {
    console.log("ERROR:");
    console.dir(err, { depth: null });

    console.log("\nRECORDS:");
    console.dir(records, { depth: null });
  }
);